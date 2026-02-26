<?php

namespace App\Models;

use App\Models\Concerns\AssignsAgentOwnership;
use App\Models\Concerns\HasUuid;
use App\Models\Traits\HasTrackingActivities;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;
use LaravelArchivable\Archivable;

class Lead extends Model
{
    use AssignsAgentOwnership, SoftDeletes, HasUuid, Archivable, HasTrackingActivities, Searchable;

    protected $fillable = [
        'agent_id',
        'client_id',
        'first_name',
        'middle_name',
        'last_name',
        'second_last_name',
        'phone',
        'email',
        'message',
        'source',
        'status',
        'converted_at',
    ];

    protected $casts = [
        'converted_at' => 'datetime',
        'archived_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected $appends = ['full_name'];

    public function getFullNameAttribute(): string
    {
        return trim(preg_replace('/\s+/', ' ', implode(' ', array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
            $this->second_last_name,
        ]))) ?? '');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function toSearchableArray(): array
    {
        $searchText = mb_strtolower(implode(' ', array_filter([
            $this->full_name,
            $this->email,
            $this->phone,
            $this->source,
        ])));

        return [
            'id' => $this->id,
            'agent_id' => $this->agent_id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'search_text' => $searchText,
        ];
    }
}
