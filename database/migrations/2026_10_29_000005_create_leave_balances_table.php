<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->unsignedSmallInteger('leave_year')->index()->comment('e.g. 2025 or 2017 E.C.');
            $table->decimal('entitled_days', 5, 1)->default(16.0)->comment('16 base + 1 per 2 service years');
            $table->decimal('carried_over_days', 5, 1)->default(0.0);
            $table->decimal('taken_days', 5, 1)->default(0.0);
            $table->decimal('remaining_days', 5, 1)->default(16.0);
            $table->timestamps();

            $table->unique(['employee_id', 'leave_year'], 'emp_leave_year_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_balances');
    }
};
