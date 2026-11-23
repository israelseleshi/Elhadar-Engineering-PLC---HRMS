<?php

use App\Services\ProbationCalculationService;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Automatically transitions any probationary personnel whose evaluation period
     * has elapsed without prior termination to Permanent status, per Art. 11 of
     * Ethiopian Labour Proclamation 1156/2019.
     */
    public function up(): void
    {
        /** @var ProbationCalculationService $service */
        $service = app(ProbationCalculationService::class);
        $service->autoConfirmExpiredProbations();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // One-way statutory transition; no rollback intended.
    }
};
