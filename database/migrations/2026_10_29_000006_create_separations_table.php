<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('separations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->unique()->constrained('employees')->restrictOnDelete();
            $table->enum('separation_type', [
                'Resignation',
                'Termination_With_Cause',
                'Termination_Without_Cause',
                'Layoff',
                'Retirement',
                'Probation_Failed',
                'Contract_Expired',
            ])->index();
            $table->date('effective_date')->index();
            $table->text('reason')->nullable();
            $table->decimal('basic_salary_at_separation', 12, 2);
            $table->decimal('completed_years_service', 5, 2);
            $table->decimal('severance_amount', 12, 2)->default(0.00)->comment('Calculated per Proclamation 1156/2019');
            $table->boolean('severance_paid')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('separations');
    }
};
