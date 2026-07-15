<?php

namespace App\Http\Requests\Quote;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductTypeRequest extends FormRequest
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
            'service_category_id' => ['required', 'integer', 'exists:service_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:product_types,slug'],
            'base_price_usd' => ['required', 'numeric', 'min:0'],
            'base_days_min' => ['required', 'integer', 'min:1'],
            'base_days_max' => ['required', 'integer', 'min:1', 'gte:base_days_min'],
            'is_floor_not_ceiling' => ['sometimes', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
