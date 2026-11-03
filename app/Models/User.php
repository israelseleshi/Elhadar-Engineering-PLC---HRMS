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
}
