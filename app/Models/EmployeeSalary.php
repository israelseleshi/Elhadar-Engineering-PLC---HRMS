<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSalary extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'basic_salary',
        'responsibility_allowance',
        'project_allowance',
        'position_allowance',
        'daily_allowance',
        'desert_allowance',
        'hardship_allowance',
        'transport_allowance',
        'fuel_allowance_litres',
        'fuel_allowance_amount',
        'house_allowance',
        'food_allowance',
        'mobile_allowance',
        'other_allowance',
        'ot_compensation',
        'perdiem',
        'monthly_perdiem',
        'total_salary',
        'taxable_salary',
        'income_tax',
        'pension_employee',
        'pension_company',
        'total_deductions',
        'net_salary',
        'effective_date',
        'is_current',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'basic_salary' => 'decimal:2',
            'responsibility_allowance' => 'decimal:2',
            'project_allowance' => 'decimal:2',
            'position_allowance' => 'decimal:2',
            'daily_allowance' => 'decimal:2',
            'desert_allowance' => 'decimal:2',
            'hardship_allowance' => 'decimal:2',
            'transport_allowance' => 'decimal:2',
            'fuel_allowance_litres' => 'decimal:2',
            'fuel_allowance_amount' => 'decimal:2',
            'house_allowance' => 'decimal:2',
            'ot_compensation' => 'decimal:2',
            'perdiem' => 'decimal:2',
            'monthly_perdiem' => 'decimal:2',
            'total_salary' => 'decimal:2',
            'net_salary' => 'decimal:2',
            'effective_date' => 'date:Y-m-d',
            'is_current' => 'boolean',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function calculateGross(): float
    {
        return (float) (
            $this->basic_salary +
            $this->responsibility_allowance +
            $this->project_allowance +
            $this->position_allowance +
            $this->daily_allowance +
            $this->desert_allowance +
            $this->hardship_allowance +
            $this->transport_allowance +
            $this->fuel_allowance_amount +
            $this->house_allowance +
            $this->ot_compensation +
            $this->perdiem +
            $this->monthly_perdiem
        );
    }
}
