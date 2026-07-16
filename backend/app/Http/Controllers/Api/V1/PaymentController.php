<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\ConfirmPaymentRequest;
use App\Http\Requests\Payment\InitiatePaymentRequest;
use App\Http\Requests\Payment\UploadProofRequest;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\Project;
use App\Models\Setting;
use App\Models\User;
use App\Services\Payments\BankTransferProvider;
use App\Services\Payments\BinancePayProvider;
use App\Services\Payments\OpenBcbProvider;
use App\Services\Payments\PaymentProvider;
use App\Services\Payments\PaypalProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Provider method mapping.
     *
     * @var array<string, string>
     */
    private const METHOD_PROVIDER_MAP = [
        'qr_bcb' => 'qr_bcb',
        'binance_pay' => 'binance_pay',
        'paypal' => 'paypal',
        'bank_transfer' => 'bank_transfer',
    ];

    /**
     * Initiate a payment for a project.
     *
     * POST /payments/initiate
     * Creates a pending Payment and calls the appropriate PaymentProvider.
     * The amount_usd is always derived from the signed contract's frozen quote_snapshot,
     * never from client input. If provided, it is validated against the contract.
     */
    public function initiate(InitiatePaymentRequest $request): JsonResponse
    {
        $validated = $request->validated();
        /** @var User $user */
        $user = $request->user();

        /** @var Project $project */
        $project = Project::findOrFail($validated['project_id']);

        // Ensure the client can only initiate payment for their own project
        if ($project->user_id !== $user->id && ! $user->hasRole('admin')) {
            return response()->json([
                'errors' => ['project_id' => ['Project not found.']],
            ], 404);
        }

        // Find the latest signed contract for this project — amount is always derived from it
        $signedContract = $project->contracts()
            ->where('status', 'signed')
            ->latest('signed_at')
            ->first();

        if (! $signedContract) {
            return response()->json([
                'errors' => ['contract' => [
                    'This project has no signed contract. Payment cannot be initiated without a signed contract.',
                ]],
            ], 422);
        }

        // Derive amount from the signed contract's frozen quote_snapshot
        $quoteSnapshot = $signedContract->quote_snapshot;
        $amountUsd = (float) ($quoteSnapshot['price_usd'] ?? 0);

        if ($amountUsd <= 0) {
            return response()->json([
                'errors' => ['amount_usd' => [
                    'The contract has an invalid amount. Please contact support.',
                ]],
            ], 422);
        }

        // If client provided an amount_usd, verify it matches the contract
        if (isset($validated['amount_usd'])) {
            $clientAmount = (float) $validated['amount_usd'];
            if (abs($clientAmount - $amountUsd) > 0.01) {
                return response()->json([
                    'errors' => ['amount_usd' => [
                        'The provided amount does not match the signed contract amount of $'.number_format($amountUsd, 2).'.',
                    ]],
                ], 422);
            }
        }

        $method = $validated['method'];

        // Get the appropriate provider
        $provider = $this->resolveProvider($method);

        $exchangeRateOverride = $validated['exchange_rate_override'] ?? null;

        // Create a pending payment record
        $payment = Payment::create([
            'project_id' => $project->id,
            'contract_id' => $signedContract->id,
            'amount_usd' => $amountUsd,
            'method' => $method,
            'status' => 'pending',
            'is_test' => $project->is_test,
        ]);

        // Handle exchange rate override for applicable methods
        if ($exchangeRateOverride !== null && in_array($method, ['qr_bcb', 'bank_transfer'], true)) {
            $payment->update([
                'exchange_rate_used' => $exchangeRateOverride,
                'exchange_rate_overridden_by_admin_id' => $user->hasRole('admin') ? $user->id : null,
            ]);
        } elseif (in_array($method, ['qr_bcb', 'bank_transfer'], true)) {
            // Use default rate from settings
            $rateKey = $method === 'qr_bcb' ? 'openbcb_exchange_rate' : 'bank_transfer_exchange_rate';
            $defaultRate = Setting::get($rateKey, 6.86);
            $payment->update([
                'exchange_rate_used' => (float) $defaultRate,
            ]);
        }

        // Call the provider's initiate method to get payment instructions/checkout data
        $providerData = $provider->initiate($project, $amountUsd);

        return response()->json([
            'data' => [
                'payment' => $payment->fresh()->load('contract:id,project_id,quote_snapshot'),
                'provider_data' => $providerData,
            ],
        ], 201);
    }

    /**
     * Upload proof of payment (for bank transfers).
     *
     * POST /payments/{id}/proof
     * Uploads a file to media (payment_proof collection), links to payments.proof_media_id.
     */
    public function uploadProof(UploadProofRequest $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Payment $payment */
        $payment = Payment::findOrFail($id);

        // Ensure the client can only upload proof for their own payment
        if ($payment->project->user_id !== $user->id && ! $user->hasRole('admin')) {
            return response()->json([
                'errors' => ['payment' => ['Payment not found.']],
            ], 404);
        }

        if ($payment->method !== 'bank_transfer') {
            return response()->json([
                'errors' => ['method' => ['Proof upload is only supported for bank transfer payments.']],
            ], 422);
        }

        if ($payment->status !== 'pending') {
            return response()->json([
                'errors' => ['status' => ['Can only upload proof for pending payments. Current status: '.$payment->status.'.']],
            ], 422);
        }

        // Upload the file to the payment's media collection
        $media = $payment->addMediaFromRequest('proof')
            ->usingName('payment_proof_'.$payment->id)
            ->toMediaCollection('payment_proof');

        // Link the media to the payment
        $payment->update([
            'proof_media_id' => $media->id,
        ]);

        Log::info('Payment proof uploaded', [
            'payment_id' => $payment->id,
            'media_id' => $media->id,
            'uploaded_by' => $user->id,
        ]);

        return response()->json([
            'data' => $payment->fresh()->load('proof'),
        ]);
    }

    /**
     * Confirm a payment manually (for bank transfers).
     *
     * PATCH /admin/payments/{id}/confirm
     * Sets status to confirmed, records the confirming admin.
     */
    public function confirm(ConfirmPaymentRequest $request, int $id): JsonResponse
    {
        $validated = $request->validated();
        /** @var User $admin */
        $admin = $request->user();

        /** @var Payment $payment */
        $payment = Payment::findOrFail($id);

        if ($payment->status !== 'pending') {
            return response()->json([
                'errors' => ['status' => ['Only pending payments can be confirmed. Current status: '.$payment->status.'.']],
            ], 422);
        }

        $updateData = [
            'status' => 'confirmed',
            'confirmed_by_admin_id' => $admin->id,
            'paid_at' => now(),
        ];

        // Handle exchange rate override
        if (isset($validated['exchange_rate_override'])) {
            $updateData['exchange_rate_used'] = (float) $validated['exchange_rate_override'];
            $updateData['exchange_rate_overridden_by_admin_id'] = $admin->id;
        }

        $payment->update($updateData);

        Log::info('Payment confirmed manually', [
            'payment_id' => $payment->id,
            'confirmed_by' => $admin->id,
            'exchange_rate_override' => $validated['exchange_rate_override'] ?? null,
        ]);

        return response()->json([
            'data' => $payment->fresh(),
        ]);
    }

    /**
     * Resolve the payment provider for a given method.
     */
    private function resolveProvider(string $method): PaymentProvider
    {
        return match ($method) {
            'qr_bcb' => new OpenBcbProvider,
            'binance_pay' => new BinancePayProvider,
            'paypal' => new PaypalProvider,
            'bank_transfer' => new BankTransferProvider,
            default => throw new \InvalidArgumentException("Unsupported payment method: {$method}"),
        };
    }
}
