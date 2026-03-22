<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetectionRule extends Model
{
    protected $fillable = [
        'organization_id',
        'rule_type',
        'rule_pattern',
        'phi_category',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
