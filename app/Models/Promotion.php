<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Promotion extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'promotion_date_ec',
        'promotion_date',
        'previous_position',
        'previous_grade',
        'previous_basic_salary',
        'previous_total_salary',
        'new_position',
        'new_grade',
        'new_basic_salary',
        'new_total_salary',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'promotion_date' => 'date:Y-m-d',
            'previous_basic_salary' => 'decimal:2',
            'previous_total_salary' => 'decimal:2',
            'new_basic_salary' => 'decimal:2',
            'new_total_salary' => 'decimal:2',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
