<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Separation extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'separation_type',
        'effective_date',
        'termination_date_ec',
        'reason',
        'basic_salary_at_separation',
        'completed_years_service',
        'severance_amount',
        'severance_paid',
        'unused_leave_days',
        'leave_payout_amount',
    ];

    protected function casts(): array
    {
        return [
            'effective_date' => 'date:Y-m-d',
            'basic_salary_at_separation' => 'decimal:2',
            'completed_years_service' => 'decimal:2',
            'severance_amount' => 'decimal:2',
            'severance_paid' => 'boolean',
            'unused_leave_days' => 'decimal:1',
            'leave_payout_amount' => 'decimal:2',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
