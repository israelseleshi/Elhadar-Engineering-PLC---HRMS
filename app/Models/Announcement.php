<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Announcement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'title_am',
        'content',
        'content_am',
        'priority',
        'category',
        'target_type',
        'target_department_ids',
        'target_work_places',
        'target_roles',
        'target_contract_types',
        'target_user_ids',
        'attachment_path',
        'attachment_name',
        'requires_acknowledgment',
        'allow_reactions',
        'send_sms',
        'status',
        'is_pinned',
        'is_active',
        'published_at',
        'expires_at',
        'created_by',
    ];

    protected $appends = [
        'attachment_url',
    ];

    protected function casts(): array
    {
        return [
            'target_department_ids' => 'array',
            'target_work_places' => 'array',
            'target_roles' => 'array',
            'target_contract_types' => 'array',
            'target_user_ids' => 'array',
            'requires_acknowledgment' => 'boolean',
            'allow_reactions' => 'boolean',
            'send_sms' => 'boolean',
            'is_pinned' => 'boolean',
            'is_active' => 'boolean',
            'published_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reads(): HasMany
    {
        return $this->hasMany(AnnouncementRead::class);
    }

    public function acknowledgments(): HasMany
    {
        return $this->hasMany(AnnouncementAcknowledgment::class);
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(AnnouncementReaction::class);
    }

    public function getAttachmentUrlAttribute(): ?string
    {
        return $this->attachment_path ? Storage::disk('public')->url($this->attachment_path) : null;
    }

    public function isReadBy(User $user): bool
    {
        return $this->reads()->where('user_id', $user->id)->exists();
    }

    public function isAcknowledgedBy(User $user): bool
    {
        return $this->acknowledgments()->where('user_id', $user->id)->exists();
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)->where('status', '!=', 'draft');
    }

    public function scopePinned(Builder $query): Builder
    {
        return $query->where('is_pinned', true);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            })->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderByDesc('is_pinned')
            ->orderByRaw("CASE priority WHEN 'critical' THEN 1 WHEN 'important' THEN 2 ELSE 3 END")
            ->orderByDesc('published_at')
            ->orderByDesc('created_at');
    }

    public function scopeForUser(Builder $query, User $user): Builder
    {
        if (in_array($user->role, ['HRAdmin', 'SysAdmin'])) {
            return $query;
        }

        $employee = $user->employee;

        return $query->where(function (Builder $q) use ($user, $employee) {
            // 1. Broadcast to all
            $q->where('target_type', 'all')
                // 2. Custom target listing individual user ID
                ->orWhere(function ($sub) use ($user) {
                    $sub->where('target_type', 'custom')
                        ->whereJsonContains('target_user_ids', $user->id);
                });

            if ($employee) {
                // 3. Departments
                if ($employee->department_id) {
                    $q->orWhere(function ($sub) use ($employee) {
                        $sub->where('target_type', 'departments')
                            ->whereJsonContains('target_department_ids', (int) $employee->department_id);
                    });
                }

                // 4. Workplace / Project site
                if ($employee->work_place) {
                    $q->orWhere(function ($sub) use ($employee) {
                        $sub->where('target_type', 'work_places')
                            ->whereJsonContains('target_work_places', $employee->work_place);
                    });
                }

                // 5. Employment Role / Type
                if ($employee->employment_type) {
                    $q->orWhere(function ($sub) use ($employee) {
                        $sub->where('target_type', 'roles')
                            ->whereJsonContains('target_roles', $employee->employment_type);
                    });
                }

                // 6. Contract Type
                if ($employee->contract_type) {
                    $q->orWhere(function ($sub) use ($employee) {
                        $sub->where('target_type', 'contract_types')
                            ->whereJsonContains('target_contract_types', $employee->contract_type);
                    });
                }
            }
        });
    }
}
