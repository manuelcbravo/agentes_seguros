<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\AssignsAgentOwnership;
use App\Models\Concerns\HasUuid;
use App\Models\Traits\HasTrackingActivities;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;

class Policy extends Model
{
    public const STATUS_DRAFT = 'borrador';
    public const STATUS_ACTIVE = 'activo';
    public const STATUS_EXPIRED = 'caducada';

    use AssignsAgentOwnership, HasUuid, SoftDeletes, HasTrackingActivities, Searchable;

    protected $fillable = [
        'client_id',
        'insured_id',
        'status',
        'payment_channel',
        'product',
        'coverage_start',
        'risk_premium',
        'fractional_premium',
        'periodicity',
        'month',
        'currency',
        'currency_id',
    ];

    protected $casts = [
        'coverage_start' => 'date',
        'risk_premium' => 'decimal:2',
        'fractional_premium' => 'decimal:2',
        'month' => 'integer',
    ];



    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED;
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function insured()
    {
        return $this->belongsTo(Insured::class);
    }

    public function currencyCatalog(): BelongsTo
    {
        return $this->belongsTo(CatCurrency::class, 'currency_id');
    }

    public function beneficiaries()
    {
        return $this->hasMany(Beneficiary::class);
    }

    public function toSearchableArray(): array
    {
        $searchText = mb_strtolower(implode(' ', array_filter([
            $this->product,
            $this->status,
            $this->periodicity,
            $this->client?->full_name,
        ])));

        return [
            'id' => $this->id,
            'agent_id' => $this->agent_id,
            'product' => $this->product,
            'status' => $this->status,
            'periodicity' => $this->periodicity,
            'client_name' => $this->client?->full_name,
            'search_text' => $searchText,
        ];
    }
}
