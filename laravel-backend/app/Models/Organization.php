<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    protected $fillable = [
        'name',
        'registration_number',
        'subscription_tier',
        'configuration',
    ];

    protected $casts = [
        'configuration' => 'array',
    ];

    public function policies(): HasMany
    {
        return $this->hasMany(Policy::class);
    }
}
