<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolicyWizardDraft extends Model
{
    use HasUuid;

    protected $fillable = [
        'agent_id',
        'source_type',
        'source_id',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
