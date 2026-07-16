<?php

namespace App\Services\Payments;

use App\Models\Payment;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BinancePayProvider implements PaymentProvider
{
    /**
     * Initiate a payment via Binance Pay.
     *
     * Returns a mock checkout link. No currency conversion needed (USD only).
     */
    public function initiate(Project $project, float $amountUsd): array
    {
        $merchantTradeNo = 'BINANCE_'.$project->id.'_'.now()->timestamp;

        // Mock checkout URL — in production, this would call Binance Pay API
        return [
            'checkout_url' => 'https://mock.binance.com/pay/checkout?merchantTradeNo='.$merchantTradeNo,
            'merchant_trade_no' => $merchantTradeNo,
            'amount_usd' => $amountUsd,
            'expires_at' => now()->addHours(24)->toIso8601String(),
        ];
    }

    /**
     * Verify the Binance Pay webhook signature.
     *
     * Binance Pay uses an HMAC-SHA512 signature computed over the request body,
     * sent in the BinancePay-Signature header.
     */
    public function verifyWebhookSignature(Request $request): bool
    {
        $signature = $request->header('BinancePay-Signature');

        if (empty($signature)) {
            Log::warning('Binance Pay webhook missing signature header');

            return false;
        }

        $secretKey = config('services.binance_pay.secret_key');

        if (empty($secretKey)) {
            Log::error('Binance Pay secret key not configured');

            return false;
        }

        $payload = $request->getContent();
        $expectedSignature = hash_hmac('sha512', $payload, $secretKey);

        $isValid = hash_equals($expectedSignature, $signature);

        if (! $isValid) {
            Log::warning('Binance Pay webhook signature verification failed', [
                'expected' => $expectedSignature,
                'received' => $signature,
            ]);
        }

        return $isValid;
    }

    /**
     * Process a Binance Pay webhook.
     *
     * This method MUST be called only after verifyWebhookSignature() has returned true.
     * Checks idempotency via provider_transaction_id before inserting.
     */
    public function processWebhook(Request $request): Payment
    {
        $payload = $request->json()->all();

        // Binance Pay sends the transaction data in a nested structure
        $bizData = $payload['bizData'] ?? $payload;
        $providerTransactionId = $bizData['merchantTradeNo'] ?? $bizData['prepayId'] ?? $payload['transaction_id'] ?? null;

        // For Binance Pay, the merchantTradeNo is our internal reference; also check prepayId
        $prepayId = $bizData['prepayId'] ?? null;

        // Check both identifiers for idempotency
        $existing = null;

        if ($providerTransactionId) {
            $existing = Payment::where('provider_transaction_id', $providerTransactionId)->first();
        }

        if (! $existing && $prepayId) {
            $existing = Payment::where('provider_transaction_id', $prepayId)->first();
        }

        if ($existing) {
            Log::info('Binance Pay webhook: duplicate transaction_id received', [
                'provider_transaction_id' => $providerTransactionId,
                'prepay_id' => $prepayId,
                'existing_payment_id' => $existing->id,
            ]);

            return $existing;
        }

        $projectId = $bizData['project_id'] ?? $payload['project_id'] ?? null;

        if (empty($projectId)) {
            throw new \RuntimeException('Binance Pay webhook missing project_id');
        }

        $project = Project::findOrFail($projectId);

        // Determine the status based on the webhook event
        $eventType = $bizData['status'] ?? $payload['event_type'] ?? 'PAY_SUCCESS';
        $isSuccess = in_array($eventType, ['PAY_SUCCESS', 'PAY_COMPLETED', 'completed', 'success'], true);

        // Use a stable identifier (prefer prepayId as it's the Binance-specific transaction reference)
        $finalTransactionId = $prepayId ?? $providerTransactionId ?? uniqid('binance_', true);

        $payment = Payment::create([
            'project_id' => $projectId,
            'contract_id' => $bizData['contract_id'] ?? $payload['contract_id'] ?? null,
            'amount_usd' => $bizData['totalFee'] ?? $bizData['amount_usd'] ?? 0,
            'method' => 'binance_pay',
            'local_currency' => null,
            'amount_local' => null,
            'exchange_rate_used' => null,
            'provider_transaction_id' => $finalTransactionId,
            'webhook_signature_verified' => true,
            'status' => $isSuccess ? 'confirmed' : 'rejected',
            'paid_at' => $isSuccess ? now() : null,
            'is_test' => $bizData['is_test'] ?? $payload['is_test'] ?? $project->is_test,
        ]);

        Log::info('Binance Pay payment processed', [
            'payment_id' => $payment->id,
            'provider_transaction_id' => $finalTransactionId,
            'status' => $payment->status,
        ]);

        return $payment;
    }
}
