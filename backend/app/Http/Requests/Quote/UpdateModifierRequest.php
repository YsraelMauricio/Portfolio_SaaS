<?php

namespace App\Http\Requests\Quote;

use Illuminate\Foundation\Http\FormRequest;

class UpdateModifierRequest extends FormRequest
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
            'modifier_group_id' => ['sometimes', 'integer', 'exists:modifier_groups,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'price_impact_usd' => ['sometimes', 'numeric'],
            'time_impact_days' => ['sometimes', 'integer'],
            'impact_type' => ['sometimes', 'string', 'in:additive,multiplier'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'active' => ['sometimes', 'boolean'],
            'reason' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
