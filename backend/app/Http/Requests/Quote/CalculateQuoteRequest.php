<?php

namespace App\Http\Requests\Quote;

use Illuminate\Foundation\Http\FormRequest;

class CalculateQuoteRequest extends FormRequest
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
            'product_type_id' => ['required', 'integer', 'exists:product_types,id'],
            'modifier_ids' => ['sometimes', 'array'],
            'modifier_ids.*' => ['integer', 'exists:modifiers,id'],
        ];
    }
}
