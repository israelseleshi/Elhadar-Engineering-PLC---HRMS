<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('work_place', 100)->default('Head Office')->change();
            $table->string('institution', 150)->nullable()->after('education_status');
            $table->string('graduation_year_ec', 10)->nullable()->after('institution');
            $table->string('professional_license', 100)->nullable()->after('graduation_year_ec');
            $table->string('cost_sharing_status', 50)->nullable()->after('professional_license');
            $table->string('shift', 50)->nullable()->after('position');
            $table->string('company_experience', 50)->nullable()->after('work_place');
            $table->string('previous_experience', 50)->nullable()->after('company_experience');
            $table->string('total_experience', 50)->nullable()->after('previous_experience');
            $table->decimal('performance_score_round_1', 3, 2)->nullable()->after('total_experience');
            $table->decimal('performance_score_round_2', 3, 2)->nullable()->after('performance_score_round_1');
            $table->string('disciplinary_action', 255)->nullable()->after('performance_score_round_2');
            $table->string('poessa_no', 50)->nullable()->index()->after('social_security_no');
            $table->string('psssa_no', 50)->nullable()->after('poessa_no');
            $table->string('plate_number', 30)->nullable()->after('bank_account_no');
            $table->string('emergency_contact_relationship', 50)->nullable()->after('emergency_contact_name');
        });

        Schema::table('employee_salaries', function (Blueprint $table) {
            $table->decimal('daily_allowance', 12, 2)->default(0.00)->after('position_allowance');
            $table->decimal('desert_allowance', 12, 2)->default(0.00)->after('daily_allowance');
            $table->decimal('fuel_allowance_litres', 8, 2)->default(0.00)->after('transport_allowance');
            $table->decimal('fuel_allowance_amount', 12, 2)->default(0.00)->after('fuel_allowance_litres');
            $table->decimal('monthly_perdiem', 12, 2)->default(0.00)->after('perdiem');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex(['poessa_no']);
            $table->dropColumn([
                'institution',
                'graduation_year_ec',
                'professional_license',
                'cost_sharing_status',
                'shift',
                'company_experience',
                'previous_experience',
                'total_experience',
                'performance_score_round_1',
                'performance_score_round_2',
                'disciplinary_action',
                'poessa_no',
                'psssa_no',
                'plate_number',
                'emergency_contact_relationship',
            ]);
        });

        Schema::table('employee_salaries', function (Blueprint $table) {
            $table->dropColumn([
                'daily_allowance',
                'desert_allowance',
                'fuel_allowance_litres',
                'fuel_allowance_amount',
                'monthly_perdiem',
            ]);
        });
    }
};
