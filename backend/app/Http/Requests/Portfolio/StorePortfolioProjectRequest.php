<?php

namespace App\Http\Requests\Portfolio;

use Illuminate\Foundation\Http\FormRequest;

class StorePortfolioProjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) ($this->user()?->hasRole('admin'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:255', 'unique:portfolio_projects,slug'],
            'technologies' => ['nullable', 'array'],
            'technologies.*' => ['string', 'max:100'],
            'demo_url' => ['nullable', 'string', 'url', 'max:2048'],
            'repo_url' => ['nullable', 'string', 'url', 'max:2048'],
            'is_this_platform' => ['sometimes', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'featured_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'translations' => ['required', 'array', 'min:1'],
            'translations.*.locale' => ['required', 'string', 'max:5'],
            'translations.*.title' => ['required', 'string', 'max:255'],
            'translations.*.description' => ['required', 'string'],
            'translations.*.key_result' => ['nullable', 'string', 'max:255'],
        ];
    }
}
