<?php

namespace App\Console\Commands;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\Separation;
use App\Models\User;
use App\Services\EthiopianCalendarService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Throwable;

class ImportTerminatedEmployeesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hrms:import-terminated-employees {--file= : Path to the Terminate JSON file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ingest all 49 terminated personnel records from Terminate.json into employees, salaries, and separations tables';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $filePath = $this->option('file') ?: public_path('Terminate.json');

        if (! file_exists($filePath)) {
            // Check fallback with space
            $altPath = public_path('Terminate .json');
            if (file_exists($altPath)) {
                $filePath = $altPath;
            } else {
                $this->error("Terminate JSON file not found at: {$filePath}");

                return self::FAILURE;
            }
        }

        $raw = file_get_contents($filePath);
        $data = json_decode($raw, true);

        if (! $data || ! isset($data['sheets'])) {
            $this->error('Failed to parse Terminate JSON structure.');

            return self::FAILURE;
        }

        $sheets = [
            'HameleTerminate 2018' => ['month' => 11, 'year' => 2018],
            'nehase Terminate 2018' => ['month' => 12, 'year' => 2018],
            'Mesekerem Terminate 2019' => ['month' => 1, 'year' => 2019],
            'Tekemet Terminate 2019' => ['month' => 2, 'year' => 2019],
        ];

        // Preload departments
        $departments = Department::all()->keyBy('name');
        $deptFallback = Department::where('name', 'Construction & Engineering')->first() ?? Department::first();

        $processed = 0;
        $createdEmployees = 0;
        $updatedEmployees = 0;
        $createdSeparations = 0;

        foreach ($sheets as $sheetName => $sheetInfo) {
            // Handle possible trailing space in JSON sheet key
            $sheetData = $data['sheets'][$sheetName]['records']
                ?? $data['sheets'][$sheetName.' ']['records']
                ?? [];

            $this->line("Processing {$sheetName} (".count($sheetData).' records)...');

            foreach ($sheetData as $row) {
                $fileNoRaw = trim((string) ($row['File No'] ?? ''));
                $fullName = trim((string) ($row['Full Name with Grand Father'] ?? ''));

                if (! $fileNoRaw || ! $fullName) {
                    continue;
                }

                $processed++;

                // Resolve file number collisions (e.g. E-017 and B-031 reused for active employees in Tikemet 2019)
                $fileNo = $fileNoRaw;
                $existingByFile = Employee::where('file_no', $fileNoRaw)->first();
                if ($existingByFile && $existingByFile->full_name !== $fullName && $existingByFile->status !== 'Separated') {
                    $fileNo = $fileNoRaw.'-TERM';
                    $this->info("Assigning alias {$fileNo} for {$fullName} to avoid collision with active employee {$existingByFile->full_name}");
                }

                // Resolve Department
                $deptRaw = trim((string) ($row['Department'] ?? ''));
                $department = $this->resolveDepartment($deptRaw, $departments, $deptFallback);

                // Parse Gender
                $maleVal = strtolower(trim((string) ($row['Male'] ?? '')));
                $gender = ($maleVal === 'female' || $maleVal === 'f') ? 'Female' : 'Male';

                // Parse Employment Dates
                $hireEc = trim((string) ($row['Date of Employment (D/M/Y) E.C'] ?? ''));
                $hireGcRaw = trim((string) ($row['Date of Employment (D/M/Y) G.C'] ?? ''));
                $employmentDate = $this->parseGregorianOrConvert($hireGcRaw, $hireEc, 2018);

                // Parse Birth Dates
                $birthEc = trim((string) ($row['Date of Birth (D/M/Y) E.C'] ?? ''));
                $birthGcRaw = trim((string) ($row['Date of Birth (D/M/Y) G.C'] ?? ''));
                $birthDate = $this->parseGregorianOrConvert($birthGcRaw, $birthEc, 1990);

                // Parse Termination Date (E.C. and G.C.)
                $termEcRaw = trim((string) ($row['Date of Termination (D/M/Y) E.C'] ?? ''));
                $termDates = $this->parseTerminationDate($termEcRaw, $sheetInfo['month'], $sheetInfo['year']);
                $termEc = $termDates['ec'];
                $termGc = $termDates['gc'];

                // Reason & Separation Type
                $reason = trim((string) ($row['Remark'] ?? ($row['Reason For Termination'] ?? 'Resigned')));
                if (! $reason) {
                    $reason = 'Resigned';
                }
                $sepType = $this->resolveSeparationType($reason);

                // Basic Salary & Allowances
                $basicSalary = (float) ($row['Gross Basic Salary'] ?? 0);
                $respAllowance = (float) ($row['Responsibility Allowance'] ?? 0);
                $projAllowance = (float) ($row['Project Allowance'] ?? 0);
                $posAllowance = (float) ($row['Position Allowance'] ?? 0);
                $dailyAllowance = (float) ($row['Daily Allowance'] ?? 0);
                $desertAllowance = (float) ($row['Desert Allowance'] ?? 0);
                $housingAllowance = (float) ($row['Housing Allowance'] ?? 0);
                $transportAllowance = (float) ($row['Transport Allowance'] ?? 0);
                $fuelBirr = (float) ($row['Fuel Allowance (Birr)'] ?? 0);
                $totalSalary = (float) ($row['Total Gross Earning'] ?? 0);
                if ($totalSalary <= 0) {
                    $totalSalary = $basicSalary + $respAllowance + $projAllowance + $posAllowance + $dailyAllowance + $desertAllowance + $housingAllowance + $transportAllowance + $fuelBirr;
                }
                $pensionCompany = (float) ($row['11% Pension Contribution'] ?? ($basicSalary * 0.11));

                // 1. Create or Update Employee
                $employee = Employee::where('file_no', $fileNo)->first()
                    ?? Employee::where('full_name', $fullName)->first();

                $employeeData = [
                    'file_no' => $fileNo,
                    'full_name' => $fullName,
                    'gender' => $gender,
                    'marital_status' => $row['Marital Status'] ?? null,
                    'employment_type' => $this->resolveEmploymentType($row['Job Title'] ?? ''),
                    'contract_type' => $row['Term of Employment'] ?? 'Permanent',
                    'status' => 'Separated',
                    'remarks' => $reason,
                    'department_id' => $department->id,
                    'position' => $row['Job Title'] ?? 'Staff',
                    'work_place' => $row['Work Place'] ?? 'Head Office',
                    'grade' => $row['Job Grade'] ?? null,
                    'step' => $row['Steps'] ?? null,
                    'education_status' => $row['Educational Qualification'] ?? null,
                    'institution' => $row['Name of Institution Graduated from'] ?? null,
                    'graduation_year_ec' => $row['Year of Graduation E.C'] ?? null,
                    'employment_date_ec' => $hireEc ?: '01/11/2018',
                    'employment_date' => $employmentDate?->toDateString(),
                    'birth_date_ec' => $birthEc ?: null,
                    'birth_date' => $birthDate?->toDateString(),
                    'phone' => $row['Telephone No.'] ?? null,
                    'emergency_contact_name' => $row['Emergency Contact Person'] ?? null,
                    'poessa_no' => $row['POESSA No'] ?? null,
                    'psssa_no' => $row['PSSSA No'] ?? null,
                    'tin_no' => $row['TIN'] ?? null,
                    'bank_name' => $row['Bank Name'] ?? null,
                    'bank_account_no' => $row['Bank Acct. No.'] ?? null,
                    'company_experience' => $row['Company Experience (Y/M)'] ?? null,
                ];

                if ($employee) {
                    $employee->update($employeeData);
                    $updatedEmployees++;
                } else {
                    $employee = Employee::create($employeeData);
                    $createdEmployees++;
                }

                // Deactivate user account if any
                if ($employee->user_id) {
                    User::where('id', $employee->user_id)->update(['is_active' => false]);
                }

                // 2. Ingest Current Salary Record
                if ($basicSalary > 0) {
                    EmployeeSalary::updateOrCreate(
                        [
                            'employee_id' => $employee->id,
                            'is_current' => true,
                        ],
                        [
                            'basic_salary' => $basicSalary,
                            'gross_salary' => $totalSalary,
                            'total_salary' => $totalSalary,
                            'pension_company' => $pensionCompany,
                            'pension_employee' => round($basicSalary * 0.07, 2),
                            'effective_date' => $employmentDate?->toDateString() ?? $termGc->toDateString(),
                            'remarks' => 'Final Compensation at Separation',
                        ]
                    );
                }

                // 3. Ingest Separation Record
                $completedYears = 0.0;
                if ($employmentDate && $termGc->greaterThanOrEqualTo($employmentDate)) {
                    $completedYears = round(max(0.0, (float) $employmentDate->floatDiffInYears($termGc)), 2);
                }

                Separation::updateOrCreate(
                    ['employee_id' => $employee->id],
                    [
                        'separation_type' => $sepType,
                        'effective_date' => $termGc->toDateString(),
                        'termination_date_ec' => $termEc,
                        'reason' => $reason,
                        'basic_salary_at_separation' => $basicSalary,
                        'completed_years_service' => $completedYears,
                        'severance_amount' => 0.00,
                        'severance_paid' => false,
                    ]
                );

                $createdSeparations++;
            }
        }

        $this->newLine();
        $this->info('=== Ingestion Complete ===');
        $this->info("Total Records Processed: {$processed}");
        $this->info("Employees Created: {$createdEmployees}");
        $this->info("Employees Updated to Separated: {$updatedEmployees}");
        $this->info("Separation Records Created/Updated: {$createdSeparations}");

        return self::SUCCESS;
    }

    protected function resolveDepartment(string $deptRaw, $departments, ?Department $fallback = null): Department
    {
        $map = [
            'Engineering Dept' => 'Construction & Engineering',
            'Constrruction & Engineering' => 'Construction & Engineering',
            'Construction & Engineering' => 'Construction & Engineering',
            'P&ED' => 'P&ED',
            'GSFAD' => 'GSFAD',
            'PAD' => 'PAD',
            'HRAD' => 'HC Directorate',
            'HC Directorate' => 'HC Directorate',
            'SHED' => 'SHED',
            'CEO' => 'CEO Office',
            'General Manager Office' => 'CEO Office',
            'CEO Office' => 'CEO Office',
            'Finance Dept' => 'Finance Dept',
            'PMO Office' => 'PMO Office',
            'PSCD' => 'PSCD',
            'ICT' => 'ICT',
            'IT' => 'IT',
        ];

        $targetName = $map[$deptRaw] ?? ($deptRaw ?: 'Construction & Engineering');

        if (isset($departments[$targetName])) {
            return $departments[$targetName];
        }

        foreach ($departments as $name => $d) {
            if (stripos($name, $targetName) !== false || stripos($targetName, $name) !== false) {
                return $d;
            }
        }

        if ($fallback) {
            return $fallback;
        }

        return Department::firstOrCreate(['name' => $targetName]);
    }

    protected function resolveSeparationType(string $reason): string
    {
        $lower = strtolower($reason);

        if (str_contains($lower, 'probation')) {
            return 'Probation_Failed';
        }
        if (str_contains($lower, 'lay off') || str_contains($lower, 'layoff')) {
            return 'Layoff';
        }
        if (str_contains($lower, 'disappear') || str_contains($lower, 'abandon') || str_contains($lower, 'with cause')) {
            return 'Termination_With_Cause';
        }
        if (str_contains($lower, 'retire')) {
            return 'Retirement';
        }
        if (str_contains($lower, 'contract')) {
            return 'Contract_Expired';
        }

        return 'Resignation';
    }

    protected function resolveEmploymentType(string $position): string
    {
        $pos = strtolower($position);
        if (str_contains($pos, 'head') || str_contains($pos, 'director') || str_contains($pos, 'manager') || str_contains($pos, 'officer') || str_contains($pos, 'ceo')) {
            return 'Managerial';
        }

        return 'Non-Managerial';
    }

    protected function parseGregorianOrConvert(string $gcRaw, string $ecRaw, int $defaultYear): ?Carbon
    {
        if ($gcRaw) {
            try {
                return Carbon::parse($gcRaw);
            } catch (Throwable) {
                // fallback to EC
            }
        }

        if (! $ecRaw) {
            return null;
        }

        // Parse EC: DD/MM/YYYY or YYYY-MM-DD
        if (preg_match('/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/', $ecRaw, $m)) {
            $day = (int) $m[1];
            $month = (int) $m[2];
            $year = (int) $m[3];
            if ($month > 13) {
                $temp = $day;
                $day = $month;
                $month = $temp;
            }
            try {
                return EthiopianCalendarService::toGregorian($year, $month, min(30, max(1, $day)));
            } catch (Throwable) {
                return null;
            }
        }

        if (preg_match('/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/', $ecRaw, $m)) {
            $year = (int) $m[1];
            $month = (int) $m[2];
            $day = (int) $m[3];
            if ($month > 13) {
                $temp = $day;
                $day = $month;
                $month = $temp;
            }
            try {
                return EthiopianCalendarService::toGregorian($year, $month, min(30, max(1, $day)));
            } catch (Throwable) {
                return null;
            }
        }

        return null;
    }

    protected function parseTerminationDate(string $raw, int $defaultMonth, int $defaultYear): array
    {
        $raw = trim($raw);
        $year = $defaultYear;
        $month = $defaultMonth;
        $day = 15;

        if (preg_match('/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/', $raw, $m)) {
            $p1 = (int) $m[1];
            $p2 = (int) $m[2];
            $p3 = (int) $m[3];

            $year = ($p3 === 2026) ? $defaultYear : $p3;

            if ($p2 === $defaultMonth) {
                $day = $p1;
                $month = $p2;
            } elseif ($p1 === $defaultMonth && $p2 <= 30) {
                $month = $p1;
                $day = $p2;
            } else {
                $day = $p1;
                $month = $p2;
            }
        } elseif (preg_match('/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/', $raw, $m)) {
            $year = (int) $m[1];
            $p2 = (int) $m[2];
            $p3 = (int) $m[3];

            if ($p3 === $defaultMonth) {
                $day = $p2;
                $month = $p3;
            } elseif ($p2 === $defaultMonth) {
                $month = $p2;
                $day = $p3;
            } elseif ($p2 > 12) {
                $day = $p2;
                $month = $p3;
            } else {
                $month = $p2;
                $day = $p3;
            }
        } elseif (preg_match('/^(\d{1,2})[\/\-\.](\d{1,2})$/', $raw, $m)) {
            $day = (int) $m[1];
            $month = (int) $m[2];
            $year = $defaultYear;
        }

        // Sanitize bounds
        $month = max(1, min(13, $month));
        $day = max(1, min(30, $day));

        try {
            $gc = EthiopianCalendarService::toGregorian($year, $month, $day);
        } catch (Throwable) {
            $gc = Carbon::now();
        }

        $formattedEc = sprintf('%02d/%02d/%04d', $day, $month, $year);

        return [
            'ec' => $formattedEc,
            'gc' => $gc,
        ];
    }
}
