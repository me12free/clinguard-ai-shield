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

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function allowlists(): HasMany
    {
        return $this->hasMany(Allowlist::class);
    }

    public function detectionRules(): HasMany
    {
        return $this->hasMany(DetectionRule::class);
    }
}
