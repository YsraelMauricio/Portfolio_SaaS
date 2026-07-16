<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class StoreMilestoneRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'estimated_date' => ['required', 'date'],
            'completed_date' => ['sometimes', 'nullable', 'date', 'after_or_equal:estimated_date'],
            'sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
