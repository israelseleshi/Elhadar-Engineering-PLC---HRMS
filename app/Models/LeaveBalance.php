<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'leave_year',
        'entitled_days',
        'carried_over_days',
        'taken_days',
        'remaining_days',
    ];

    protected function casts(): array
    {
        return [
            'leave_year' => 'integer',
            'entitled_days' => 'decimal:1',
            'carried_over_days' => 'decimal:1',
            'taken_days' => 'decimal:1',
            'remaining_days' => 'decimal:1',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
