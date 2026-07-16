<?php

namespace App\Services\Payments;

use App\Exceptions\ManualConfirmationRequiredException;
use App\Models\Payment;
use App\Models\Project;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BankTransferProvider implements PaymentProvider
{
    /**
     * Initiate a payment via bank transfer.
     *
     * Returns bank transfer instructions with account details from settings.
     */
    public function initiate(Project $project, float $amountUsd): array
    {
        $localCurrency = Setting::get('bank_transfer_currency', 'BOB');
        $exchangeRate = Setting::get('bank_transfer_exchange_rate', 6.86);

        $amountLocal = ($localCurrency === 'BOB')
            ? round($amountUsd * (float) $exchangeRate, 2)
            : $amountUsd;

        return [
            'instructions' => Setting::get('bank_transfer_instructions', 'Please transfer the amount to the account below.'),
            'account_details' => [
                'bank_name' => Setting::get('bank_name', 'Banco Nacional de Bolivia'),
                'account_holder' => Setting::get('bank_account_holder', 'Ysrael Mauricio'),
                'account_number' => Setting::get('bank_account_number', '****1234'),
                'account_type' => Setting::get('bank_account_type', 'Savings'),
                'routing_number' => Setting::get('bank_routing_number', ''),
            ],
            'amount_usd' => $amountUsd,
            'local_currency' => $localCurrency,
            'amount_local' => $amountLocal,
            'reference' => 'TRF_'.$project->id.'_'.now()->timestamp,
        ];
    }

    /**
     * Bank transfers have no webhook — always returns true.
     */
    public function verifyWebhookSignature(Request $request): bool
    {
        Log::info('BankTransferProvider: verifyWebhookSignature called, but bank transfers have no webhook. Returning true.');

        return true;
    }

    /**
     * Bank transfers are confirmed manually by an admin — never via webhook.
     *
     * @throws ManualConfirmationRequiredException
     */
    public function processWebhook(Request $request): Payment
    {
        Log::warning('BankTransferProvider: processWebhook called, but bank transfers require manual confirmation.', [
            'request_data' => $request->json()->all(),
        ]);

        throw new ManualConfirmationRequiredException(
            'Bank transfer payments require manual admin confirmation via PATCH /admin/payments/{id}/confirm. No webhook processing is possible.'
        );
    }
}
