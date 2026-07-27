<?php

namespace App\Services\Payments;

use App\Models\Payment;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaypalProvider implements PaymentProvider
{
    private function getAccessToken(): string
    {
        return Cache::remember('paypal_access_token', 28800, function () {
            $response = Http::asForm()
                ->withBasicAuth(
                    config('services.paypal.client_id'),
                    config('services.paypal.client_secret')
                )
                ->post(config('services.paypal.base_url').'/v1/oauth2/token', [
                    'grant_type' => 'client_credentials',
                ]);

            $response->throw();

            return $response->json('access_token');
        });
    }

    public function initiate(Project $project, float $amountUsd): array
    {
        $invoiceId = 'PAYPAL_'.$project->id.'_'.now()->timestamp;

        return [
            'checkout_url' => 'https://mock.paypal.com/checkout?invoiceId='.$invoiceId,
            'invoice_id' => $invoiceId,
            'amount_usd' => $amountUsd,
            'expires_at' => now()->addHours(24)->toIso8601String(),
        ];
    }

    public function verifyWebhookSignature(Request $request): bool
    {
        $webhookId = config('services.paypal.webhook_id');

        if (empty($webhookId)) {
            Log::error('PayPal webhook ID not configured');

            return false;
        }

        $transmissionId = $request->header('PAYPAL-TRANSMISSION-ID');
        $transmissionTime = $request->header('PAYPAL-TRANSMISSION-TIME');
        $certUrl = $request->header('PAYPAL-CERT-URL');
        $transmissionSig = $request->header('PAYPAL-TRANSMISSION-SIG');
        $authAlgo = $request->header('PAYPAL-AUTH-ALGO');

        if (empty($transmissionId) || empty($transmissionTime) || empty($certUrl)
            || empty($transmissionSig) || empty($authAlgo)) {
            Log::warning('PayPal webhook missing one or more signature headers');

            return false;
        }

        $clientId = config('services.paypal.client_id');
        $clientSecret = config('services.paypal.client_secret');

        // Use the real PayPal verification API when credentials are configured (production).
        // Fall back to local HMAC verification when credentials are absent (dev/test).
        if (! empty($clientId) && ! empty($clientSecret)) {
            return $this->verifyViaApi($request, $transmissionId, $transmissionTime, $certUrl, $transmissionSig, $authAlgo, $webhookId);
        }

        return $this->verifyViaHmac($request, $transmissionId, $transmissionTime, $webhookId, $clientSecret);
    }

    private function verifyViaApi(Request $request, string $transmissionId, string $transmissionTime, string $certUrl, string $transmissionSig, string $authAlgo, string $webhookId): bool
    {
        try {
            $accessToken = $this->getAccessToken();

            $response = Http::withToken($accessToken)
                ->timeout(10)
                ->post(config('services.paypal.base_url').'/v1/notifications/verify-webhook-signature', [
                    'transmission_id' => $transmissionId,
                    'transmission_time' => $transmissionTime,
                    'cert_url' => $certUrl,
                    'auth_algo' => $authAlgo,
                    'transmission_sig' => $transmissionSig,
                    'webhook_id' => $webhookId,
                    'webhook_event' => $request->json()->all(),
                ]);

            $response->throw();

            $verificationStatus = $response->json('verification_status');

            $isValid = $verificationStatus === 'SUCCESS';

            if (! $isValid) {
                Log::warning('PayPal webhook signature verification failed', [
                    'transmission_id' => $transmissionId,
                    'verification_status' => $verificationStatus,
                ]);
            }

            return $isValid;
        } catch (\Exception $e) {
            Log::error('PayPal webhook signature verification error: '.$e->getMessage());

            return false;
        }
    }

    private function verifyViaHmac(Request $request, string $transmissionId, string $transmissionTime, string $webhookId, ?string $clientSecret): bool
    {
        if (empty($clientSecret)) {
            Log::error('PayPal client secret not configured');

            return false;
        }

        $payload = $request->getContent();
        $signedPayload = $transmissionId.'|'.$transmissionTime.'|'.$webhookId.'|'.crc32($payload);

        $expectedSignature = hash_hmac('sha256', $signedPayload, $clientSecret);
        $isValid = hash_equals($expectedSignature, $request->header('PAYPAL-TRANSMISSION-SIG'));

        if (! $isValid) {
            Log::warning('PayPal webhook signature verification failed (local HMAC)', [
                'transmission_id' => $transmissionId,
            ]);
        }

        return $isValid;
    }

    public function processWebhook(Request $request): Payment
    {
        $payload = $request->json()->all();
        $eventType = $payload['event_type'] ?? '';
        $resource = $payload['resource'] ?? [];

        $providerTransactionId = $resource['id'] ?? $resource['custom_id'] ?? $payload['id'] ?? null;

        if (empty($providerTransactionId)) {
            $transactions = $resource['transactions'] ?? [];
            if (! empty($transactions) && isset($transactions[0]['id'])) {
                $providerTransactionId = $transactions[0]['id'];
            }
        }

        if (empty($providerTransactionId)) {
            throw new \RuntimeException('PayPal webhook missing transaction identifier');
        }

        $existing = Payment::where('provider_transaction_id', $providerTransactionId)->first();
        if ($existing) {
            Log::info('PayPal webhook: duplicate transaction_id received', [
                'provider_transaction_id' => $providerTransactionId,
                'existing_payment_id' => $existing->id,
            ]);

            return $existing;
        }

        $projectId = $resource['project_id'] ?? $payload['project_id'] ?? null;
        if (empty($projectId)) {
            throw new \RuntimeException('PayPal webhook missing project_id');
        }

        $project = Project::findOrFail($projectId);

        $isSuccess = in_array($eventType, [
            'PAYMENT.SALE.COMPLETED', 'PAYMENT.CAPTURE.COMPLETED',
            'CHECKOUT.ORDER.APPROVED', 'PAYMENT.AUTHORIZATION.CREATED',
        ], true);

        $isRejected = in_array($eventType, [
            'PAYMENT.SALE.DENIED', 'PAYMENT.CAPTURE.DENIED',
            'PAYMENT.SALE.REFUNDED', 'CHECKOUT.ORDER.DECLINED',
        ], true);

        $status = 'pending';
        if ($isSuccess) {
            $status = 'confirmed';
        } elseif ($isRejected) {
            $status = 'rejected';
        }

        $payment = Payment::create([
            'project_id' => $projectId,
            'contract_id' => $resource['contract_id'] ?? $payload['contract_id'] ?? null,
            'amount_usd' => $resource['amount'] ?? $resource['total'] ?? $payload['amount_usd'] ?? 0,
            'method' => 'paypal',
            'local_currency' => null,
            'amount_local' => null,
            'exchange_rate_used' => null,
            'provider_transaction_id' => $providerTransactionId,
            'webhook_signature_verified' => true,
            'status' => $status,
            'paid_at' => $isSuccess ? now() : null,
            'is_test' => $resource['is_test'] ?? $payload['is_test'] ?? $project->is_test,
        ]);

        Log::info('PayPal payment processed', [
            'payment_id' => $payment->id,
            'provider_transaction_id' => $providerTransactionId,
            'event_type' => $eventType,
            'status' => $payment->status,
        ]);

        return $payment;
    }
}
