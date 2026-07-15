<?php

namespace App\Http\Requests\Quote;

use Illuminate\Foundation\Http\FormRequest;

class StoreModifierRequest extends FormRequest
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
            'modifier_group_id' => ['required', 'integer', 'exists:modifier_groups,id'],
            'name' => ['required', 'string', 'max:255'],
            'price_impact_usd' => ['required', 'numeric'],
            'time_impact_days' => ['required', 'integer'],
            'impact_type' => ['required', 'string', 'in:additive,multiplier'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'active' => ['required', 'boolean'],
        ];
    }
}
