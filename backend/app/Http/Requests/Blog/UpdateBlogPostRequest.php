<?php

namespace App\Http\Requests\Blog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBlogPostRequest extends FormRequest
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
        $blogPostId = $this->route('blog_post');

        return [
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('blog_posts', 'slug')->ignore($blogPostId)],
            'pillar' => ['sometimes', 'string', Rule::in(['case_study', 'educational', 'applied_ai', 'tutorial'])],
            'status' => ['sometimes', 'string', Rule::in(['draft', 'published'])],
            'published_at' => ['nullable', 'date'],
            'featured_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'translations' => ['sometimes', 'array', 'min:1'],
            'translations.*.locale' => ['required_with:translations', 'string', 'max:5'],
            'translations.*.title' => ['required_with:translations', 'string', 'max:255'],
            'translations.*.summary' => ['required_with:translations', 'string'],
            'translations.*.content' => ['required_with:translations', 'string'],
            'translations.*.meta_title' => ['nullable', 'string', 'max:255'],
            'translations.*.meta_description' => ['nullable', 'string', 'max:255'],
        ];
    }
}
