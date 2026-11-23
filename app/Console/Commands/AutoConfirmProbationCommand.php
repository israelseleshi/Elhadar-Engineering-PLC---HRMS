<?php

namespace App\Console\Commands;

use App\Models\Employee;
use App\Services\ProbationCalculationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class AutoConfirmProbationCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hrms:auto-confirm-probation {--dry-run : Inspect overdue candidates without applying database changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically confirm probationary employees whose evaluation period has expired per Ethiopian Labour Proclamation 1156/2019 (Art. 11)';

    /**
     * Execute the console command.
     */
    public function handle(ProbationCalculationService $probationService): int
    {
        $today = Carbon::today()->toDateString();

        if ($this->option('dry-run')) {
            $candidates = Employee::where('status', 'Probation')
                ->where('probation_status', '!=', 'Failed')
                ->whereNotNull('probation_end_date')
                ->where('probation_end_date', '<=', $today)
                ->with('department')
                ->get();

            if ($candidates->isEmpty()) {
                $this->info("Dry-run: No expired probationary candidates found as of {$today}.");

                return self::SUCCESS;
            }

            $this->warn("Dry-run: Found {$candidates->count()} employee(s) eligible for statutory automatic confirmation:");
            $this->table(
                ['File No', 'Full Name', 'Department', 'Employment Date', 'Probation End Date'],
                $candidates->map(fn ($e) => [
                    $e->file_no,
                    $e->full_name,
                    $e->department?->name ?? 'General',
                    $e->employment_date ? Carbon::parse($e->employment_date)->toDateString() : 'N/A',
                    $e->probation_end_date ? Carbon::parse($e->probation_end_date)->toDateString() : 'N/A',
                ])
            );

            return self::SUCCESS;
        }

        $confirmed = $probationService->autoConfirmExpiredProbations();

        if ($confirmed->isEmpty()) {
            $this->info("No expired probationary candidates found. All records are up to date as of {$today}.");

            return self::SUCCESS;
        }

        $this->info("Successfully auto-confirmed {$confirmed->count()} employee(s) to Permanent status per Proclamation 1156/2019 (Art. 11):");
        $this->table(
            ['File No', 'Full Name', 'Probation End Date', 'Permanent Status Date', 'Status'],
            $confirmed->map(fn ($e) => [
                $e->file_no,
                $e->full_name,
                $e->probation_end_date ? Carbon::parse($e->probation_end_date)->toDateString() : 'N/A',
                $e->permanent_status_date ? Carbon::parse($e->permanent_status_date)->toDateString() : 'N/A',
                $e->status,
            ])
        );

        return self::SUCCESS;
    }
}
