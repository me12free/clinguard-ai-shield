<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Policy extends Model
{
    protected $fillable = [
        'organization_id',
        'policy_name',
        'phi_categories',
        'enforcement_action',
        'confidence_threshold',
    ];

    protected $casts = [
        'phi_categories' => 'array',
        'confidence_threshold' => 'decimal:4',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
