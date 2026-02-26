<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentProfileViewStat extends Model
{
    use HasUuid;

    protected $fillable = [
        'agent_id',
        'date',
        'views_total',
        'views_unique',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
