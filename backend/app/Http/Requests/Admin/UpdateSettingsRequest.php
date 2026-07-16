<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            '*.key' => ['prohibited'],
            '*' => ['string'],
        ];
    }

    /**
     * Override validationData to handle the JSON object of key-value pairs.
     *
     * The request body is a flat JSON object like:
     * { "site_name": "Portfolio SaaS", "contact_email": "admin@example.com" }
     *
     * We'll validate it by ensuring all values are strings.
     */
    protected function prepareForValidation(): void
    {
        // No preprocessing needed — the keys and values are used directly.
    }

    /**
     * Get the validated data as a flat key-value array.
     */
    public function validatedSettings(): array
    {
        return $this->all();
    }
}
