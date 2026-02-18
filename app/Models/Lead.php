<?php

namespace App\Models;

use App\Models\Concerns\AssignsAgentOwnership;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use AssignsAgentOwnership, SoftDeletes;

    protected $fillable = [
        'agent_id',
        'first_name',
        'last_name',
        'phone',
        'email',
        'source',
        'status',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
