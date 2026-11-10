<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Musonza\Chat\Models\Conversation;

class ChatChannelMetadata extends Model
{
    use HasFactory;

    protected $table = 'chat_channel_metadata';

    protected $fillable = [
        'conversation_id',
        'department_id',
        'slug',
        'name',
        'description',
        'is_read_only',
    ];

    protected $casts = [
        'is_read_only' => 'boolean',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}
