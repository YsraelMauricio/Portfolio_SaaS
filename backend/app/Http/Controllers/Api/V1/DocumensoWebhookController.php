<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DocumensoWebhookController extends Controller
{
    /**
     * Handle the Documenso signing webhook.
     *
     * POST /webhooks/documenso
     *
     * Order is fixed and mandatory:
     * 1. Verify Documenso's webhook signature BEFORE processing
     * 2. On confirmed signature: set contract.status → signed
     * 3. Calculate confirmed_delivery_date against the current project queue
     * 4. Trigger payment request (create pending payment record)
     */
    public function handle(Request $request): JsonResponse
    {
        // Step 1: Verify signature before ANY processing
        if (! $this->verifySignature($request)) {
            Log::warning('Documenso webhook signature verification failed', [
                'headers' => $request->headers->all(),
            ]);

            return response()->json([
                'errors' => ['signature' => ['Invalid webhook signature']],
            ], 401);
        }

        $payload = $request->json()->all();

        // Extract the document ID from the webhook payload
        // Documenso sends the document ID in the payload
        $documensoDocumentId = $payload['document_id']
            ?? $payload['data']['document_id']
            ?? $payload['document']['id']
            ?? $payload['data']['id']
            ?? null;

        if (empty($documensoDocumentId)) {
            Log::warning('Documenso webhook missing document_id', ['payload' => $payload]);

            return response()->json([
                'errors' => ['document_id' => ['Missing document ID in webhook payload.']],
            ], 422);
        }

        // Find the contract by its Documenso document ID
        $contract = Contract::where('documenso_document_id', $documensoDocumentId)->first();

        if (! $contract) {
            Log::warning('Documenso webhook: contract not found for document', [
                'documenso_document_id' => $documensoDocumentId,
            ]);

            return response()->json([
                'errors' => ['contract' => ['Contract not found for the given document ID.']],
            ], 404);
        }

        // Check if already signed (idempotency)
        if ($contract->status === 'signed') {
            Log::info('Documenso webhook: contract already signed', [
                'contract_id' => $contract->id,
                'documenso_document_id' => $documensoDocumentId,
            ]);

            return response()->json([
                'data' => ['message' => 'Contract was already marked as signed.'],
            ]);
        }

        // Verify the contract is in a valid pre-signing state
        if (! in_array($contract->status, ['sent', 'approved_pending_send'], true)) {
            Log::warning('Documenso webhook: contract in unexpected status', [
                'contract_id' => $contract->id,
                'status' => $contract->status,
            ]);

            return response()->json([
                'errors' => ['status' => [
                    'Contract cannot be signed from status "'.$contract->status.'". Expected "sent" or "approved_pending_send".',
                ]],
            ], 422);
        }

        // Step 2: Set contract status to signed
        $contract->update([
            'status' => 'signed',
            'signed_at' => now(),
        ]);

        Log::info('Contract signed via Documenso', [
            'contract_id' => $contract->id,
            'documenso_document_id' => $documensoDocumentId,
        ]);

        // Step 3: Calculate confirmed_delivery_date against the current project queue
        $project = $contract->project;
        $confirmedDeliveryDate = $this->calculateConfirmedDeliveryDate($project, $contract);

        $project->update([
            'confirmed_delivery_date' => $confirmedDeliveryDate,
        ]);

        Log::info('Project delivery date confirmed', [
            'project_id' => $project->id,
            'confirmed_delivery_date' => $confirmedDeliveryDate->format('Y-m-d'),
        ]);

        // Step 4: Trigger payment request — create a pending payment record
        // The actual amount comes from the signed contract's frozen quote_snapshot
        $quoteSnapshot = $contract->quote_snapshot;
        $amountUsd = (float) ($quoteSnapshot['price_usd'] ?? 0);

        $payment = Payment::create([
            'project_id' => $project->id,
            'contract_id' => $contract->id,
            'amount_usd' => $amountUsd,
            'method' => 'bank_transfer', // Default method — client will choose via /payments/initiate
            'status' => 'pending',
            'is_test' => $contract->is_test,
        ]);

        Log::info('Payment triggered after contract signing', [
            'payment_id' => $payment->id,
            'contract_id' => $contract->id,
            'amount_usd' => $amountUsd,
        ]);

        return response()->json([
            'data' => [
                'contract' => $contract->fresh(),
                'project' => [
                    'id' => $project->id,
                    'confirmed_delivery_date' => $confirmedDeliveryDate->format('Y-m-d'),
                ],
                'payment' => [
                    'id' => $payment->id,
                    'amount_usd' => $amountUsd,
                    'status' => $payment->status,
                ],
            ],
        ]);
    }

    /**
     * Verify the Documenso webhook signature.
     *
     * Documenso sends an HMAC-SHA256 signature in the X-Documenso-Signature header
     * computed over the raw request body using the webhook secret / API token as the key.
     */
    private function verifySignature(Request $request): bool
    {
        $signature = $request->header('X-Documenso-Signature');

        if (empty($signature)) {
            Log::warning('Documenso webhook missing signature header');

            return false;
        }

        $secret = config('services.documenso.api_token');

        if (empty($secret)) {
            Log::error('Documenso API token not configured');

            return false;
        }

        $payload = $request->getContent();
        $expectedSignature = hash_hmac('sha256', $payload, $secret);

        $isValid = hash_equals($expectedSignature, $signature);

        if (! $isValid) {
            Log::warning('Documenso webhook signature mismatch', [
                'expected' => $expectedSignature,
                'received' => $signature,
            ]);
        }

        return $isValid;
    }

    /**
     * Calculate the confirmed delivery date based on the current project queue.
     *
     * Looks at existing projects with confirmed_delivery_date or projects currently
     * in development and calculates the next available slot based on the contract's
     * estimated_days_max.
     */
    private function calculateConfirmedDeliveryDate(Project $project, Contract $contract): \DateTime
    {
        $today = new \DateTime('today');

        // Get the latest delivery date among projects that are not cancelled
        $latestDeliveryDate = Project::where('id', '!=', $project->id)
            ->whereIn('status', ['in_development', 'approved', 'under_review', 'submitted'])
            ->where('is_test', false)
            ->whereNotNull('confirmed_delivery_date')
            ->max('confirmed_delivery_date');

        // Get the estimate from the contract's frozen snapshot
        $quoteSnapshot = $contract->quote_snapshot;
        $estimatedDaysMax = (int) ($quoteSnapshot['estimated_days_max'] ?? 30);

        // Calculate base start date: today, or after the latest confirmed delivery
        $startDate = $latestDeliveryDate
            ? (new \DateTime($latestDeliveryDate))->modify('+1 day')
            : clone $today;

        // Ensure start date is not in the past
        if ($startDate < $today) {
            $startDate = clone $today;
        }

        // Calculate delivery date by adding estimated days
        $deliveryDate = clone $startDate;
        $deliveryDate->modify("+{$estimatedDaysMax} days");

        // Add buffer (20% of estimated time, minimum 3 days)
        $bufferDays = max(3, (int) ceil($estimatedDaysMax * 0.2));
        $deliveryDate->modify("+{$bufferDays} days");

        return $deliveryDate;
    }
}
