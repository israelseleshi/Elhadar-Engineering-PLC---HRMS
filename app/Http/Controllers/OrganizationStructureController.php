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

        return Inertia::render('Organization/Structure', [
            'metrics' => [
                'total_headcount' => $headcount,
                'active_departments' => $departmentsCount,
                'prepared_by' => 'Human Capital Directorate',
                'effective_cycle' => '2026 G.C. / 2018 E.C.',
                'company' => 'EL-HADAR Engineering PLC',
            ],
        ]);
    }
}
