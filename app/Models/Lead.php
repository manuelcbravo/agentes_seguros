<?php

namespace App\Models;

use App\Models\Concerns\AssignsAgentOwnership;
use App\Models\Concerns\HasUuid;
use App\Models\Traits\HasTrackingActivities;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use LaravelArchivable\Archivable;

class Lead extends Model
{
    use AssignsAgentOwnership, SoftDeletes, HasUuid, Archivable, HasTrackingActivities;

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
        'archived_at' => 'datetime',
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
