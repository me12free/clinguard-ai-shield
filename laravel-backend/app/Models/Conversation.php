<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Conversation extends Model
{
    protected $fillable = ['user_id', 'prompt_redacted', 'response_summary'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
