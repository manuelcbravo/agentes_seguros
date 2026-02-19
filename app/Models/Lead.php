<?php

namespace App\Models;

use App\Models\Concerns\AssignsAgentOwnership;
use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use AssignsAgentOwnership, SoftDeletes, HasUuid;

    protected $fillable = [
        'agent_id',
        'client_id',
        'first_name',
        'last_name',
        'phone',
        'email',
        'source',
        'status',
        'converted_at',
    ];

    protected $casts = [
        'converted_at' => 'datetime',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
