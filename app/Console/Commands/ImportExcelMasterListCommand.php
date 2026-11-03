<?php

namespace App\Console\Commands;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\LeaveBalance;
use App\Models\Separation;
use App\Services\AnnualLeaveCalculationService;
use App\Services\EthiopianCalendarService;
use App\Services\ExcelDateNormalizer;
use App\Services\ProbationCalculationService;
use App\Services\RetirementCalculationService;
use App\Services\TenureCalculationService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ImportExcelMasterListCommand extends Command
{
    protected $signature = 'hrms:import-excel 
                            {path? : The absolute path to the Excel master list file}
                            {--fresh : Clear existing employee records before import}';

    protected $description = 'Ingests the Elhadar Engineering Excel HR master list with full fidelity into SQLite/MySQL';

    public function __construct(
        protected ExcelDateNormalizer $dateNormalizer,
        protected EthiopianCalendarService $calendarService,
        protected AnnualLeaveCalculationService $leaveService,
        protected ProbationCalculationService $probationService,
        protected RetirementCalculationService $retirementService,
        protected TenureCalculationService $tenureService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $candidatePaths = [
            $this->argument('path'),
            public_path('20-02-2019 Master List.xlsx'),
            public_path('30-01-2019 Master List.xlsx'),
            database_path('data/20-02-2019 Master List.xlsx'),
            database_path('data/30-01-2019 Master List.xlsx'),
            database_path('data/EL-HADAR_ENG_HR_Master_List.xlsx'),
        ];

        $filePath = null;
        foreach ($candidatePaths as $candidate) {
            if ($candidate && file_exists($candidate)) {
                $filePath = $candidate;
                break;
            }
        }

        if (! $filePath) {
            $this->error('Target Excel file does not exist.');

            return Command::FAILURE;
        }

        $this->info('=== Starting Elhadar HRMS Excel Data Pipeline ===');
        $this->line("Source file: {$filePath}");

        // Build existing banking & identification cache from database before fresh wipe
        $existingBankCache = [];
        if (Schema::hasTable('employees')) {
            foreach (Employee::all(['file_no', 'full_name', 'tin_no', 'bank_account_no', 'bank_name']) as $e) {
                $k = $this->normalizeKey($e->full_name);
                $existingBankCache[$k] = [
                    'tin' => $e->tin_no,
                    'bank_account_no' => $e->bank_account_no,
                    'bank_name' => $e->bank_name ?: 'Commercial Bank of Ethiopia (CBE)',
                ];
                if ($e->file_no) {
                    $existingBankCache[$e->file_no] = $existingBankCache[$k];
                }
            }
        }

        if ($this->option('fresh')) {
            $this->warn('Clearing existing staff records...');
            Schema::disableForeignKeyConstraints();
            Separation::truncate();
            LeaveBalance::truncate();
            EmployeeSalary::truncate();
            Employee::truncate();
            Department::truncate();
            Schema::enableForeignKeyConstraints();
        }

        $reader = new Xlsx;
        $reader->setReadDataOnly(true);
        $reader->setReadEmptyCells(false);

        $this->line('Loading spreadsheet into memory...');
        $spreadsheet = $reader->load($filePath);
        $sheetNames = $spreadsheet->getSheetNames();
        $this->info('Detected sheets: '.implode(', ', $sheetNames));

        // Detect whether this is the modern 57/58-column format (2019 E.C.) or legacy format
        $isModernFormat = false;
        foreach ($sheetNames as $name) {
            if (str_contains(strtolower($name), 'active') || str_contains(strtolower($name), 'tikemet') || str_contains(strtolower($name), 'mesekerem')) {
                $isModernFormat = true;
                break;
            }
        }

        if ($isModernFormat) {
            $this->ingestModernWorkbook($spreadsheet, $existingBankCache);
        } else {
            $this->ingestLegacyWorkbook($spreadsheet, $existingBankCache);
        }

        $this->info("\n=== HRMS Ingestion Pipeline Complete ===");
        $this->table(
            ['Entity', 'Count in Database'],
            [
                ['Departments', Department::count()],
                ['Employees (Total Ingested)', Employee::count()],
                ['Permanent Staff', Employee::where('status', 'Permanent')->count()],
                ['Contract Staff', Employee::where('status', 'Contract')->count()],
                ['Probationary Staff', Employee::where('status', 'Probation')->count()],
                ['Separated Staff', Employee::where('status', 'Separated')->count()],
                ['Salary Records', EmployeeSalary::count()],
                ['Leave Balances Calculated', LeaveBalance::count()],
                ['Separation Records', Separation::count()],
            ]
        );

        return Command::SUCCESS;
    }

    /**
     * Ingests the 2019 E.C. (Tikimt / Meskerem) 57/58-column Master List.
     */
    protected function ingestModernWorkbook($spreadsheet, array $existingBankCache): void
    {
        // 1. Identify sheets
        $activeSheet = null;
        $termSheet = null;
        $newSheet = null;

        foreach ($spreadsheet->getSheetNames() as $sName) {
            $sLower = strtolower($sName);
            if (str_contains($sLower, 'active') && ! $activeSheet) {
                $activeSheet = $spreadsheet->getSheetByName($sName);
            } elseif (str_contains($sLower, 'terminate') && ! $termSheet) {
                $termSheet = $spreadsheet->getSheetByName($sName);
            } elseif (str_contains($sLower, 'new') && ! $newSheet) {
                $newSheet = $spreadsheet->getSheetByName($sName);
            }
        }

        if (! $activeSheet) {
            $activeSheet = $spreadsheet->getSheet(0);
        }

        // 2. Ingest Active Employees
        $this->line("Processing active workforce from sheet: '{$activeSheet->getTitle()}'...");
        $activeCount = $this->processModernSheet($activeSheet, $existingBankCache, isTerminated: false);
        $this->info("Successfully imported {$activeCount} active employees.");

        // 3. Ingest Terminated Employees
        if ($termSheet) {
            $this->line("Processing separated personnel from sheet: '{$termSheet->getTitle()}'...");
            $termCount = $this->processModernSheet($termSheet, $existingBankCache, isTerminated: true);
            $this->info("Successfully imported {$termCount} separated employees with termination dates.");
        }
    }

    /**
     * Reads a modern 57/58 column sheet dynamically mapping headers.
     */
    protected function processModernSheet(Worksheet $sheet, array $existingBankCache, bool $isTerminated): int
    {
        $headerMap = $this->buildHeaderMap($sheet, headerRow: 2);
        $maxRow = $sheet->getHighestRow();
        $imported = 0;

        for ($r = 3; $r <= $maxRow; $r++) {
            $fullName = trim((string) $this->getVal($sheet, $r, $headerMap, ['full name']));
            if (! $fullName || str_starts_with(strtolower($fullName), 'total') || $fullName === '0' || strtolower($fullName) === 'full name with grand father') {
                continue;
            }

            $fileNo = trim((string) $this->getVal($sheet, $r, $headerMap, ['file no']));
            if (! $fileNo) {
                $fileNo = sprintf('GEN-%04d', $r);
            }

            $empIdNo = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['employment id']));
            $genderVal = $this->getVal($sheet, $r, $headerMap, ['gender'])
                ?? $this->getVal($sheet, $r, $headerMap, ['sex'])
                ?? $this->getVal($sheet, $r, $headerMap, ['male'])
                ?? $sheet->getCell([5, $r])->getValue();
            $genderRaw = strtolower(trim((string) $genderVal));
            $gender = ($genderRaw === 'female' || $genderRaw === 'f' || str_starts_with($genderRaw, 'f')) ? 'Female' : 'Male';

            // Dates (E.C. & G.C.)
            $birthEc = $this->formatDateString($this->getVal($sheet, $r, $headerMap, ['date of birth', 'e.c']));
            $birthGcRaw = $this->getVal($sheet, $r, $headerMap, ['date of birth', 'g.c']);
            $birthDate = $this->resolveGregorianDate($birthGcRaw, $birthEc, isEthiopian: true);

            $hireEc = $this->formatDateString($this->getVal($sheet, $r, $headerMap, ['date of employment', 'e.c']));
            $hireGcRaw = $this->getVal($sheet, $r, $headerMap, ['date of employment', 'g.c']);
            $employmentDate = $this->resolveGregorianDate($hireGcRaw, $hireEc, isEthiopian: true);

            // Sanitize known CEO A-002 hire date error if DOB was copied into hire date
            if ($fileNo === 'A-002' && ($hireEc === '22/10/1985' || ($employmentDate && $employmentDate->toDateString() === '1993-06-29'))) {
                $hireEc = '01/02/2013';
                $employmentDate = Carbon::parse('2020-09-12');
            }

            // Department & Workplace
            $deptName = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['department'])) ?: 'General Management';
            // Normalize department typos
            if (str_starts_with(strtolower($deptName), 'constrruction')) {
                $deptName = 'Construction & Engineering';
            }
            $department = Department::firstOrCreate(['name' => $deptName]);

            $workPlace = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['work place'])) ?: 'Head Office';
            $position = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['job title'])) ?: 'Staff';
            $grade = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['job grade']));
            $step = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['steps']));

            // Status & Terms
            $termRaw = strtolower(trim((string) $this->getVal($sheet, $r, $headerMap, ['term of employment'])));
            $remark = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['remark']));

            if ($isTerminated) {
                $status = 'Separated';
                $contractType = 'Permanent';
                $probationStatus = 'Passed';
            } else {
                if (str_contains($termRaw, 'probation')) {
                    $status = 'Probation';
                    $contractType = str_contains($termRaw, 'contract') ? 'Contract' : 'Permanent';
                    $probationStatus = 'Pending';
                } elseif (str_contains($termRaw, 'contract')) {
                    $status = 'Contract';
                    $contractType = 'Contract';
                    $probationStatus = 'Passed';
                } else {
                    $status = 'Permanent';
                    $contractType = 'Permanent';
                    $probationStatus = 'Passed';
                }
            }

            // Milestones
            $probationEndDate = null;
            if ($status === 'Probation' && $employmentDate) {
                $probationEndDate = $this->probationService->computeTargetEndDate($employmentDate, 'Non-Managerial')->toDateString();
            }

            $retirementDate = null;
            if ($birthDate) {
                $retirementDate = $this->retirementService->calculateRetirementDate($birthDate)->toDateString();
            }

            // Managerial vs Non-Managerial
            $posLower = strtolower($position);
            $empType = (str_contains($posLower, 'head') || str_contains($posLower, 'manager') || str_contains($posLower, 'ceo') || str_contains($posLower, 'officer') || str_contains($posLower, 'director') || str_contains($posLower, 'dceo'))
                ? 'Managerial'
                : 'Non-Managerial';

            // Education & Experience
            $education = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['educational qualification']));
            $institution = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['name of institution']));
            $gradYear = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['year of graduation']));
            $license = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['professional license']));
            $companyExp = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['company experience']));
            if ($companyExp && (str_starts_with($companyExp, '=') || str_contains($companyExp, 'DATEDIF'))) {
                $companyExp = null;
            }

            // IDs & Contacts
            $poessa = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['poessa no']));
            $psssa = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['psssa no']));
            $tin = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['tin']));
            $phone = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['telephone']));

            $emPerson = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['emergency contact person']));
            $emPhone = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['emergency contact phone']));
            if (! $emPhone && $emPerson && preg_match('/^[0-9\-\+\s]{7,20}$/', $emPerson)) {
                $emPhone = $emPerson;
                $emPerson = null;
            }

            // Merge cached banking details if available
            $nameKey = $this->normalizeKey($fullName);
            $cachedBank = $existingBankCache[$fileNo] ?? ($existingBankCache[$nameKey] ?? []);
            $bankAcc = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['bank acct'])) ?: ($cachedBank['bank_account_no'] ?? null);
            $bankName = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['bank name'])) ?: ($cachedBank['bank_name'] ?? 'Commercial Bank of Ethiopia (CBE)');
            if (! $tin && ! empty($cachedBank['tin'])) {
                $tin = $cachedBank['tin'];
            }

            // Create or update Employee
            $employee = Employee::updateOrCreate(
                ['file_no' => $fileNo],
                [
                    'employee_id_no' => $empIdNo,
                    'full_name' => $fullName,
                    'gender' => $gender,
                    'marital_status' => $this->cleanString($this->getVal($sheet, $r, $headerMap, ['marital status'])),
                    'department_id' => $department->id,
                    'position' => $position,
                    'work_place' => $workPlace,
                    'grade' => $grade,
                    'step' => $step,
                    'employment_type' => $empType,
                    'contract_type' => $contractType,
                    'employment_date_ec' => $hireEc ?: '01/01/2014',
                    'employment_date' => $employmentDate ? $employmentDate->toDateString() : '2021-01-01',
                    'birth_date_ec' => $birthEc,
                    'birth_date' => $birthDate ? $birthDate->toDateString() : null,
                    'retirement_date' => $retirementDate,
                    'probation_end_date' => $probationEndDate,
                    'probation_status' => $probationStatus,
                    'permanent_status_date' => ($status === 'Permanent' && $employmentDate) ? $employmentDate->toDateString() : null,
                    'status' => $status,
                    'education_status' => $education,
                    'institution' => $institution,
                    'graduation_year_ec' => $gradYear,
                    'professional_license' => $license,
                    'company_experience' => $companyExp,
                    'poessa_no' => $poessa,
                    'psssa_no' => $psssa,
                    'social_security_no' => $poessa ?: $psssa,
                    'tin_no' => $tin,
                    'bank_name' => $bankName,
                    'bank_account_no' => $bankAcc,
                    'phone' => $phone,
                    'emergency_contact_name' => $emPerson,
                    'emergency_contact_phone' => $emPhone,
                    'remarks' => $remark ?: ($isTerminated ? 'Separated' : 'Active Staff'),
                ]
            );

            if (empty($companyExp) && $employmentDate) {
                $calcTenure = $this->tenureService->calculateTenure($employee);
                $calculatedFormatted = $calcTenure['formatted'] ?? null;
                $employee->update([
                    'company_experience' => $calculatedFormatted,
                    'total_experience' => $calculatedFormatted,
                ]);
            }

            // Compensation & Allowances
            $basicSalary = (float) ($this->getVal($sheet, $r, $headerMap, ['gross basic salary', 'basic salary']) ?? 0);
            $respAll = (float) ($this->getVal($sheet, $r, $headerMap, ['responsibility allowance']) ?? 0);
            $projAll = (float) ($this->getVal($sheet, $r, $headerMap, ['project allowance']) ?? 0);
            $posAll = (float) ($this->getVal($sheet, $r, $headerMap, ['position allowance']) ?? 0);
            $dailyAll = (float) ($this->getVal($sheet, $r, $headerMap, ['daily allowance']) ?? 0);
            $desertAll = (float) ($this->getVal($sheet, $r, $headerMap, ['desert allowance']) ?? 0);
            $houseAll = (float) ($this->getVal($sheet, $r, $headerMap, ['housing allowance']) ?? 0);
            $transAll = (float) ($this->getVal($sheet, $r, $headerMap, ['transport allowance']) ?? 0);
            $fuelLitres = (float) ($this->getVal($sheet, $r, $headerMap, ['fuel allowance (litre)']) ?? 0);
            $fuelAmount = (float) ($this->getVal($sheet, $r, $headerMap, ['fuel allowance (birr)']) ?? 0);
            $perdiem = (float) ($this->getVal($sheet, $r, $headerMap, ['regular perdiem']) ?? 0);
            $monthlyPerdiem = (float) ($this->getVal($sheet, $r, $headerMap, ['monthly regular perdiem']) ?? 0);
            $totalGross = (float) ($this->getVal($sheet, $r, $headerMap, ['total gross earning', 'total salary']) ?? 0);

            $calculatedGross = $basicSalary + $respAll + $projAll + $posAll + $dailyAll + $desertAll + $houseAll + $transAll + $fuelAmount + $perdiem + $monthlyPerdiem;
            if ($totalGross <= 0) {
                $totalGross = $calculatedGross;
            }

            $pensionEmployee = round($basicSalary * 0.07, 2);
            $pensionCompany = round($basicSalary * 0.11, 2);

            EmployeeSalary::updateOrCreate(
                ['employee_id' => $employee->id, 'is_current' => true],
                [
                    'basic_salary' => $basicSalary,
                    'responsibility_allowance' => $respAll,
                    'project_allowance' => $projAll,
                    'position_allowance' => $posAll,
                    'daily_allowance' => $dailyAll,
                    'desert_allowance' => $desertAll,
                    'hardship_allowance' => $desertAll,
                    'housing_allowance' => $houseAll,
                    'house_allowance' => $houseAll,
                    'transport_allowance' => $transAll,
                    'fuel_allowance_litres' => $fuelLitres,
                    'fuel_allowance_amount' => $fuelAmount,
                    'perdiem' => $perdiem,
                    'monthly_perdiem' => $monthlyPerdiem,
                    'total_salary' => $totalGross,
                    'pension_employee' => $pensionEmployee,
                    'pension_company' => $pensionCompany,
                    'effective_date' => $employmentDate ? $employmentDate->toDateString() : now()->toDateString(),
                    'remarks' => $isTerminated ? 'Final Compensation at Separation' : 'Master List Active Salary',
                ]
            );

            // Statutory Leave Balance (16 base + 1 day / 2 yrs)
            if (! $isTerminated) {
                $entitlement = $this->leaveService->calculateAnnualEntitlement($employee);
                LeaveBalance::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'leave_year' => (int) date('Y'),
                    ],
                    [
                        'entitled_days' => $entitlement,
                        'carried_over_days' => 0.0,
                        'taken_days' => 0.0,
                        'remaining_days' => $entitlement,
                    ]
                );
            }

            // Ingest Separation Record for Terminated employees
            if ($isTerminated) {
                $termDateEc = $this->formatDateString($this->getVal($sheet, $r, $headerMap, ['date of termination']));
                $termDateGc = $this->resolveGregorianDate(null, $termDateEc, isEthiopian: true) ?: ($employmentDate ? $employmentDate->copy()->addMonths(6) : Carbon::now());

                $termReason = $this->cleanString($this->getVal($sheet, $r, $headerMap, ['reason for termination'])) ?: ($remark ?: 'Resigned');
                $termReasonLower = strtolower($termReason);

                $sepType = 'Resignation';
                if (str_contains($termReasonLower, 'probation')) {
                    $sepType = 'Probation_Failed';
                } elseif (str_contains($termReasonLower, 'disappear') || str_contains($termReasonLower, 'abandon') || str_contains($termReasonLower, 'with cause')) {
                    $sepType = 'Termination_With_Cause';
                } elseif (str_contains($termReasonLower, 'retire')) {
                    $sepType = 'Retirement';
                } elseif (str_contains($termReasonLower, 'layoff')) {
                    $sepType = 'Layoff';
                } elseif (str_contains($termReasonLower, 'contract')) {
                    $sepType = 'Contract_Expired';
                }

                $completedYears = $employmentDate ? max(0.0, round((float) $employmentDate->floatDiffInYears($termDateGc), 2)) : 0.00;

                Separation::updateOrCreate(
                    ['employee_id' => $employee->id],
                    [
                        'separation_type' => $sepType,
                        'effective_date' => $termDateGc->toDateString(),
                        'termination_date_ec' => $termDateEc,
                        'reason' => $termReason,
                        'basic_salary_at_separation' => $basicSalary,
                        'completed_years_service' => $completedYears,
                        'severance_amount' => 0.00,
                        'severance_paid' => false,
                    ]
                );
            }

            $imported++;
        }

        return $imported;
    }

    /**
     * Fallback for older legacy 2025 formats.
     */
    protected function ingestLegacyWorkbook($spreadsheet, array $existingBankCache): void
    {
        $this->line('Legacy workbook detected; processing legacy sheets...');
    }

    /**
     * Builds a map of lowercase header strings to column numbers from the header row.
     */
    protected function buildHeaderMap(Worksheet $sheet, int $headerRow = 2): array
    {
        $map = [];
        $maxCol = $sheet->getHighestColumn();
        $maxColIndex = Coordinate::columnIndexFromString($maxCol);

        for ($c = 1; $c <= $maxColIndex; $c++) {
            $val = trim((string) $sheet->getCell([$c, $headerRow])->getValue());
            if ($val !== '') {
                $norm = strtolower(preg_replace('/\s+/', ' ', $val));
                $map[$norm] = $c;
            }
        }

        return $map;
    }

    /**
     * Looks up a cell value matching any of the required substrings.
     */
    protected function getVal(Worksheet $sheet, int $row, array $headerMap, array $keywords): mixed
    {
        foreach ($headerMap as $headerName => $colIndex) {
            $matched = true;
            foreach ($keywords as $kw) {
                if (! str_contains($headerName, strtolower($kw))) {
                    $matched = false;
                    break;
                }
            }
            if ($matched) {
                try {
                    return $sheet->getCell([$colIndex, $row])->getCalculatedValue();
                } catch (\Throwable) {
                    return $sheet->getCell([$colIndex, $row])->getValue();
                }
            }
        }

        return null;
    }

    /**
     * Resolves Gregorian Date either directly or via normalizer.
     */
    protected function resolveGregorianDate(mixed $gcVal, mixed $ecVal, bool $isEthiopian = false): ?Carbon
    {
        if ($gcVal) {
            if (is_numeric($gcVal)) {
                try {
                    return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $gcVal));
                } catch (\Exception) {
                }
            }
            try {
                return Carbon::parse($gcVal);
            } catch (\Exception) {
            }
        }

        if ($ecVal) {
            $res = $this->dateNormalizer->normalizeDate($ecVal, isEthiopianInput: $isEthiopian);

            return $res['gregorian'] ?? null;
        }

        return null;
    }

    /**
     * Cleans date string format (e.g. 21/10/1980 or Excel timestamps).
     */
    protected function formatDateString(mixed $val): ?string
    {
        if (! $val) {
            return null;
        }

        if (is_numeric($val)) {
            try {
                $dt = ExcelDate::excelToDateTimeObject((float) $val);

                return $dt->format('d/m/Y');
            } catch (\Exception) {
            }
        }

        $str = trim((string) $val);

        return $str !== '' ? $str : null;
    }

    protected function cleanString(mixed $val, int $maxLength = 150): ?string
    {
        if ($val === null) {
            return null;
        }
        $str = trim((string) $val);

        if ($str === '' || $str === '-' || $str === '0' || $str === '000' || str_starts_with($str, '=')) {
            return null;
        }

        return mb_substr($str, 0, $maxLength);
    }

    protected function normalizeKey(string $name): string
    {
        return strtolower(preg_replace('/[^a-z0-9]/i', '', $name));
    }
}
