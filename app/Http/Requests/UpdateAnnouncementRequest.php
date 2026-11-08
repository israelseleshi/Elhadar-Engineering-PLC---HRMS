<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && in_array(auth()->user()->role, ['HRAdmin', 'SysAdmin'], true);
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'title_am' => ['nullable', 'string', 'max:255'],
            'content' => ['sometimes', 'required', 'string', 'max:25000'],
            'content_am' => ['nullable', 'string', 'max:25000'],
            'priority' => ['nullable', 'string', 'in:standard,important,critical'],
            'category' => ['nullable', 'string', 'in:general,policy,safety,payroll,holiday,event'],
            'target_type' => ['nullable', 'string', 'in:all,departments,work_places,roles,contract_types,custom'],
            'target_department_ids' => ['nullable', 'array'],
            'target_department_ids.*' => ['integer', 'exists:departments,id'],
            'target_work_places' => ['nullable', 'array'],
            'target_roles' => ['nullable', 'array'],
            'target_contract_types' => ['nullable', 'array'],
            'target_user_ids' => ['nullable', 'array'],
            'target_user_ids.*' => ['integer', 'exists:users,id'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx', 'max:10240'],
            'remove_attachment' => ['nullable', 'boolean'],
            'requires_acknowledgment' => ['nullable', 'boolean'],
            'allow_reactions' => ['nullable', 'boolean'],
            'send_sms' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string', 'in:draft,scheduled,published,archived'],
            'is_pinned' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
        ];
    }
}
