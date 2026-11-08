<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->enum('priority', ['standard', 'important', 'critical'])->default('standard')->after('is_active');
            $table->enum('category', ['general', 'policy', 'safety', 'payroll', 'holiday', 'event'])->default('general')->after('priority');
            $table->enum('target_type', ['all', 'departments', 'work_places', 'roles', 'contract_types', 'custom'])->default('all')->after('category');
            $table->json('target_department_ids')->nullable()->after('target_type');
            $table->json('target_work_places')->nullable()->after('target_department_ids');
            $table->json('target_roles')->nullable()->after('target_work_places');
            $table->json('target_contract_types')->nullable()->after('target_roles');
            $table->json('target_user_ids')->nullable()->after('target_contract_types');
            $table->string('title_am', 255)->nullable()->after('title');
            $table->text('content_am')->nullable()->after('content');
            $table->string('attachment_path', 2048)->nullable()->after('content_am');
            $table->string('attachment_name', 255)->nullable()->after('attachment_path');
            $table->boolean('requires_acknowledgment')->default(false)->after('attachment_name');
            $table->boolean('allow_reactions')->default(true)->after('requires_acknowledgment');
            $table->boolean('send_sms')->default(false)->after('allow_reactions');
            $table->enum('status', ['draft', 'scheduled', 'published', 'archived'])->default('published')->after('send_sms');

            $table->index(['priority', 'category']);
            $table->index('status');
        });

        Schema::create('announcement_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')->constrained('announcements')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('read_at')->useCurrent();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->unique(['announcement_id', 'user_id']);
            $table->index('user_id');
        });

        Schema::create('announcement_acknowledgments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')->constrained('announcements')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('acknowledged_at')->useCurrent();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->unique(['announcement_id', 'user_id']);
            $table->index('user_id');
        });

        Schema::create('announcement_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')->constrained('announcements')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('reaction', ['clap', 'party', 'heart', 'thumbs_up', 'verified']);
            $table->timestamps();

            $table->unique(['announcement_id', 'user_id']);
            $table->index('reaction');
        });

        Schema::create('user_push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('endpoint');
            $table->string('public_key', 255)->nullable();
            $table->string('auth_token', 255)->nullable();
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_push_subscriptions');
        Schema::dropIfExists('announcement_reactions');
        Schema::dropIfExists('announcement_acknowledgments');
        Schema::dropIfExists('announcement_reads');

        Schema::table('announcements', function (Blueprint $table) {
            $table->dropIndex(['priority', 'category']);
            $table->dropIndex(['status']);
            $table->dropColumn([
                'priority',
                'category',
                'target_type',
                'target_department_ids',
                'target_work_places',
                'target_roles',
                'target_contract_types',
                'target_user_ids',
                'title_am',
                'content_am',
                'attachment_path',
                'attachment_name',
                'requires_acknowledgment',
                'allow_reactions',
                'send_sms',
                'status',
            ]);
        });
    }
};
