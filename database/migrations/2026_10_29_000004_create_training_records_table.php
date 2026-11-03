<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('training_name', 255);
            $table->string('institution', 255)->nullable();
            $table->enum('provider_type', ['Internal', 'External'])->default('External');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('certificate_number', 100)->nullable();
            $table->string('certificate_path', 255)->nullable()->comment('Storage path for certificate');
            $table->unsignedTinyInteger('performance_impact_score')->default(3)->comment('Scale 1-5');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_records');
    }
};
