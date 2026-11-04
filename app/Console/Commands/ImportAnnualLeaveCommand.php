<?php

namespace App\Console\Commands;

use App\Models\Employee;
use App\Models\LeaveBalance;
use Illuminate\Console\Command;

class ImportAnnualLeaveCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hrms:import-annual-leave {--file= : Path to annual leave JSON file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ingest real historical annual leave balances and deductions from Annual Leave JSON dataset';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $filePath = $this->option('file');

        if (! $filePath) {
            $candidates = [
                database_path('data/annual_leave.json'),
                public_path('Annual Leave.json'),
                public_path('Annual Leave .json'),
                base_path('Annual Leave.json'),
            ];

            foreach ($candidates as $candidate) {
                if (file_exists($candidate)) {
                    $filePath = $candidate;
                    break;
                }
            }
        }

        if (! $filePath || ! file_exists($filePath)) {
            $this->warn('Annual Leave JSON file not found in candidates. Skipping safely.');

            return self::SUCCESS;
        }

        $raw = file_get_contents($filePath);
        $data = json_decode($raw, true);

        if (! $data || ! isset($data['sheets'])) {
            $this->error('Failed to parse Annual Leave JSON structure.');

            return self::SUCCESS;
        }

        $sheets = ['ENG', 'Terminated'];
        $year = (int) date('Y');

        $processed = 0;
        $matched = 0;
        $unmatched = 0;

        foreach ($sheets as $sheetName) {
            $records = $data['sheets'][$sheetName]['records'] ?? [];
            $this->line("Processing {$sheetName} (".count($records).' records)...');

            foreach ($records as $row) {
                $name = trim((string) ($row['Name of Employee'] ?? ''));
                $fileNo = trim((string) ($row['F.No'] ?? ''));

                if (! $name && ! $fileNo) {
                    continue;
                }

                $processed++;

                // 1. Match employee
                $employee = null;
                if ($fileNo) {
                    $employee = Employee::where('file_no', $fileNo)->first();
                }

                if (! $employee && $name) {
                    $employee = Employee::where('full_name', $name)->first();
                }

                if (! $employee && $name) {
                    // Try case-insensitive like match
                    $employee = Employee::where('full_name', 'like', "%{$name}%")->first();
                }

                if (! $employee) {
                    $unmatched++;

                    continue;
                }

                $matched++;

                $accumulated = (float) ($row['Accomulated Annual Leave'] ?? 0);
                $taken = (float) ($row['Total Annual leave taken'] ?? 0);
                $balance = (float) ($row['Balance'] ?? ($accumulated - $taken));

                LeaveBalance::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'leave_year' => $year,
                    ],
                    [
                        'entitled_days' => $accumulated,
                        'taken_days' => $taken,
                        'remaining_days' => $balance,
                        'carried_over_days' => 0.0,
                    ]
                );
            }
        }

        $this->newLine();
        $this->info('=== Annual Leave Ingestion Complete ===');
        $this->info("Total Records Processed: {$processed}");
        $this->info("Matched & Updated Balances: {$matched}");
        $this->info("Unmatched Records: {$unmatched}");

        return self::SUCCESS;
    }
}
