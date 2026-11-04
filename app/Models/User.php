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
}
