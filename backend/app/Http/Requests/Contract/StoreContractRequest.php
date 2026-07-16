<?php

namespace App\Http\Requests\Contract;

use Illuminate\Foundation\Http\FormRequest;

class StoreContractRequest extends FormRequest
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
            'quote_snapshot_override' => ['sometimes', 'required', 'array'],
            'quote_snapshot_override.product_type_name' => ['required_with:quote_snapshot_override', 'string', 'max:255'],
            'quote_snapshot_override.price_usd' => ['required_with:quote_snapshot_override', 'numeric', 'min:0'],
            'quote_snapshot_override.estimated_days_min' => ['required_with:quote_snapshot_override', 'integer', 'min:1'],
            'quote_snapshot_override.estimated_days_max' => ['required_with:quote_snapshot_override', 'integer', 'min:1', 'gte:quote_snapshot_override.estimated_days_min'],
            'quote_snapshot_override.modifiers' => ['sometimes', 'array'],
            'quote_snapshot_override.modifiers.*' => ['string', 'max:255'],
            'quote_snapshot_override.technologies' => ['sometimes', 'array'],
            'quote_snapshot_override.technologies.*' => ['string', 'max:255'],
            'is_test' => ['sometimes', 'boolean'],
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
            'quote_snapshot_override.required' => 'A quote_snapshot_override is required when the project has no associated quote.',
            'quote_snapshot_override.product_type_name.required_with' => 'The product_type_name field is required when providing a quote_snapshot_override.',
            'quote_snapshot_override.price_usd.required_with' => 'The price_usd field is required when providing a quote_snapshot_override.',
            'quote_snapshot_override.estimated_days_min.required_with' => 'The estimated_days_min field is required when providing a quote_snapshot_override.',
            'quote_snapshot_override.estimated_days_max.required_with' => 'The estimated_days_max field is required when providing a quote_snapshot_override.',
            'quote_snapshot_override.estimated_days_max.gte' => 'estimated_days_max must be greater than or equal to estimated_days_min.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Ensure quote_snapshot_override.modifiers and technologies default to empty arrays
        if ($this->has('quote_snapshot_override')) {
            $override = $this->input('quote_snapshot_override');
            if (! isset($override['modifiers'])) {
                $override['modifiers'] = [];
            }
            if (! isset($override['technologies'])) {
                $override['technologies'] = [];
            }
            $this->merge(['quote_snapshot_override' => $override]);
        }
    }
}
