<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePromotionRequest extends FormRequest
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
            'employee_id' => ['required', 'exists:employees,id'],
            'promotion_date' => ['required', 'date'],
            'promotion_date_ec' => ['nullable', 'string', 'max:20'],
            'new_position' => ['required', 'string', 'max:150'],
            'new_grade' => ['nullable', 'string', 'max:20'],
            'new_basic_salary' => ['required', 'numeric', 'min:0'],
            'new_total_salary' => ['nullable', 'numeric', 'min:0'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
