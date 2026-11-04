<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $employeeId = $this->route('employee')?->id ?? $this->route('employee');

        return [
            // Personal & Identity
            'file_no' => ['required', 'string', 'max:20', Rule::unique('employees', 'file_no')->ignore($employeeId)],
            'employee_id_no' => ['nullable', 'string', 'max:50', Rule::unique('employees', 'employee_id_no')->ignore($employeeId)],
            'full_name' => ['required', 'string', 'max:255'],
            'gender' => ['required', 'in:Male,Female'],
            'education_status' => ['nullable', 'string', 'max:150'],
            'institution' => ['nullable', 'string', 'max:150'],
            'graduation_year_ec' => ['nullable', 'string', 'max:20'],
            'professional_license' => ['nullable', 'string', 'max:150'],
            'cost_sharing_status' => ['nullable', 'string', 'max:50'],
            'marital_status' => ['nullable', 'string', 'max:30'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:100'],
            'region' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'sub_city' => ['nullable', 'string', 'max:100'],
            'woreda' => ['nullable', 'string', 'max:50'],
            'house_no' => ['nullable', 'string', 'max:50'],
            'emergency_contact_name' => ['nullable', 'string', 'max:150'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:50'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:50'],

            // Department & Employment Assignment
            'department_id' => ['required', 'exists:departments,id'],
            'position' => ['required', 'string', 'max:150'],
            'work_place' => ['required', 'string', 'max:100'],
            'employment_type' => ['required', 'in:Non-Managerial,Managerial'],
            'contract_type' => ['required', 'in:Permanent,Contract,Daily'],
            'status' => ['required', 'in:Probation,Permanent,Contract,Separated'],
            'grade' => ['nullable', 'string', 'max:20'],
            'step' => ['nullable', 'string', 'max:20'],

            // Dates & Milestones
            'employment_date' => ['required', 'date'],
            'employment_date_ec' => ['required', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date'],
            'birth_date_ec' => ['nullable', 'string', 'max:20'],
            'probation_end_date' => ['nullable', 'date'],
            'probation_status' => ['nullable', 'string', 'max:50'],
            'permanent_status_date' => ['nullable', 'date'],
            'contract_end_date' => ['nullable', 'date'],
            'retirement_date' => ['nullable', 'date'],

            // Experience & Performance
            'previous_experience' => ['nullable', 'string', 'max:255'],
            'company_experience' => ['nullable', 'string', 'max:255'],
            'total_experience' => ['nullable', 'string', 'max:255'],
            'performance_score_round_1' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'performance_score_round_2' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'disciplinary_action' => ['nullable', 'string', 'max:255'],

            // Banking & Tax
            'bank_name' => ['nullable', 'string', 'max:100'],
            'bank_account_no' => ['nullable', 'string', 'max:50'],
            'tin_no' => ['nullable', 'string', 'max:30'],
            'social_security_no' => ['nullable', 'string', 'max:50'],
            'poessa_no' => ['nullable', 'string', 'max:50'],
            'psssa_no' => ['nullable', 'string', 'max:50'],
            'plate_number' => ['nullable', 'string', 'max:30'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
