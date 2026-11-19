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
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->foreignId('assigned_to_user_id')
                ->nullable()
                ->after('handover_employee_id')
                ->constrained('users')
                ->nullOnDelete();

            $table->index(['assigned_to_user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropForeign(['assigned_to_user_id']);
            $table->dropIndex(['assigned_to_user_id', 'status']);
            $table->dropColumn('assigned_to_user_id');
        });
    }
};
