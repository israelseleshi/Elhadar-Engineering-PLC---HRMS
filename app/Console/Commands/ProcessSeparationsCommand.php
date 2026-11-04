<?php

namespace App\Console\Commands;

use App\Models\Employee;
use App\Models\Separation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ProcessSeparationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hrms:process-separations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process overdue separations for M-058 and W-011 per Tikemet 2019 Master List';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $separationsData = [
            [
                'file_no' => 'M-058',
                'name' => 'Michael Fikru Kebede',
                'effective_date' => '2026-09-23',
                'termination_date_ec' => '13/01/2019',
                'reason' => 'Resign',
                'basic_salary' => 33419.00,
            ],
            [
                'file_no' => 'W-011',
                'name' => 'Wondwossen Getnet',
                'effective_date' => '2026-10-23',
                'termination_date_ec' => '13/02/2019',
                'reason' => 'Resign',
                'basic_salary' => 30244.00,
            ],
        ];

        foreach ($separationsData as $data) {
            $employee = Employee::where('file_no', $data['file_no'])->first();

            if (! $employee) {
                $this->warn("Employee with File No {$data['file_no']} not found.");

                continue;
            }

            // Calculate completed years of service
            $hiredDate = $employee->employment_date ? Carbon::parse($employee->employment_date) : Carbon::parse($data['effective_date']);
            $termDate = Carbon::parse($data['effective_date']);
            $completedYears = round(max(0, $hiredDate->diffInDays($termDate) / 365.25), 2);

            // Update Employee Status
            $employee->update([
                'status' => 'Separated',
                'remarks' => $data['reason'],
            ]);

            // Deactivate portal user account
            if ($employee->user_id) {
                User::where('id', $employee->user_id)->update(['is_active' => false]);
            }

            // Record Separation
            Separation::updateOrCreate(
                ['employee_id' => $employee->id],
                [
                    'separation_type' => 'Resignation',
                    'effective_date' => $data['effective_date'],
                    'termination_date_ec' => $data['termination_date_ec'],
                    'reason' => $data['reason'],
                    'basic_salary_at_separation' => $data['basic_salary'],
                    'completed_years_service' => $completedYears,
                    'severance_amount' => 0.00,
                    'severance_paid' => false,
                ]
            );

            $this->info("Successfully separated {$employee->full_name} ({$employee->file_no}) effective {$data['effective_date']}.");
        }

        return self::SUCCESS;
    }
}
