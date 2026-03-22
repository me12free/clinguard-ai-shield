<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Allowlist extends Model
{
    protected $fillable = [
        'organization_id',
        'service_name',
        'service_domain',
        'approval_date',
    ];

    protected $casts = [
        'approval_date' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
