<?php

use App\Models\ChatChannelMetadata;
use App\Models\Department;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Musonza\Chat\Models\Conversation;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Rename department GSFAD to FFAM
        $dept = Department::where('name', 'GSFAD')->first();
        if ($dept) {
            $dept->name = 'FFAM';
            if ($dept->code === 'GSFAD') {
                $dept->code = 'FFAM';
            }
            $dept->save();
        } else {
            DB::table('departments')->where('name', 'GSFAD')->update(['name' => 'FFAM']);
        }

        // 2. Update Chat Channel Metadata (slug, name, description)
        ChatChannelMetadata::where('slug', 'gsfad')
            ->orWhere('name', 'GSFAD')
            ->update([
                'slug' => 'ffam',
                'name' => 'FFAM',
                'description' => 'Official workspace and file-sharing channel for FFAM department staff.',
            ]);

        // 3. Update Conversation name if exists
        Conversation::where('name', 'GSFAD Team')
            ->update(['name' => 'FFAM Team']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Revert department name
        $dept = Department::where('name', 'FFAM')->first();
        if ($dept) {
            $dept->name = 'GSFAD';
            if ($dept->code === 'FFAM') {
                $dept->code = 'GSFAD';
            }
            $dept->save();
        } else {
            DB::table('departments')->where('name', 'FFAM')->update(['name' => 'GSFAD']);
        }

        // 2. Revert Chat Channel Metadata
        ChatChannelMetadata::where('slug', 'ffam')
            ->orWhere('name', 'FFAM')
            ->update([
                'slug' => 'gsfad',
                'name' => 'GSFAD',
                'description' => 'Official workspace and file-sharing channel for GSFAD department staff.',
            ]);

        // 3. Revert Conversation name
        Conversation::where('name', 'FFAM Team')
            ->update(['name' => 'GSFAD Team']);
    }
};
