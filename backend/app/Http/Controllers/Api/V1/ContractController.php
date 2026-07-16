<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contract\ApproveSendContractRequest;
use App\Http\Requests\Contract\CancelContractRequest;
use App\Http\Requests\Contract\StoreContractRequest;
use App\Models\Contract;
use App\Models\Project;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContractController extends Controller
{
    /**
     * Store a newly created contract (draft).
     *
     * POST /admin/contracts
     * Creates a contract from the project's quote_id or from a quote_snapshot_override.
     * Status is always 'draft' on creation.
     */
    public function store(StoreContractRequest $request): JsonResponse
    {
        $validated = $request->validated();

        /** @var Project $project */
        $project = Project::findOrFail($validated['project_id']);

        // Build the quote_snapshot — frozen copy at generation time, never live-referenced later
        if (isset($validated['quote_snapshot_override'])) {
            // Custom project path: admin supplies the snapshot directly
            $quoteSnapshot = $validated['quote_snapshot_override'];
        } elseif ($project->quote_id) {
            // Standard path: copy from the project's quote
            $quote = Quote::with(['productType', 'modifiers'])->findOrFail($project->quote_id);
            $quoteSnapshot = $this->buildSnapshotFromQuote($quote);
        } else {
            return response()->json([
                'errors' => ['quote_snapshot_override' => [
                    'This project has no associated quote. Provide a quote_snapshot_override to create a contract.',
                ]],
            ], 422);
        }

        $contract = Contract::create([
            'project_id' => $project->id,
            'quote_snapshot' => $quoteSnapshot,
            'status' => 'draft',
            'generated_at' => now(),
            'is_test' => $validated['is_test'] ?? $project->is_test,
        ]);

        return response()->json([
            'data' => $contract->load('project:id,user_id'),
        ], 201);
    }

    /**
     * Approve and send the contract.
     *
     * POST /admin/contracts/{id}/approve-send
     * Moves the contract from 'draft' to 'sent', creates a mock Documenso document,
     * and records approved_by_admin_at and sent_at.
     */
    public function approveSend(ApproveSendContractRequest $request, int $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        if ($contract->status !== 'draft') {
            return response()->json([
                'errors' => ['status' => [
                    'Contract must be in "draft" status to approve and send. Current status: '.$contract->status,
                ]],
            ], 422);
        }

        // Mock Documenso document creation — in production, this would call the Documenso API
        $documensoDocumentId = 'DOCUMENSO_MOCK_'.$contract->id.'_'.now()->timestamp;

        $contract->update([
            'status' => 'sent',
            'documenso_document_id' => $documensoDocumentId,
            'approved_by_admin_at' => now(),
            'sent_at' => now(),
        ]);

        // Mock email sending — in production, this would send the signing notification
        Log::info('Contract approved and sent', [
            'contract_id' => $contract->id,
            'documenso_document_id' => $documensoDocumentId,
            'approved_by' => $request->user()->id,
        ]);

        return response()->json([
            'data' => $contract->fresh(),
        ]);
    }

    /**
     * Cancel a contract.
     *
     * PATCH /admin/contracts/{id}/cancel
     * Valid from 'draft', 'approved_pending_send', or 'sent' — not from 'signed'.
     */
    public function cancel(CancelContractRequest $request, int $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $cancellableStatuses = ['draft', 'approved_pending_send', 'sent'];

        if (! in_array($contract->status, $cancellableStatuses, true)) {
            return response()->json([
                'errors' => ['status' => [
                    'Contract cannot be cancelled from status "'.$contract->status.'". Cancellation is only allowed from: '.implode(', ', $cancellableStatuses).'.',
                ]],
            ], 422);
        }

        $contract->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        Log::info('Contract cancelled', [
            'contract_id' => $contract->id,
            'cancelled_by' => $request->user()->id,
            'reason' => $request->validated()['reason'] ?? null,
        ]);

        return response()->json([
            'data' => $contract->fresh(),
        ]);
    }

    /**
     * Display the specified contract for the authenticated client.
     *
     * GET /contracts/{id}
     * Client views their own contract. Includes a temporary signed URL to the PDF.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $contract = Contract::with('project')->findOrFail($id);

        // Ensure the client can only view their own contract
        if ($contract->project->user_id !== $user->id && ! $user->hasRole('admin')) {
            return response()->json([
                'errors' => ['contract' => ['Contract not found.']],
            ], 404);
        }

        $response = [
            'data' => [
                'id' => $contract->id,
                'project_id' => $contract->project_id,
                'quote_snapshot' => $contract->quote_snapshot,
                'status' => $contract->status,
                'documenso_document_id' => $contract->documenso_document_id,
                'generated_at' => $contract->generated_at,
                'approved_by_admin_at' => $contract->approved_by_admin_at,
                'sent_at' => $contract->sent_at,
                'signed_at' => $contract->signed_at,
                'cancelled_at' => $contract->cancelled_at,
                'is_test' => $contract->is_test,
                'created_at' => $contract->created_at,
                'updated_at' => $contract->updated_at,
            ],
        ];

        // Add temporary signed URL to PDF if available
        if ($contract->pdf_media_id && $contract->relationLoaded('media') === false) {
            $contract->load('media');
        }

        if ($contract->pdf_media_id) {
            $media = $contract->getMedia('contract_pdf')->firstWhere('id', $contract->pdf_media_id);

            if ($media) {
                // Generate a temporary signed URL (valid for 1 hour)
                $response['data']['pdf_url'] = $media->getTemporaryUrl(now()->addHour());
            }
        }

        return response()->json($response);
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Build a frozen quote_snapshot from a Quote model and its relationships.
     *
     * The returned shape always matches:
     * {
     *   "product_type_name": string,
     *   "price_usd": decimal,
     *   "estimated_days_min": int,
     *   "estimated_days_max": int,
     *   "modifiers": string[],
     *   "technologies": string[]
     * }
     */
    private function buildSnapshotFromQuote(Quote $quote): array
    {
        $productType = $quote->productType;

        return [
            'product_type_name' => $productType ? $productType->name : 'Unknown Product Type',
            'price_usd' => (float) ($quote->estimated_price_max ?? $quote->estimated_price_min ?? 0),
            'estimated_days_min' => (int) ($quote->estimated_days_min ?? 0),
            'estimated_days_max' => (int) ($quote->estimated_days_max ?? 0),
            'modifiers' => $quote->modifiers->pluck('name')->toArray(),
            'technologies' => [], // Quotes don't track technologies directly; admin can override
        ];
    }
}
