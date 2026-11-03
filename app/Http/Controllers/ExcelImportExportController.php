<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Employee;
use App\Services\EthiopianCalendarService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExcelImportExportController extends Controller
{
    /**
     * Display the Excel Import & Reconciliation Center (Consolidated into Staff Directory).
     */
    public function index(): RedirectResponse
    {
        return redirect()->route('employees.index', ['openImport' => 'true']);
    }

    /**
     * Preview and dry-run validate uploaded spreadsheet before committing.
     */
    public function preview(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ]);

        $file = $request->file('file');
        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, true);

        if (empty($rows)) {
            return back()->withErrors(['file' => 'Uploaded spreadsheet contains no data rows.']);
        }

        $headerRow = array_shift($rows);
        $headerMap = [];
        foreach ($headerRow as $colLetter => $headerText) {
            if ($headerText) {
                $clean = strtolower(trim(preg_replace('/[^A-Za-z0-9]/', '', (string) $headerText)));
                $headerMap[$colLetter] = $clean;
            }
        }

        $newRecords = [];
        $updateRecords = [];
        $errorRecords = [];

        $departments = Department::pluck('id', 'name')->toArray();
        $existingFileNos = Employee::pluck('id', 'file_no')->toArray();

        $rowNumber = 1;
        foreach ($rows as $row) {
            $rowNumber++;

            // Extract fields based on fuzzy header matching or positional defaults
            $fileNo = null;
            $fullName = null;
            $deptName = null;
            $position = null;
            $workPlace = 'Project';
            $gender = 'Male';
            $basicSalary = 0.0;
            $employmentDate = null;
            $employmentDateEc = null;

            foreach ($row as $col => $val) {
                $h = $headerMap[$col] ?? '';
                $valStr = is_string($val) ? trim($val) : (string) $val;

                if (in_array($h, ['fileno', 'idno', 'empno', 'filenumber', 'id'])) {
                    $fileNo = $valStr;
                } elseif (in_array($h, ['fullname', 'name', 'employeename'])) {
                    $fullName = $valStr;
                } elseif (in_array($h, ['department', 'dept'])) {
                    $deptName = $valStr;
                } elseif (in_array($h, ['position', 'jobtitle', 'title'])) {
                    $position = $valStr;
                } elseif (in_array($h, ['workplace', 'worksite', 'site', 'location'])) {
                    $workPlace = stripos($valStr, 'head') !== false ? 'Head Office' : 'Project';
                } elseif (in_array($h, ['gender', 'sex', 'male', 'female', 'gendersex'])) {
                    $gender = (stripos($valStr, 'f') === 0 || strtolower($valStr) === 'female') ? 'Female' : 'Male';
                } elseif (in_array($h, ['basicsalary', 'salary', 'basicwage', 'basic'])) {
                    $basicSalary = (float) preg_replace('/[^0-9.]/', '', $valStr);
                } elseif (in_array($h, ['employmentdate', 'hiredate', 'startdate'])) {
                    $employmentDate = $valStr;
                } elseif (in_array($h, ['employmentdateec', 'hiredateec', 'startdateec'])) {
                    $employmentDateEc = $valStr;
                }
            }

            // Positional fallback if headers did not match standard keywords
            if (! $fileNo && ! empty($row['A'])) {
                $fileNo = trim((string) $row['A']);
            }
            if (! $fullName && ! empty($row['B'])) {
                $fullName = trim((string) $row['B']);
            }
            if ($gender === 'Male' && ! empty($row['E'])) {
                $eVal = strtolower(trim((string) $row['E']));
                if (in_array($eVal, ['female', 'f']) || str_starts_with($eVal, 'f')) {
                    $gender = 'Female';
                }
            }

            // Skip completely empty spacer rows
            if (! $fileNo && ! $fullName) {
                continue;
            }

            $errors = [];
            if (! $fileNo) {
                $errors[] = 'Missing File No';
            }
            if (! $fullName) {
                $errors[] = 'Missing Full Name';
            }

            // Resolve or create department
            $deptId = null;
            if ($deptName) {
                $deptId = $departments[$deptName] ?? null;
                if (! $deptId) {
                    $d = Department::firstOrCreate(['name' => $deptName]);
                    $deptId = $d->id;
                    $departments[$deptName] = $deptId;
                }
            } else {
                $deptId = array_values($departments)[0] ?? Department::firstOrCreate(['name' => 'General Operations'])->id;
            }

            // Normalize employment date
            $parsedDate = now()->toDateString();
            if ($employmentDate) {
                try {
                    $parsedDate = Carbon::parse($employmentDate)->toDateString();
                } catch (\Throwable) {
                    $parsedDate = now()->toDateString();
                }
            }

            if (! $employmentDateEc) {
                $conv = EthiopianCalendarService::toEthiopian(Carbon::parse($parsedDate));
                $employmentDateEc = $conv['formatted'];
            }

            $recordData = [
                'row' => $rowNumber,
                'file_no' => $fileNo,
                'full_name' => $fullName,
                'department_id' => $deptId,
                'department_name' => $deptName ?: 'General Operations',
                'position' => $position ?: 'General Staff',
                'work_place' => $workPlace,
                'gender' => $gender,
                'employment_type' => 'Non-Managerial',
                'contract_type' => 'Permanent',
                'status' => 'Permanent',
                'employment_date' => $parsedDate,
                'employment_date_ec' => $employmentDateEc,
                'basic_salary' => $basicSalary > 0 ? $basicSalary : 10000.0,
            ];

            if (! empty($errors)) {
                $recordData['errors'] = $errors;
                $errorRecords[] = $recordData;
            } elseif (isset($existingFileNos[$fileNo])) {
                $recordData['employee_id'] = $existingFileNos[$fileNo];
                $updateRecords[] = $recordData;
            } else {
                $newRecords[] = $recordData;
            }
        }

        return response()->json([
            'summary' => [
                'total_scanned' => count($newRecords) + count($updateRecords) + count($errorRecords),
                'new_count' => count($newRecords),
                'update_count' => count($updateRecords),
                'error_count' => count($errorRecords),
            ],
            'new_records' => array_slice($newRecords, 0, 50),
            'update_records' => array_slice($updateRecords, 0, 50),
            'error_records' => $errorRecords,
            'all_valid_payload' => array_merge($newRecords, $updateRecords),
        ]);
    }

    /**
     * Commit verified spreadsheet records to database.
     */
    public function execute(Request $request): RedirectResponse
    {
        $request->validate([
            'records' => ['required', 'array', 'min:1'],
            'records.*.file_no' => ['required', 'string'],
            'records.*.full_name' => ['required', 'string'],
            'records.*.department_id' => ['required', 'exists:departments,id'],
            'records.*.position' => ['required', 'string'],
            'records.*.work_place' => ['required', 'in:Project,Head Office'],
            'records.*.gender' => ['required', 'in:Male,Female'],
            'records.*.basic_salary' => ['required', 'numeric', 'min:0'],
        ]);

        $records = $request->input('records');
        $createdCount = 0;
        $updatedCount = 0;

        DB::transaction(function () use ($records, &$createdCount, &$updatedCount) {
            foreach ($records as $item) {
                $employee = Employee::where('file_no', $item['file_no'])->first();

                if ($employee) {
                    $oldValues = $employee->toArray();
                    $employee->update([
                        'full_name' => $item['full_name'],
                        'department_id' => $item['department_id'],
                        'position' => $item['position'],
                        'work_place' => $item['work_place'],
                        'gender' => $item['gender'],
                    ]);
                    $updatedCount++;

                    AuditLog::create([
                        'user_id' => auth()->id(),
                        'action' => 'IMPORT_UPDATE',
                        'auditable_type' => Employee::class,
                        'auditable_id' => $employee->id,
                        'old_values' => $oldValues,
                        'new_values' => $employee->fresh()->toArray(),
                        'ip_address' => request()->ip(),
                        'user_agent' => request()->userAgent(),
                    ]);
                } else {
                    $employee = Employee::create([
                        'file_no' => $item['file_no'],
                        'full_name' => $item['full_name'],
                        'department_id' => $item['department_id'],
                        'position' => $item['position'],
                        'work_place' => $item['work_place'],
                        'gender' => $item['gender'],
                        'employment_type' => $item['employment_type'] ?? 'Non-Managerial',
                        'contract_type' => $item['contract_type'] ?? 'Permanent',
                        'status' => $item['status'] ?? 'Permanent',
                        'employment_date' => $item['employment_date'] ?? now()->toDateString(),
                        'employment_date_ec' => $item['employment_date_ec'] ?? '2017-01-01',
                    ]);

                    $basic = (float) $item['basic_salary'];
                    $employee->salaries()->create([
                        'basic_salary' => $basic,
                        'total_salary' => $basic,
                        'pension_employee' => round($basic * 0.07, 2),
                        'pension_company' => round($basic * 0.11, 2),
                        'effective_date' => $employee->employment_date,
                        'is_current' => true,
                    ]);

                    $employee->leaveBalances()->create([
                        'leave_year' => (int) date('Y'),
                        'entitled_days' => 16.0,
                        'carried_over_days' => 0.0,
                        'taken_days' => 0.0,
                        'remaining_days' => 16.0,
                    ]);

                    $createdCount++;

                    AuditLog::create([
                        'user_id' => auth()->id(),
                        'action' => 'IMPORT_CREATE',
                        'auditable_type' => Employee::class,
                        'auditable_id' => $employee->id,
                        'old_values' => null,
                        'new_values' => $employee->fresh()->toArray(),
                        'ip_address' => request()->ip(),
                        'user_agent' => request()->userAgent(),
                    ]);
                }
            }
        });

        return redirect()->route('employees.index')->with(
            'success',
            "Reconciliation complete: {$createdCount} new employees registered, {$updatedCount} profiles updated."
        );
    }

    /**
     * Download standard Excel/CSV onboarding template.
     */
    public function downloadTemplate(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="Elhadar_HRMS_Import_Template.csv"',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'File No',
                'Full Name',
                'Gender',
                'Department',
                'Position',
                'Work Place',
                'Basic Salary',
                'Employment Date',
                'Employment Date EC',
            ]);
            fputcsv($handle, [
                'ELH-099',
                'Abebe Kebede Tessema',
                'Male',
                'Engineering',
                'Project Surveyor',
                'Project',
                '18500',
                '2024-01-15',
                '2016-05-07',
            ]);
            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Export master employee roster to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $query = Employee::with(['department', 'currentSalary'])->orderBy('file_no');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($workPlace = $request->input('work_place')) {
            $query->where('work_place', $workPlace);
        }

        $employees = $query->get();
        $dateStr = now()->format('Y-m-d');
        $fileName = "Elhadar_Staff_Roster_{$dateStr}.csv";

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        return response()->stream(function () use ($employees) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'File No',
                'Full Name',
                'Gender',
                'Marital Status',
                'Date of Birth (E.C.)',
                'Date of Birth (G.C.)',
                'Department',
                'Position',
                'Job Grade',
                'Step',
                'Work Place',
                'Employment Type',
                'Contract Type',
                'Status',
                'Employment Date (G.C.)',
                'Employment Date (E.C.)',
                'Basic Salary (ETB)',
                'Responsibility Allowance (ETB)',
                'Gross Salary (ETB)',
                'Employee Pension 7% (ETB)',
                'Company Pension 11% (ETB)',
                'Phone',
                'Email',
                'Emergency Contact Person',
                'Relationship',
                'Emergency Contact Phone',
                'TIN No',
                'Bank Name',
                'Bank Account No',
                'POESSA No',
                'PSSSA No',
                'Plate Number',
                'Remarks',
            ]);

            foreach ($employees as $emp) {
                $sal = $emp->currentSalary;
                fputcsv($handle, [
                    $emp->file_no,
                    $emp->full_name,
                    $emp->gender,
                    $emp->marital_status ?? 'Single',
                    $emp->birth_date_ec ?? '',
                    $emp->birth_date ? Carbon::parse($emp->birth_date)->toDateString() : '',
                    $emp->department?->name ?? '—',
                    $emp->position,
                    $emp->grade ?? '',
                    $emp->step ?? '',
                    $emp->work_place,
                    $emp->employment_type,
                    $emp->contract_type,
                    $emp->status,
                    $emp->employment_date ? Carbon::parse($emp->employment_date)->toDateString() : '',
                    $emp->employment_date_ec ?? '',
                    $sal?->basic_salary ?? 0,
                    $sal?->responsibility_allowance ?? 0,
                    $sal?->total_salary ?? 0,
                    $sal?->pension_employee ?? 0,
                    $sal?->pension_company ?? 0,
                    $emp->phone ?? '',
                    $emp->email ?? '',
                    $emp->emergency_contact_name ?? '',
                    $emp->emergency_contact_relationship ?? '',
                    $emp->emergency_contact_phone ?? '',
                    $emp->tin_no ?? '',
                    $emp->bank_name ?? '',
                    $emp->bank_account_no ?? '',
                    $emp->poessa_no ?? '',
                    $emp->psssa_no ?? '',
                    $emp->plate_number ?? '',
                    $emp->remarks ?? '',
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }
}
