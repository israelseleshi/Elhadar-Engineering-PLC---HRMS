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
        Schema::create('chat_channel_metadata', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('conversation_id');
            $table->unsignedBigInteger('department_id')->nullable();
            $table->string('slug', 150)->unique();
            $table->string('name', 150);
            $table->string('description', 255)->nullable();
            $table->boolean('is_read_only')->default(false);
            $table->timestamps();

            $table->foreign('conversation_id')->references('id')->on('chat_conversations')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
        });

        Schema::create('chat_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('message_id');
            $table->unsignedBigInteger('conversation_id');
            $table->unsignedBigInteger('uploaded_by');
            $table->string('file_path');
            $table->string('file_name');
            $table->unsignedBigInteger('file_size');
            $table->string('mime_type', 120);
            $table->enum('category', ['media', 'document', 'link', 'audio'])->default('document');
            $table->string('thumbnail_path')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('message_id')->references('id')->on('chat_messages')->onDelete('cascade');
            $table->foreign('conversation_id')->references('id')->on('chat_conversations')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');

            $table->index(['conversation_id', 'category']);
        });

        Schema::create('chat_pinned_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('conversation_id');
            $table->unsignedBigInteger('message_id');
            $table->unsignedBigInteger('pinned_by');
            $table->timestamp('pinned_at')->useCurrent();

            $table->foreign('conversation_id')->references('id')->on('chat_conversations')->onDelete('cascade');
            $table->foreign('message_id')->references('id')->on('chat_messages')->onDelete('cascade');
            $table->foreign('pinned_by')->references('id')->on('users')->onDelete('cascade');

            $table->unique(['conversation_id', 'message_id'], 'conv_pinned_msg_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_pinned_messages');
        Schema::dropIfExists('chat_attachments');
        Schema::dropIfExists('chat_channel_metadata');
    }
};
