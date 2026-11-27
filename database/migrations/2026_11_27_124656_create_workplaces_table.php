<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('workplaces', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('code', 20)->nullable()->unique();
            $table->string('type', 30)->default('Project');
            $table->string('location', 150)->nullable();
            $table->string('description', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        if (Schema::hasTable('employees')) {
            $existingWorkplaces = DB::table('employees')
                ->whereNotNull('work_place')
                ->where('work_place', '!=', '')
                ->distinct()
                ->orderBy('work_place')
                ->pluck('work_place');

            $now = now();
            foreach ($existingWorkplaces as $rawName) {
                $name = trim((string) $rawName);
                if ($name === '') {
                    continue;
                }

                $lower = strtolower($name);
                $isHeadOffice = in_array($lower, ['h.o', 'head office', 'ho'], true);

                DB::table('workplaces')->insertOrIgnore([
                    'name' => $name,
                    'type' => $isHeadOffice ? 'Head Office' : 'Project',
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workplaces');
    }
};
