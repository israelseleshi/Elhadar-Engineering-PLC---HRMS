<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Musonza\Chat\Models\Conversation;
use Musonza\Chat\Models\Message;

class ChatAttachment extends Model
{
    use HasFactory;

    protected $table = 'chat_attachments';

    protected $fillable = [
        'message_id',
        'conversation_id',
        'uploaded_by',
        'file_path',
        'file_name',
        'file_size',
        'mime_type',
        'category',
        'thumbnail_path',
        'metadata',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'metadata' => 'array',
    ];

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'message_id');
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
