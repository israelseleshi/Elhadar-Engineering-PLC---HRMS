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
        $employee = $user->employee;

        // Fallback to first available employee for HR Admin accounts or demonstrations
        if (! $employee) {
            $employee = Employee::first();
        }

        if ($employee) {
            $employee->load([
                'department',
                'currentSalary',
                'leaveBalances' => fn ($q) => $q->orderByDesc('leave_year'),
                'dataCorrectionReports' => fn ($q) => $q->orderByDesc('created_at'),
            ]);

            $tenure = $this->tenureService->calculateTenure($employee);
            $annualLeaveEntitlement = $this->leaveService->calculateAnnualEntitlement($employee);

            $retirementInfo = null;
            if ($employee->birth_date) {
                $retDate = $this->retirementService->calculateRetirementDate(Carbon::parse($employee->birth_date));
                $retirementInfo = [
                    'retirement_date' => $retDate->toDateString(),
                    'days_remaining' => Carbon::now()->diffInDays($retDate, false),
                    'is_near' => $this->retirementService->isNearingRetirement(Carbon::parse($employee->birth_date)),
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
        $employee = $user->employee ?? Employee::firstOrFail();

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
