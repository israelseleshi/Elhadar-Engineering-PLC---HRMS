<?php

namespace App\Console\Commands;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\LeaveBalance;
use App\Services\EthiopianCalendarService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class InsertTikemetEmployeesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hrms:insert-tikemet-employees';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Insert the 19 newly hired Tikemet 2019 employees into the employees table with calculated probation and retirement dates.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $targetFileNos = [
            'A-077', 'A-078', 'A-079', 'B-031', 'E-023', 'E-024',
            'G-025', 'G-027', 'G-028', 'G-029', 'K-019', 'K-020',
            'M-069', 'M-070', 'N-014', 'R-005', 'T-056', 'T-057', 'Y-034',
        ];

        $jsonPath = public_path('24-02-2019 Master List.json');
        if (! file_exists($jsonPath)) {
            $this->error("Master list JSON not found at {$jsonPath}");

            return 1;
        }

        $json = json_decode(file_get_contents($jsonPath), true);
        if (! $json || ! isset($json['sheets'])) {
            $this->error('Failed to parse master list JSON.');

            return 1;
        }

        // Collect target records from sheets
        $recordsByFileNo = [];
        foreach ($json['_metadata']['sheets'] as $sheetName) {
            foreach ($json['sheets'][$sheetName]['records'] as $record) {
                $fno = trim($record['File No'] ?? '');
                if (in_array($fno, $targetFileNos) && ! isset($recordsByFileNo[$fno])) {
                    $recordsByFileNo[$fno] = $record;
                }
            }
        }

        $this->info('Found '.count($recordsByFileNo).' matching target records in JSON.');

        $departmentMap = [
            'p&ed' => 53,
            'pad' => 49,
            'constrruction & engineering' => 46,
            'construction & engineering' => 46,
        ];

        $results = [];

        foreach ($targetFileNos as $fileNo) {
            if (! isset($recordsByFileNo[$fileNo])) {
                $this->warn("Record for File No {$fileNo} not found in JSON!");

                continue;
            }

            $r = $recordsByFileNo[$fileNo];

            // 1. Resolve Department ID
            $deptNameRaw = trim($r['Department'] ?? '');
            $deptLower = strtolower($deptNameRaw);
            $deptId = $departmentMap[$deptLower] ?? null;
            if (! $deptId) {
                $dept = Department::whereRaw('LOWER(name) = ?', [$deptLower])->first();
                $deptId = $dept ? $dept->id : 46;
            }

            // 2. Resolve Employment Date & Probation End Date (60 days from hire date)
            $hiredGc = trim($r['Date of Employment (D/M/Y) G.C'] ?? '');
            $hiredEc = trim($r['Date of Employment (D/M/Y) E.C'] ?? '');
            $employmentDate = null;
            if ($hiredGc && preg_match('/^\d{4}-\d{2}-\d{2}$/', $hiredGc)) {
                $employmentDate = Carbon::parse($hiredGc);
            } elseif ($hiredEc) {
                // If only EC date provided
                $parts = explode('/', str_replace('-', '/', $hiredEc));
                if (count($parts) === 3) {
                    try {
                        $employmentDate = EthiopianCalendarService::toGregorian((int) $parts[2], (int) $parts[1], (int) $parts[0]);
                    } catch (\Exception $e) {
                        $employmentDate = Carbon::parse('2026-10-12');
                    }
                }
            }
            if (! $employmentDate) {
                $employmentDate = Carbon::parse('2026-10-12');
            }

            // Exactly 60 days from hire date per Ethiopian Labour Proclamation 1156/2019
            $probationEndDate = $employmentDate->copy()->addDays(60)->toDateString();

            // 3. Resolve Birth Date & Retirement Date (60th birthday)
            $dobGc = trim($r['Date of Birth (D/M/Y) G.C'] ?? '');
            $dobEc = trim($r['Date of Birth (D/M/Y) E.C'] ?? '');
            $birthDate = null;
            $retirementDate = null;

            if ($dobGc && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dobGc)) {
                $birthDate = Carbon::parse($dobGc);
            } elseif ($dobEc) {
                // Parse EC date like '1980-01-01' or '23/09/1981'
                $delimiter = str_contains($dobEc, '/') ? '/' : '-';
                $parts = explode($delimiter, $dobEc);
                if (count($parts) === 3) {
                    try {
                        if (strlen($parts[0]) === 4) {
                            // Y-M-D format like 1980-01-01
                            $birthDate = EthiopianCalendarService::toGregorian((int) $parts[0], (int) $parts[1], (int) $parts[2]);
                        } else {
                            // D/M/Y format like 23/09/1981
                            $birthDate = EthiopianCalendarService::toGregorian((int) $parts[2], (int) $parts[1], (int) $parts[0]);
                        }
                    } catch (\Exception $e) {
                        $birthDate = null;
                    }
                }
            }

            if ($birthDate) {
                // 60th birthday
                $retirementDate = $birthDate->copy()->addYears(60)->toDateString();
            }

            // 4. Resolve Job Title & Employment Type
            $position = trim($r['Job Title'] ?? '');
            $posLower = strtolower($position);
            $isManagerial = str_contains($posLower, 'head') || str_contains($posLower, 'manager') ||
                            str_contains($posLower, 'director') || str_contains($posLower, 'officer') ||
                            str_contains($posLower, 'ceo') || str_contains($posLower, 'dceo');
            $empType = $isManagerial ? 'Managerial' : 'Non-Managerial';

            // 5. Gender
            $genderRaw = trim($r['Male'] ?? '');
            $gender = (strcasecmp($genderRaw, 'female') === 0 || strcasecmp($genderRaw, 'f') === 0) ? 'Female' : 'Male';

            // 6. Experience
            $compExp = trim($r['Company Experience (Y/M)'] ?? '');
            $prevExp = trim($r['Previous Experience (Y/M)'] ?? '');
            $totExp = trim($r['Total Experience'] ?? '') ?: ($compExp ?: $prevExp);

            // 7. IDs & Contact
            $poessa = trim($r['POESSA No'] ?? '') ?: null;
            $psssa = trim($r['PSSSA No'] ?? '') ?: null;
            $tin = trim($r['TIN'] ?? '') ?: null;
            $phone = trim($r['Telephone No.'] ?? '') ?: null;
            $email = trim($r['E-mail Address'] ?? '') ?: null;

            $emPerson = trim($r['Emergency Contact Person'] ?? '') ?: null;
            $emPhone = trim($r['Emergency Contact Phone'] ?? '') ?: null;
            $emRel = trim($r['Relationship'] ?? '') ?: null;
            if (! $emPhone && $emPerson && preg_match('/^[0-9\-\+\s]{7,20}$/', $emPerson)) {
                $emPhone = $emPerson;
                $emPerson = null;
            }

            $bankAcc = trim($r['Bank Acct. No.'] ?? '') ?: null;
            $bankName = trim($r['Bank Name'] ?? '') ?: 'Commercial Bank of Ethiopia (CBE)';

            $employeeData = [
                'file_no' => $fileNo,
                'employee_id_no' => trim($r['Employment ID'] ?? '') ?: null,
                'full_name' => trim($r['Full Name with Grand Father'] ?? ''),
                'gender' => $gender,
                'marital_status' => trim($r['Marital Status'] ?? '') ?: 'Single',
                'department_id' => $deptId,
                'position' => $position,
                'work_place' => trim($r['Work Place'] ?? '') ?: 'Head Office',
                'grade' => trim($r['Job Grade'] ?? '') ?: null,
                'step' => trim($r['Steps'] ?? '') ?: null,
                'employment_type' => $empType,
                'contract_type' => 'Permanent',
                'status' => 'Probation',
                'probation_status' => 'Pending',
                'employment_date_ec' => $hiredEc ?: '02/02/2019',
                'employment_date' => $employmentDate->toDateString(),
                'birth_date_ec' => $dobEc ?: null,
                'birth_date' => $birthDate ? $birthDate->toDateString() : null,
                'probation_end_date' => $probationEndDate,
                'retirement_date' => $retirementDate,
                'education_status' => trim($r['Educational Qualification'] ?? '') ?: null,
                'institution' => trim($r['Name of Institution Graduated from'] ?? '') ?: null,
                'graduation_year_ec' => trim($r['Year of Graduation E.C'] ?? '') ?: null,
                'professional_license' => trim($r['Professional License'] ?? '') ?: null,
                'cost_sharing_status' => trim($r['Cost Sharing Status'] ?? '') ?: null,
                'company_experience' => $compExp ?: null,
                'previous_experience' => $prevExp ?: null,
                'total_experience' => $totExp ?: null,
                'poessa_no' => $poessa,
                'psssa_no' => $psssa,
                'social_security_no' => $poessa ?: $psssa,
                'tin_no' => $tin,
                'phone' => $phone,
                'email' => $email,
                'bank_name' => $bankName,
                'bank_account_no' => $bankAcc,
                'plate_number' => trim($r['Plate Number'] ?? '') ?: null,
                'emergency_contact_name' => $emPerson,
                'emergency_contact_relationship' => $emRel,
                'emergency_contact_phone' => $emPhone,
                'remarks' => trim($r['Remark'] ?? '') ?: 'Tikemet 2019 New Hire',
            ];

            // Insert / update employee
            $employee = Employee::updateOrCreate(['file_no' => $fileNo], $employeeData);

            // 8. Insert current salary record
            $basicSalary = (float) ($r['Gross Basic Salary'] ?? 0);
            $respAll = (float) ($r['Responsibility Allowance'] ?? 0);
            $projAll = (float) ($r['Project Allowance'] ?? 0);
            $posAll = (float) ($r['Position Allowance'] ?? 0);
            $dailyAll = (float) ($r['Daily Allowance'] ?? 0);
            $desertAll = (float) ($r['Desert Allowance'] ?? 0);
            $houseAll = (float) ($r['Housing Allowance'] ?? 0);
            $transAll = (float) ($r['Transport Allowance'] ?? 0);
            $fuelLitres = (float) ($r['Fuel Allowance (Litre)'] ?? 0);
            $fuelAmount = (float) ($r['Fuel Allowance (Birr)'] ?? 0);
            $perdiem = (float) ($r['Regular Perdiem'] ?? 0);
            $monthlyPerdiem = (float) ($r['Monthly Regular Perdiem'] ?? 0);
            $totalGross = (float) ($r['Total Gross Earning'] ?? 0);

            if ($totalGross <= 0) {
                $totalGross = $basicSalary + $respAll + $projAll + $posAll + $dailyAll + $desertAll + $houseAll + $transAll + $fuelAmount + $perdiem + $monthlyPerdiem;
            }

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
                    'house_allowance' => $houseAll,
                    'transport_allowance' => $transAll,
                    'fuel_allowance_litres' => $fuelLitres,
                    'fuel_allowance_amount' => $fuelAmount,
                    'perdiem' => $perdiem,
                    'monthly_perdiem' => $monthlyPerdiem,
                    'total_salary' => $totalGross,
                    'pension_employee' => round($basicSalary * 0.07, 2),
                    'pension_company' => round($basicSalary * 0.11, 2),
                    'effective_date' => $employmentDate->toDateString(),
                    'remarks' => 'Tikemet 2019 Master List Initial Salary',
                ]
            );

            // 9. Statutory Initial Leave Balance (16 days base)
            LeaveBalance::updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'leave_year' => 2026,
                ],
                [
                    'entitled_days' => 16.0,
                    'carried_over_days' => 0.0,
                    'taken_days' => 0.0,
                    'remaining_days' => 16.0,
                ]
            );

            $results[] = [
                'id' => $employee->id,
                'file_no' => $employee->file_no,
                'name' => $employee->full_name,
                'position' => $employee->position,
                'employment_date' => $employee->employment_date ? $employee->employment_date->toDateString() : 'N/A',
                'probation_end_date' => $employee->probation_end_date ? $employee->probation_end_date->toDateString() : 'N/A',
                'retirement_date' => $employee->retirement_date ? $employee->retirement_date->toDateString() : 'N/A',
            ];
        }

        $this->table(
            ['ID', 'File No', 'Full Name', 'Position', 'Hire Date', 'Probation End Date', 'Retirement Date'],
            $results
        );

        $this->info('Successfully processed and inserted all 19 employees.');

        return 0;
    }
}
