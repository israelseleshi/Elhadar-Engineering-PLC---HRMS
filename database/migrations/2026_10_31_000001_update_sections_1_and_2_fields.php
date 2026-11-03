<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('employees', 'shift')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropColumn('shift');
            });
        }

        if (Schema::hasTable('separations') && ! Schema::hasColumn('separations', 'termination_date_ec')) {
            Schema::table('separations', function (Blueprint $table) {
                $table->string('termination_date_ec', 20)->nullable()->after('effective_date');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('employees') && ! Schema::hasColumn('employees', 'shift')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->string('shift', 50)->nullable()->after('position');
            });
        }

        if (Schema::hasTable('separations') && Schema::hasColumn('separations', 'termination_date_ec')) {
            Schema::table('separations', function (Blueprint $table) {
                $table->dropColumn('termination_date_ec');
            });
        }
    }
};
