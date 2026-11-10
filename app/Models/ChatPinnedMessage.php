<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Musonza\Chat\Models\Conversation;
use Musonza\Chat\Models\Message;

class ChatPinnedMessage extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'chat_pinned_messages';

    protected $fillable = [
        'conversation_id',
        'message_id',
        'pinned_by',
        'pinned_at',
    ];

    protected $casts = [
        'pinned_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'message_id');
    }

    public function pinner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pinned_by');
    }
}
