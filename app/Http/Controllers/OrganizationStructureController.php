<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationStructureController extends Controller
{
    /**
     * Display the enterprise organizational structure chart.
     */
    public function index(Request $request): Response
    {
        $headcount = Employee::active()->count();
        $departmentsCount = Department::where('is_active', true)->count();

        $employees = Employee::active()
            ->with('department:id,name')
            ->select([
                'id',
                'user_id',
                'full_name',
                'position',
                'department_id',
                'work_place',
                'status',
                'profile_photo_path',
            ])
            ->orderBy('full_name')
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->full_name,
                    'position' => $emp->position,
                    'department_id' => $emp->department_id,
                    'department' => $emp->department?->name,
                    'workplace' => $emp->work_place,
                    'status' => $emp->status,
                    'photo_url' => $emp->profile_photo_url,
                ];
            });

        return Inertia::render('Organization/Structure', [
            'metrics' => [
                'total_headcount' => $headcount,
                'active_departments' => $departmentsCount,
                'prepared_by' => 'Human Capital Directorate',
                'effective_cycle' => '2026 G.C. / 2018 E.C.',
                'company' => 'EL-HADAR Engineering PLC',
            ],
            'employees' => $employees,
        ]);
    }
}
