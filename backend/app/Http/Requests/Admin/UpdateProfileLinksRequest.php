<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileLinksRequest extends FormRequest
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
            'links' => ['required', 'array'],
            'links.*.id' => ['required', 'integer', 'exists:profile_links,id'],
            'links.*.url' => ['required', 'url', 'max:2048'],
            'links.*.visible' => ['required', 'boolean'],
            'links.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
