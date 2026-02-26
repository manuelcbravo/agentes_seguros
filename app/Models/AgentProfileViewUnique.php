<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentProfileViewUnique extends Model
{
    use HasUuid;

    protected $fillable = [
        'agent_id',
        'date',
        'ip_hash',
        'user_agent_hash',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
