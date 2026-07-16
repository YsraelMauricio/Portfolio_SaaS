<?php

namespace App\Services\Payments;

use App\Models\Contract;
use App\Models\Payment;
use App\Models\Project;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OpenBcbProvider implements PaymentProvider
{
    /**
     * The exchange rate key used in the settings table.
     */
    private const EXCHANGE_RATE_KEY = 'openbcb_exchange_rate';

    /**
     * The default exchange rate (USD to BOB) when no setting is found.
     */
    private const DEFAULT_EXCHANGE_RATE = 6.86;

    /**
     * Initiate a payment via OpenBCB (QR code).
     *
     * Converts the USD amount to BOB using the configured exchange rate,
     * rounds per business rules, and returns mock QR data.
     */
    public function initiate(Project $project, float $amountUsd): array
    {
        $exchangeRate = $this->getExchangeRate();
        $amountBob = round($amountUsd * $exchangeRate, 2);

        // Mock QR generation — in production, this would call the OpenBCB API
        return [
            'qr_code_url' => 'https://mock-openbcb.bcb.gob.bo/qr/'.md5($project->id.$amountBob.now()),
            'amount_bob' => $amountBob,
            'amount_usd' => $amountUsd,
            'exchange_rate' => $exchangeRate,
            'expires_at' => now()->addHours(24)->toIso8601String(),
        ];
    }

    /**
     * Verify the OpenBCB webhook signature.
     *
     * OpenBCB sends an HMAC-SHA256 signature in the X-OpenBCB-Signature header.
     * The signature is computed over the raw request body using the API token as the key.
     */
    public function verifyWebhookSignature(Request $request): bool
    {
        $signature = $request->header('X-OpenBCB-Signature');

        if (empty($signature)) {
            Log::warning('OpenBCB webhook missing signature header');

            return false;
        }

        $secret = config('services.openbcb.api_token');

        if (empty($secret)) {
            Log::error('OpenBCB API token not configured');

            return false;
        }

        $payload = $request->getContent();
        $expectedSignature = hash_hmac('sha256', $payload, $secret);

        $isValid = hash_equals($expectedSignature, $signature);

        if (! $isValid) {
            Log::warning('OpenBCB webhook signature verification failed', [
                'expected' => $expectedSignature,
                'received' => $signature,
            ]);
        }

        return $isValid;
    }

    /**
     * Process an OpenBCB webhook.
     *
     * This method MUST be called only after verifyWebhookSignature() has returned true.
     * Checks idempotency via provider_transaction_id before inserting.
     */
    public function processWebhook(Request $request): Payment
    {
        $payload = $request->json()->all();

        $providerTransactionId = $payload['transaction_id'] ?? null;

        if (empty($providerTransactionId)) {
            throw new \RuntimeException('OpenBCB webhook missing transaction_id');
        }

        // Idempotency check: if we've already processed this transaction, return the existing payment
        $existing = Payment::where('provider_transaction_id', $providerTransactionId)->first();

        if ($existing) {
            Log::info('OpenBCB webhook: duplicate transaction_id received', [
                'provider_transaction_id' => $providerTransactionId,
                'existing_payment_id' => $existing->id,
            ]);

            return $existing;
        }

        $projectId = $payload['project_id'] ?? null;
        $contractId = $payload['contract_id'] ?? null;

        if (empty($projectId)) {
            throw new \RuntimeException('OpenBCB webhook missing project_id');
        }

        $project = Project::findOrFail($projectId);

        // Determine the status based on the webhook event
        $eventType = $payload['event'] ?? $payload['status'] ?? 'completed';
        $isSuccess = in_array($eventType, ['completed', 'success', 'confirmed', 'paid'], true);

        // Derive amount from the contract's frozen snapshot, never from client input
        $amountUsd = $payload['amount_usd'] ?? null;
        $amountLocal = $payload['amount_local'] ?? null;
        $exchangeRateUsed = $payload['exchange_rate'] ?? null;

        // If not provided in the webhook, use the latest contract's snapshot
        if ($amountUsd === null && $contractId) {
            $contract = Contract::find($contractId);
            if ($contract && isset($contract->quote_snapshot['price_usd'])) {
                $amountUsd = $contract->quote_snapshot['price_usd'];
            }
        }

        $payment = Payment::create([
            'project_id' => $projectId,
            'contract_id' => $contractId,
            'amount_usd' => $amountUsd ?? 0,
            'method' => 'qr_bcb',
            'local_currency' => 'BOB',
            'amount_local' => $amountLocal,
            'exchange_rate_used' => $exchangeRateUsed ?? $this->getExchangeRate(),
            'provider_transaction_id' => $providerTransactionId,
            'webhook_signature_verified' => true,
            'status' => $isSuccess ? 'confirmed' : 'rejected',
            'paid_at' => $isSuccess ? now() : null,
            'is_test' => $payload['is_test'] ?? $project->is_test,
        ]);

        Log::info('OpenBCB payment processed', [
            'payment_id' => $payment->id,
            'provider_transaction_id' => $providerTransactionId,
            'status' => $payment->status,
        ]);

        return $payment;
    }

    /**
     * Get the current exchange rate from settings.
     */
    private function getExchangeRate(): float
    {
        $rate = Setting::get(self::EXCHANGE_RATE_KEY);

        return $rate ? (float) $rate : self::DEFAULT_EXCHANGE_RATE;
    }
}
