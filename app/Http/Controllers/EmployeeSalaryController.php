<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSalaryIncrementRequest;
use App\Models\AuditLog;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;

class EmployeeSalaryController extends Controller
{
    /**
     * Store a new salary milestone and archive the previous salary.
     */
    public function store(StoreSalaryIncrementRequest $request, Employee $employee): RedirectResponse
    {
        $data = $request->validated();
        $basic = (float) $data['basic_salary'];

        $resp = (float) ($data['responsibility_allowance'] ?? 0);
        $proj = (float) ($data['project_allowance'] ?? 0);
        $pos = (float) ($data['position_allowance'] ?? 0);
        $hard = (float) ($data['hardship_allowance'] ?? 0);
        $trans = (float) ($data['transport_allowance'] ?? 0);
        $house = (float) ($data['house_allowance'] ?? 0);
        $mobile = (float) ($data['mobile_allowance'] ?? 0);
        $food = (float) ($data['food_allowance'] ?? 0);
        $totalGross = $basic + $resp + $proj + $pos + $hard + $trans + $house + $mobile + $food;

        // Statutory pension: 7% employee, 11% employer
        $pensionEmp = round($basic * 0.07, 2);
        $pensionComp = round($basic * 0.11, 2);

        $previousSalary = $employee->currentSalary;
        $oldValues = $previousSalary ? $previousSalary->toArray() : null;

        // Archive previous salary
        $employee->salaries()->where('is_current', true)->update(['is_current' => false]);

        // Establish new current salary milestone
        $newSalary = $employee->salaries()->create([
            'basic_salary' => $basic,
            'responsibility_allowance' => $resp,
            'project_allowance' => $proj,
            'position_allowance' => $pos,
            'hardship_allowance' => $hard,
            'transport_allowance' => $trans,
            'house_allowance' => $house,
            'mobile_allowance' => $mobile,
            'food_allowance' => $food,
            'total_salary' => $totalGross,
            'pension_employee' => $pensionEmp,
            'pension_company' => $pensionComp,
            'effective_date' => $data['effective_date'],
            'is_current' => true,
        ]);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'SALARY_INCREMENT',
            'auditable_type' => Employee::class,
            'auditable_id' => $employee->id,
            'old_values' => $oldValues,
            'new_values' => $newSalary->toArray(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return back()->with('success', "Salary increment recorded for {$employee->full_name}. New gross wage: ".number_format($totalGross, 2).' ETB.');
    }
}
