<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreDiscrepancyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'field_name' => ['required', 'string', 'max:100'],
            'current_value' => ['nullable', 'string', 'max:500'],
            'proposed_value' => ['required', 'string', 'max:500'],
            'explanation' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
