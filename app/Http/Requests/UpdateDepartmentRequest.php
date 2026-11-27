<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isHRAdmin() ?? false;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) $this->input('name', '')),
            'code' => ($c = trim((string) $this->input('code', ''))) !== '' ? $c : null,
            'description' => ($d = trim((string) $this->input('description', ''))) !== '' ? $d : null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $departmentId = $this->route('department')?->id ?? $this->route('department');

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('departments', 'name')->ignore($departmentId),
                function (string $attribute, mixed $value, \Closure $fail) use ($departmentId): void {
                    $exists = DB::table('departments')
                        ->whereRaw('LOWER(name) = ?', [strtolower((string) $value)])
                        ->where('id', '!=', $departmentId)
                        ->exists();
                    if ($exists) {
                        $fail('A department with this name already exists.');
                    }
                },
            ],
            'code' => ['nullable', 'string', 'max:20', Rule::unique('departments', 'code')->ignore($departmentId)],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
