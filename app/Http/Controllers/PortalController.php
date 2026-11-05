<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDiscrepancyRequest;
use App\Models\DataCorrectionReport;
use App\Models\Employee;
use App\Services\AnnualLeaveCalculationService;
use App\Services\RetirementCalculationService;
use App\Services\TenureCalculationService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortalController extends Controller
{
    public function __construct(
        protected TenureCalculationService $tenureService,
        protected AnnualLeaveCalculationService $leaveService,
        protected RetirementCalculationService $retirementService
    ) {}

    /**
     * Display the employee self-service (ESS) read-only profile.
     */
    public function profile(Request $request): Response
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        // Admin-only fallback for convenience; employees/managers must be linked to their own record.
        if (! $employee && in_array($user->role, ['HRAdmin', 'SysAdmin'], true)) {
            $employee = Employee::first();
        }

        if ($employee) {
            $employee->load([
                'department',
                'currentSalary',
                'salaries' => fn ($q) => $q->orderByDesc('effective_date'),
                'leaveBalances' => fn ($q) => $q->orderByDesc('leave_year'),
                'separation',
                'promotions',
                'dataCorrectionReports' => fn ($q) => $q->orderByDesc('created_at'),
            ]);

            $tenure = $this->tenureService->calculateTenure($employee);
            $annualLeaveEntitlement = $this->leaveService->calculateAnnualEntitlement($employee);

            if (empty($employee->company_experience) || str_starts_with($employee->company_experience, '=') || str_contains($employee->company_experience, 'DATEDIF') || str_contains($employee->company_experience, 'Year,')) {
                $employee->company_experience = $tenure['formatted'] ?? '—';
            }
            if (empty($employee->total_experience) || str_starts_with($employee->total_experience, '=') || str_contains($employee->total_experience, 'DATEDIF') || str_contains($employee->total_experience, 'Year,')) {
                $employee->total_experience = $employee->previous_experience
                    ? "{$employee->previous_experience} + {$employee->company_experience}"
                    : $employee->company_experience;
            }

            $retirementInfo = null;
            if ($employee->birth_date) {
                $retDate = $this->retirementService->calculateRetirementDate(Carbon::parse($employee->birth_date));
                $daysRemaining = (int) Carbon::now()->diffInDays($retDate, false);
                $isRetired = $daysRemaining <= 0 || $employee->status === 'Retired';
                $isNear = $this->retirementService->isNearingRetirement(Carbon::parse($employee->birth_date));
                $statusLabel = $isRetired ? 'Retired' : ($isNear ? 'Nearing Retirement' : 'Active (Not Retired)');

                $retirementInfo = [
                    'retirement_date' => $retDate->toDateString(),
                    'days_remaining' => $daysRemaining,
                    'is_near' => $isNear,
                    'is_retired' => $isRetired,
                    'status_label' => $statusLabel,
                ];
            }
        } else {
            $tenure = ['years' => 0, 'months' => 0, 'days' => 0, 'formatted' => '0 Days'];
            $annualLeaveEntitlement = 16;
            $retirementInfo = null;
        }

        return Inertia::render('Portal/Profile', [
            'employee' => $employee,
            'tenure' => $tenure,
            'annualLeaveEntitlement' => $annualLeaveEntitlement,
            'retirementInfo' => $retirementInfo,
            'discrepancyReports' => $employee ? $employee->dataCorrectionReports : [],
        ]);
    }

    /**
     * Submit a data discrepancy report for HR review.
     */
    public function reportDiscrepancy(StoreDiscrepancyRequest $request): RedirectResponse
    {
        $user = $request->user();
        $employee = $user->employee;
        if (! $employee && in_array($user->role, ['HRAdmin', 'SysAdmin'], true)) {
            $employee = Employee::firstOrFail();
        }
        abort_unless($employee, 403, 'Your account is not linked to an employee profile.');

        $employee->dataCorrectionReports()->create([
            'field_name' => $request->validated('field_name'),
            'current_value' => $request->validated('current_value'),
            'proposed_value' => $request->validated('proposed_value'),
            'explanation' => $request->validated('explanation'),
            'status' => 'Pending',
        ]);

        return back()->with('success', 'Discrepancy report successfully submitted to HR.');
    }

    /**
     * Review or update a data discrepancy report (HR Admin).
     */
    public function reviewDiscrepancy(Request $request, DataCorrectionReport $report): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:Approved,Rejected'],
            'reviewer_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $report->update([
            'status' => $validated['status'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'reviewer_notes' => $validated['reviewer_notes'] ?? null,
        ]);

        if ($validated['status'] === 'Approved' && $report->employee) {
            $fieldMapping = [
                'Full Name' => 'full_name',
                'Gender' => 'gender',
                'DOB (E.C)' => 'birth_date_ec',
                'Marital Status' => 'marital_status',
                'Phone Number' => 'phone',
                'Telephone Number' => 'phone',
                'Email Address' => 'email',
                'Region' => 'region',
                'City' => 'city',
                'Sub-City' => 'sub_city',
                'Woreda' => 'woreda',
                'House No' => 'house_no',
                'Emergency Contact Name' => 'emergency_contact_name',
                'Emergency Contact Phone' => 'emergency_contact_phone',
                'Emergency Contact Relationship' => 'emergency_contact_relationship',
                'POESSA Pension No' => 'poessa_no',
                'PSSSA Pension No' => 'psssa_no',
                'Social Security Scheme No' => 'social_security_no',
                'Tax ID (TIN)' => 'tin_no',
                'Commercial Bank Name' => 'bank_name',
                'Commercial Bank Account' => 'bank_account_no',
                'Education Attainment Level' => 'education_status',
                'Institution / University' => 'institution',
                'Graduation Year (E.C.)' => 'graduation_year_ec',
                'Professional License' => 'professional_license',
                'Cost Sharing Obligation Status' => 'cost_sharing_status',
                'Position Title' => 'position',
                'Workplace / Deployment Site' => 'work_place',
                'Vehicle Plate Number' => 'plate_number',
                'Company Experience' => 'company_experience',
                'Previous Experience' => 'previous_experience',
            ];

            $col = $fieldMapping[$report->field_name] ?? $report->field_name;
            $allowedColumns = [
                'full_name', 'gender', 'birth_date_ec', 'marital_status',
                'phone', 'email', 'region', 'city', 'sub_city',
                'woreda', 'house_no', 'emergency_contact_name', 'emergency_contact_phone',
                'emergency_contact_relationship', 'tin_no', 'bank_name', 'bank_account_no',
                'social_security_no', 'poessa_no', 'psssa_no', 'education_status',
                'institution', 'graduation_year_ec', 'professional_license', 'cost_sharing_status',
                'position', 'work_place', 'plate_number',
                'company_experience', 'previous_experience',
            ];

            if (in_array($col, $allowedColumns, true)) {
                $report->employee->update([$col => $report->proposed_value]);
            }
        }

        return back()->with('success', "Discrepancy report {$validated['status']}.");
    }
}
