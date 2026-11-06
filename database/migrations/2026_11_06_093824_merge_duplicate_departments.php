<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Ensure target 'IT' department exists
        $it = DB::table('departments')->where('name', 'IT')->first();
        if (! $it) {
            $itId = DB::table('departments')->insertGetId([
                'name' => 'IT',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $it = (object) ['id' => $itId, 'name' => 'IT'];
        }

        // 2. Merge 'ICT' into 'IT'
        $ict = DB::table('departments')->where('name', 'ICT')->first();
        if ($ict && $it) {
            DB::table('employees')
                ->where('department_id', $ict->id)
                ->update(['department_id' => $it->id]);

            DB::table('departments')
                ->where('id', $ict->id)
                ->delete();
        }

        // 3. Ensure 'Construction & Engineering' has exact name with space after '&'
        $ce = DB::table('departments')
            ->where('name', 'like', 'Construction%Engineering%')
            ->where('name', 'not like', '%Acceptance%')
            ->first();

        if ($ce) {
            DB::table('departments')
                ->where('id', $ce->id)
                ->update(['name' => 'Construction & Engineering']);
        } else {
            $ceId = DB::table('departments')->insertGetId([
                'name' => 'Construction & Engineering',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $ce = (object) ['id' => $ceId, 'name' => 'Construction & Engineering'];
        }

        // 4. Merge 'Construction & Engineering Acceptance of Offer' into 'Construction & Engineering'
        $ceAcceptance = DB::table('departments')
            ->where('name', 'like', '%Acceptance%')
            ->first();

        if ($ceAcceptance && $ce) {
            DB::table('employees')
                ->where('department_id', $ceAcceptance->id)
                ->update(['department_id' => $ce->id]);

            DB::table('departments')
                ->where('id', $ceAcceptance->id)
                ->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // irreversible data consolidation
    }
};
