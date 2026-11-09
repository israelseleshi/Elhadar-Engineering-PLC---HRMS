<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'must_change_password',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'phone',
        'is_managerial',
        'can_approve_leave',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
        ];
    }

    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    /**
     * Get the user's phone number in standard Ethiopian format (+2519XXXXXXXX).
     */
    public function getPhoneAttribute(): ?string
    {
        $raw = $this->employee?->phone;
        if (! $raw) {
            return null;
        }

        $digits = preg_replace('/[^0-9]/', '', $raw);
        if (empty($digits)) {
            return null;
        }

        if (str_starts_with($digits, '251')) {
            $digits = substr($digits, 3);
        }
        if (str_starts_with($digits, '0')) {
            $digits = substr($digits, 1);
        }

        return ! empty($digits) ? '+251'.$digits : null;
    }

    public function isSysAdmin(): bool
    {
        return $this->role === 'SysAdmin';
    }

    public function isHRAdmin(): bool
    {
        return in_array($this->role, ['HRAdmin', 'SysAdmin'], true);
    }

    public function isManager(): bool
    {
        return in_array($this->role, ['Manager', 'HRAdmin', 'SysAdmin'], true);
    }

    public function isEmployee(): bool
    {
        return $this->role === 'Employee';
    }

    /**
     * Determine if this user qualifies as managerial staff:
     * - Role is HRAdmin, SysAdmin, or Manager; OR
     * - Linked employee occupies one of the 6 managerial levels:
     *   Division Head, Department Manager, Director, DCEO, Chief Officer, CEO.
     */
    public function isManagerialStaff(): bool
    {
        if (in_array($this->role, ['HRAdmin', 'SysAdmin', 'Manager'], true)) {
            return true;
        }

        return $this->employee?->isManagerial() ?? false;
    }

    /**
     * Check if this user has authority to approve/reject leave requests.
     */
    public function canApproveLeave(): bool
    {
        return $this->isManagerialStaff();
    }

    /**
     * Determine authority scope:
     * - 'company': Executive level (CEO, DCEO, Chief Officer, Director, HRAdmin, SysAdmin)
     * - 'department': Division Head, Department Manager, or Manager role
     * - 'none': Regular non-managerial staff
     */
    public function getManagerialScope(): string
    {
        if (in_array($this->role, ['HRAdmin', 'SysAdmin'], true)) {
            return 'company';
        }

        $level = $this->employee?->getManagerialLevel();
        if (in_array($level, ['CEO', 'DCEO', 'Chief Officer', 'Director'], true)) {
            return 'company';
        }

        if (in_array($level, ['Department Manager', 'Division Head'], true)) {
            return 'department';
        }

        if ($this->role === 'Manager') {
            return 'department';
        }

        return 'none';
    }

    public function getIsManagerialAttribute(): bool
    {
        return $this->isManagerialStaff();
    }

    public function getCanApproveLeaveAttribute(): bool
    {
        return $this->canApproveLeave();
    }
}
