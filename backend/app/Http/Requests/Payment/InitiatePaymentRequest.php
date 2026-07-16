<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InitiatePaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'method' => ['required', 'string', Rule::in(['qr_bcb', 'binance_pay', 'paypal', 'bank_transfer'])],
            'amount_usd' => ['sometimes', 'nullable', 'numeric', 'min:0.01'],
            'exchange_rate_override' => ['sometimes', 'nullable', 'numeric', 'min:0.0001'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'method.in' => 'Payment method must be one of: qr_bcb, binance_pay, paypal, bank_transfer.',
        ];
    }
}
