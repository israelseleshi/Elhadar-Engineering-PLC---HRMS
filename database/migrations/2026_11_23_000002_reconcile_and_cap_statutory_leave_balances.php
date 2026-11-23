<?php

use App\Models\LeaveBalance;
use App\Services\AnnualLeaveCalculationService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * 1. Adds unused_leave_days and leave_payout_amount to separations table (Art. 80(2)).
     * 2. Reconciles existing leave balances by capping multi-year accumulation per
     *    statutory 2-year carryover limit (Art. 78(5)) and standardizing to half-day precision.
     */
    public function up(): void
    {
        if (Schema::hasTable('separations')) {
            Schema::table('separations', function (Blueprint $table) {
                if (! Schema::hasColumn('separations', 'unused_leave_days')) {
                    $table->decimal('unused_leave_days', 5, 1)->default(0.0)->after('completed_years_service');
                }
                if (! Schema::hasColumn('separations', 'leave_payout_amount')) {
                    $table->decimal('leave_payout_amount', 12, 2)->default(0.00)->after('unused_leave_days');
                }
            });
        }

        /** @var AnnualLeaveCalculationService $service */
        $service = app(AnnualLeaveCalculationService::class);
        $balances = LeaveBalance::with('employee')->get();

        foreach ($balances as $balance) {
            $employee = $balance->employee;
            if (! $employee) {
                continue;
            }

            // Normalize taken days to half-day precision
            $taken = max(0.0, round((float) $balance->taken_days * 2) / 2);

            $statutoryAnnual = $service->calculateAnnualEntitlement($employee, false);
            $maxCarryover = $service->getMaximumAllowedCarryover($employee);

            $currentEntitled = (float) $balance->entitled_days;
            $currentCarried = (float) $balance->carried_over_days;

            if ($currentEntitled > $statutoryAnnual) {
                // Legacy imported record holds multi-year lifetime total in entitled_days
                $excessDays = $currentEntitled - $statutoryAnnual;
                // Enforce statutory 2-year postponement cap per Art. 78(5)
                $newCarried = min($maxCarryover, $currentCarried + $excessDays);
                $newCarried = round($newCarried * 2) / 2;
                $newEntitled = $statutoryAnnual;
            } else {
                $newEntitled = round($currentEntitled * 2) / 2;
                $newCarried = min($maxCarryover, round($currentCarried * 2) / 2);
            }

            $newRemaining = max(0.0, ($newEntitled + $newCarried) - $taken);
            $newRemaining = round($newRemaining * 2) / 2;

            $balance->update([
                'entitled_days' => $newEntitled,
                'carried_over_days' => $newCarried,
                'taken_days' => $taken,
                'remaining_days' => $newRemaining,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('separations')) {
            Schema::table('separations', function (Blueprint $table) {
                if (Schema::hasColumn('separations', 'leave_payout_amount')) {
                    $table->dropColumn('leave_payout_amount');
                }
                if (Schema::hasColumn('separations', 'unused_leave_days')) {
                    $table->dropColumn('unused_leave_days');
                }
            });
        }
    }
};
