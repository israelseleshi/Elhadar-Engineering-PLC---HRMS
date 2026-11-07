<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'user_id',
        'leave_type',
        'start_date',
        'start_date_ec',
        'end_date',
        'end_date_ec',
        'requested_days',
        'reason',
        'handover_employee_id',
        'contact_phone',
        'attachment_path',
        'status',
        'is_deducted',
        'days_deducted',
        'reviewed_by',
        'reviewed_at',
        'reviewer_notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'requested_days' => 'decimal:1',
            'days_deducted' => 'decimal:1',
            'is_deducted' => 'boolean',
            'reviewed_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function handoverEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'handover_employee_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
