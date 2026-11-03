<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            $table->string('file_no', 20)->unique()->comment('Alphanumeric physical file code e.g. A-001');
            $table->string('employee_id_no', 50)->nullable()->unique()->comment('Company corporate employee ID');
            $table->string('full_name', 255);
            $table->enum('gender', ['Male', 'Female']);
            $table->string('education_status', 150)->nullable();
            $table->foreignId('department_id')->constrained('departments')->restrictOnDelete();
            $table->string('position', 150);
            $table->enum('work_place', ['Project', 'Head Office'])->default('Head Office');
            $table->enum('employment_type', ['Non-Managerial', 'Managerial'])->default('Non-Managerial');
            $table->enum('contract_type', ['Permanent', 'Contract', 'Daily'])->default('Permanent');

            // Ethiopian Calendar & Gregorian Dates
            $table->string('employment_date_ec', 20);
            $table->date('employment_date')->index();
            $table->string('birth_date_ec', 20)->nullable();
            $table->date('birth_date')->nullable()->index();

            // Statutory Milestones
            $table->date('probation_end_date')->nullable()->index();
            $table->enum('probation_status', ['Pending', 'Passed', 'Failed', 'Extended'])->default('Pending');
            $table->date('permanent_status_date')->nullable();
            $table->date('contract_end_date')->nullable()->index()->comment('Applicable for Contract emp sheet');
            $table->date('retirement_date')->nullable()->index();
            $table->enum('status', ['Probation', 'Permanent', 'Contract', 'Separated', 'Retired'])->default('Probation')->index();

            // Grading & Social Security
            $table->string('grade', 20)->nullable();
            $table->string('step', 20)->nullable();
            $table->string('social_security_no', 50)->nullable()->index();
            $table->string('marital_status', 30)->nullable();

            // Demographics & Address
            $table->string('phone', 30)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('region', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('sub_city', 100)->nullable()->comment('K/Ketema');
            $table->string('woreda', 50)->nullable();
            $table->string('house_no', 50)->nullable();

            // Emergency Contact & Banking
            $table->string('emergency_contact_name', 150)->nullable();
            $table->string('emergency_contact_phone', 50)->nullable();
            $table->string('tin_no', 30)->nullable()->index();
            $table->string('bank_name', 100)->nullable()->default('Commercial Bank of Ethiopia (CBE)');
            $table->string('bank_account_no', 50)->nullable()->index();
            $table->text('remarks')->nullable();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
