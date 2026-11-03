<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_salaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();

            // Salary Structure Breakdown (ETB)
            $table->decimal('basic_salary', 12, 2)->default(0.00);
            $table->decimal('responsibility_allowance', 12, 2)->default(0.00);
            $table->decimal('project_allowance', 12, 2)->default(0.00);
            $table->decimal('position_allowance', 12, 2)->default(0.00);
            $table->decimal('hardship_allowance', 12, 2)->default(0.00);
            $table->decimal('transport_allowance', 12, 2)->default(0.00);
            $table->decimal('house_allowance', 12, 2)->default(0.00);
            $table->decimal('food_allowance', 12, 2)->default(0.00);
            $table->decimal('mobile_allowance', 12, 2)->default(0.00);
            $table->decimal('other_allowance', 12, 2)->default(0.00);
            $table->decimal('ot_compensation', 12, 2)->default(0.00);
            $table->decimal('perdiem', 12, 2)->default(0.00);

            // Calculated Totals & Statutory Deductions
            $table->decimal('total_salary', 12, 2)->default(0.00)->comment('Gross compensation sum');
            $table->decimal('taxable_salary', 12, 2)->default(0.00);
            $table->decimal('income_tax', 12, 2)->default(0.00);
            $table->decimal('pension_employee', 12, 2)->default(0.00)->comment('7% statutory');
            $table->decimal('pension_company', 12, 2)->default(0.00)->comment('11% employer');
            $table->decimal('total_deductions', 12, 2)->default(0.00);
            $table->decimal('net_salary', 12, 2)->nullable();

            $table->date('effective_date')->index();
            $table->boolean('is_current')->default(true)->index();
            $table->string('remarks', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_salaries');
    }
};
