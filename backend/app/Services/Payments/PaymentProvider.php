<?php

namespace App\Services\Payments;

use App\Exceptions\ManualConfirmationRequiredException;
use App\Models\Payment;
use App\Models\Project;
use Illuminate\Http\Request;

interface PaymentProvider
{
    /**
     * Initiate a payment for the given project.
     *
     * @param  Project  $project  The project being paid for.
     * @param  float  $amountUsd  The amount in USD (from the signed contract's frozen snapshot).
     * @return array Data for the frontend (QR data, checkout link, bank instructions, etc.).
     */
    public function initiate(Project $project, float $amountUsd): array;

    /**
     * Verify the cryptographic signature of an incoming webhook request.
     *
     * @param  Request  $request  The incoming webhook request.
     * @return bool True if the signature is valid, false otherwise.
     */
    public function verifyWebhookSignature(Request $request): bool;

    /**
     * Process an incoming webhook request and create a Payment record.
     *
     * This method MUST be called only after verifyWebhookSignature() has returned true.
     * It checks idempotency via provider_transaction_id before creating the payment.
     *
     * @param  Request  $request  The incoming webhook request.
     * @return Payment The created (or existing, for idempotent retries) Payment record.
     *
     * @throws ManualConfirmationRequiredException
     */
    public function processWebhook(Request $request): Payment;
}
