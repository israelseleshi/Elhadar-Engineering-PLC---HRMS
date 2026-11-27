<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StoreWorkplaceRequest extends FormRequest
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
            'location' => ($l = trim((string) $this->input('location', ''))) !== '' ? $l : null,
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
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('workplaces', 'name'),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $exists = DB::table('workplaces')
                        ->whereRaw('LOWER(name) = ?', [strtolower((string) $value)])
                        ->exists();
                    if ($exists) {
                        $fail('A workplace with this name already exists.');
                    }
                },
            ],
            'code' => ['nullable', 'string', 'max:20', Rule::unique('workplaces', 'code')],
            'type' => ['required', 'string', 'in:Head Office,Project'],
            'location' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
