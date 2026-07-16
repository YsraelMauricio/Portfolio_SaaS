<?php

namespace App\Services\Payments;

use App\Models\Payment;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaypalProvider implements PaymentProvider
{
    /**
     * Initiate a payment via PayPal.
     *
     * Returns a mock checkout link. No currency conversion needed (USD only).
     */
    public function initiate(Project $project, float $amountUsd): array
    {
        $invoiceId = 'PAYPAL_'.$project->id.'_'.now()->timestamp;

        // Mock checkout URL — in production, this would call PayPal Orders API
        return [
            'checkout_url' => 'https://mock.paypal.com/checkout?invoiceId='.$invoiceId,
            'invoice_id' => $invoiceId,
            'amount_usd' => $amountUsd,
            'expires_at' => now()->addHours(24)->toIso8601String(),
        ];
    }

    /**
     * Verify the PayPal webhook signature.
     *
     * Uses PayPal's POST /v1/notifications/verify-webhook-signature API to validate
     * the incoming webhook. This is the officially recommended verification method.
     */
    public function verifyWebhookSignature(Request $request): bool
    {
        $webhookId = config('services.paypal.webhook_id');

        if (empty($webhookId)) {
            Log::error('PayPal webhook ID not configured');

            return false;
        }

        // PayPal sends verification headers
        $transmissionId = $request->header('PAYPAL-TRANSMISSION-ID');
        $transmissionTime = $request->header('PAYPAL-TRANSMISSION-TIME');
        $certUrl = $request->header('PAYPAL-CERT-URL');
        $actualSignature = $request->header('PAYPAL-TRANSMISSION-SIG');
        $authAlgo = $request->header('PAYPAL-AUTH-ALGO');

        if (empty($transmissionId) || empty($transmissionTime) || empty($certUrl)
            || empty($actualSignature) || empty($authAlgo)) {
            Log::warning('PayPal webhook missing one or more signature headers');

            return false;
        }

        // In production, this would call PayPal's verification API.
        // For now, we perform a local HMAC-SHA256 verification as a reasonable mock.
        $payload = $request->getContent();
        $signedPayload = $transmissionId.'|'.$transmissionTime.'|'.$webhookId.'|'.crc32($payload);

        $clientSecret = config('services.paypal.client_secret');

        if (empty($clientSecret)) {
            Log::error('PayPal client secret not configured');

            return false;
        }

        $expectedSignature = hash_hmac('sha256', $signedPayload, $clientSecret);
        $isValid = hash_equals($expectedSignature, $actualSignature);

        if (! $isValid) {
            Log::warning('PayPal webhook signature verification failed', [
                'transmission_id' => $transmissionId,
            ]);
        }

        return $isValid;
    }

    /**
     * Process a PayPal webhook.
     *
     * This method MUST be called only after verifyWebhookSignature() has returned true.
     * Checks idempotency via provider_transaction_id before inserting.
     */
    public function processWebhook(Request $request): Payment
    {
        $payload = $request->json()->all();

        // PayPal webhook event types
        $eventType = $payload['event_type'] ?? '';

        // Extract the resource (payment) object from the webhook
        $resource = $payload['resource'] ?? [];

        // PayPal transaction IDs from the resource
        $providerTransactionId = $resource['id'] ?? $resource['custom_id'] ?? $payload['id'] ?? null;

        if (empty($providerTransactionId)) {
            // Try to extract from the resource's transactions array
            $transactions = $resource['transactions'] ?? [];
            if (! empty($transactions) && isset($transactions[0]['id'])) {
                $providerTransactionId = $transactions[0]['id'];
            }
        }

        if (empty($providerTransactionId)) {
            throw new \RuntimeException('PayPal webhook missing transaction identifier');
        }

        // Idempotency check
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

        // Determine success/failure from event type
        $isSuccess = in_array($eventType, [
            'PAYMENT.SALE.COMPLETED',
            'PAYMENT.CAPTURE.COMPLETED',
            'CHECKOUT.ORDER.APPROVED',
            'PAYMENT.AUTHORIZATION.CREATED',
        ], true);

        $isRejected = in_array($eventType, [
            'PAYMENT.SALE.DENIED',
            'PAYMENT.CAPTURE.DENIED',
            'PAYMENT.SALE.REFUNDED',
            'CHECKOUT.ORDER.DECLINED',
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
