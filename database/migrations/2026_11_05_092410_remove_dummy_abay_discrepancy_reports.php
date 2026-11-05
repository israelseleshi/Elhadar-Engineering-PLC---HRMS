<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Remove dummy/self-test data correction requests submitted during pre-production testing.
     * Scoped to Abay Sewmehon Demena (file A-001 context) and the exact test values.
     */
    public function up(): void
    {
        DB::table('data_correction_reports')
            ->whereIn('id', function ($q) {
                $q->select('d.id')
                    ->from('data_correction_reports as d')
                    ->join('employees as e', 'e.id', '=', 'd.employee_id')
                    ->where('e.full_name', 'like', '%Abay Sewmehon Demena%')
                    ->where(function ($w) {
                        $w->where(function ($w) {
                            $w->where('d.field_name', 'like', '%Commercial Bank Account%')
                                ->where('d.current_value', '10000347829357823')
                                ->where('d.proposed_value', '1000309137756');
                        })->orWhere(function ($w) {
                            $w->where('d.field_name', 'like', '%Education%')
                                ->where('d.current_value', 'like', '%BSc in Computer Science%')
                                ->where('d.proposed_value', 'like', '%BSc in Information Systems%');
                        });
                    });
            })
            ->delete();
    }

    public function down(): void
    {
        // Irreversible: dummy test data intentionally removed.
    }
};
