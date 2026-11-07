<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('leave_type', 60);
            $table->date('start_date');
            $table->string('start_date_ec', 30);
            $table->date('end_date');
            $table->string('end_date_ec', 30);
            $table->decimal('requested_days', 4, 1);
            $table->text('reason');
            $table->foreignId('handover_employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->string('contact_phone', 50)->nullable();
            $table->string('attachment_path', 255)->nullable();
            $table->string('status', 30)->default('Pending');
            $table->boolean('is_deducted')->default(true);
            $table->decimal('days_deducted', 4, 1)->default(0.0);
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('reviewer_notes')->nullable();
            $table->timestamps();

            $table->index(['employee_id', 'status']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
