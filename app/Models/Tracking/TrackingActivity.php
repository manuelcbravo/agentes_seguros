<?php

namespace App\Models\Tracking;

use App\Models\Agent;
use App\Models\Concerns\HasUuid;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrackingActivity extends Model
{
    use HasUuid, SoftDeletes;

    protected $table = 'tbl_tracking_activities';

    protected $fillable = [
        'agent_id',
        'trackable_type',
        'trackable_id',
        'activity_type_id',
        'channel_id',
        'status_id',
        'priority_id',
        'outcome_id',
        'title',
        'body',
        'occurred_at',
        'next_action_at',
        'completed_at',
        'assigned_to',
        'created_by',
        'meta',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
        'next_action_at' => 'datetime',
        'completed_at' => 'datetime',
        'meta' => 'array',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function trackable(): MorphTo
    {
        return $this->morphTo();
    }

    public function activityType(): BelongsTo
    {
        return $this->belongsTo(CatTrackingActivityType::class, 'activity_type_id');
    }

    public function channel(): BelongsTo
    {
        return $this->belongsTo(CatTrackingChannel::class, 'channel_id');
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(CatTrackingStatus::class, 'status_id');
    }

    public function priority(): BelongsTo
    {
        return $this->belongsTo(CatTrackingPriority::class, 'priority_id');
    }

    public function outcome(): BelongsTo
    {
        return $this->belongsTo(CatTrackingOutcome::class, 'outcome_id');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
