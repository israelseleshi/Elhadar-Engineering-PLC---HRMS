<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('promotion_date_ec', 20)->comment('Ethiopian Calendar date of promotion');
            $table->date('promotion_date')->index();

            // Prior Position & Compensation
            $table->string('previous_position', 150);
            $table->string('previous_grade', 20)->nullable();
            $table->decimal('previous_basic_salary', 12, 2);
            $table->decimal('previous_total_salary', 12, 2);

            // New Position & Compensation
            $table->string('new_position', 150);
            $table->string('new_grade', 20)->nullable();
            $table->decimal('new_basic_salary', 12, 2);
            $table->decimal('new_total_salary', 12, 2);

            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};
