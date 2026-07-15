<?php

namespace App\Http\Requests\Quote;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductTypeRequest extends FormRequest
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
            'service_category_id' => ['sometimes', 'integer', 'exists:service_categories,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('product_types', 'slug')->ignore($this->route('id'))],
            'base_price_usd' => ['sometimes', 'numeric', 'min:0'],
            'base_days_min' => ['sometimes', 'integer', 'min:1'],
            'base_days_max' => ['sometimes', 'integer', 'min:1'],
            'is_floor_not_ceiling' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
