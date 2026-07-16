<?php

namespace App\Http\Requests\Portfolio;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePortfolioProjectRequest extends FormRequest
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
        $portfolioId = $this->route('portfolio');

        return [
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('portfolio_projects', 'slug')->ignore($portfolioId)],
            'technologies' => ['nullable', 'array'],
            'technologies.*' => ['string', 'max:100'],
            'demo_url' => ['nullable', 'string', 'url', 'max:2048'],
            'repo_url' => ['nullable', 'string', 'url', 'max:2048'],
            'is_this_platform' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'featured_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'translations' => ['sometimes', 'array', 'min:1'],
            'translations.*.locale' => ['required_with:translations', 'string', 'max:5'],
            'translations.*.title' => ['required_with:translations', 'string', 'max:255'],
            'translations.*.description' => ['required_with:translations', 'string'],
            'translations.*.key_result' => ['nullable', 'string', 'max:255'],
        ];
    }
}
