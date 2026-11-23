<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Services\AnnualLeaveCalculationService;
use Illuminate\Console\Command;

class RolloverAnnualLeaveCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hrms:rollover-annual-leave {--dry-run : Inspect rollover without modifying database records} {--year= : The target leave cycle year (default: current year)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Execute statutory annual leave rollover: carry over unconsumed leave (capped per Art. 78(5)) and calculate new annual entitlements';

    /**
     * Execute the console command.
     */
    public function handle(AnnualLeaveCalculationService $leaveService): int
    {
        $targetYear = (int) ($this->option('year') ?: date('Y'));
        $previousYear = $targetYear - 1;
        $isDryRun = (bool) $this->option('dry-run');

        $activeEmployees = Employee::active()->with(['department', 'leaveBalances'])->get();

        if ($activeEmployees->isEmpty()) {
            $this->info('No active employees found to process for leave rollover.');

            return self::SUCCESS;
        }

        $this->info("=== Initiating Annual Leave Rollover for Cycle {$targetYear} (Previous: {$previousYear}) ===");
        if ($isDryRun) {
            $this->warn('DRY RUN MODE: No database records will be modified.');
        }

        $summary = [];

        foreach ($activeEmployees as $employee) {
            $prevBalance = $employee->leaveBalances->firstWhere('leave_year', $previousYear);

            // Compute new statutory entitlement for the new year
            $newEntitlement = $leaveService->calculateAnnualEntitlement($employee, false);
            $maxCarryover = $leaveService->getMaximumAllowedCarryover($employee);

            // Carry over remaining days from previous cycle (capped at statutory 2-year postponement maximum)
            $unconsumedDays = $prevBalance ? max(0.0, (float) $prevBalance->remaining_days) : 0.0;
            $carryOver = min($unconsumedDays, $maxCarryover);
            $carryOver = round($carryOver * 2) / 2; // Normalize to half-day

            $totalAvailable = $newEntitlement + $carryOver;

            $summary[] = [
                'File No' => $employee->file_no,
                'Full Name' => $employee->full_name,
                'Previous Year Rem.' => $unconsumedDays,
                'Capped Carryover' => $carryOver,
                'New Entitlement' => $newEntitlement,
                'Total Available' => $totalAvailable,
            ];

            if (! $isDryRun) {
                $oldRecord = $employee->leaveBalances->firstWhere('leave_year', $targetYear);
                $oldValues = $oldRecord ? $oldRecord->toArray() : [];

                $balance = LeaveBalance::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'leave_year' => $targetYear,
                    ],
                    [
                        'entitled_days' => $newEntitlement,
                        'carried_over_days' => $carryOver,
                        'taken_days' => 0.0,
                        'remaining_days' => $totalAvailable,
                    ]
                );

                AuditLog::create([
                    'user_id' => auth()->id() ?? null,
                    'action' => 'LEAVE_ANNUAL_ROLLOVER',
                    'auditable_type' => LeaveBalance::class,
                    'auditable_id' => $balance->id,
                    'old_values' => $oldValues,
                    'new_values' => $balance->fresh()->toArray(),
                    'ip_address' => request()?->ip() ?? '127.0.0.1',
                    'user_agent' => request()?->userAgent() ?? 'CLI / HRMS Rollover Scheduler',
                ]);
            }
        }

        $this->table(
            ['File No', 'Full Name', 'Previous Year Rem.', 'Capped Carryover', 'New Entitlement', 'Total Available'],
            array_slice($summary, 0, 15)
        );

        if (count($summary) > 15) {
            $this->line('... and '.(count($summary) - 15).' more active employees processed.');
        }

        $this->info("Completed leave rollover for {$activeEmployees->count()} active employee(s).");

        return self::SUCCESS;
    }
}
