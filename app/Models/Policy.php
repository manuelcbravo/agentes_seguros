<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\AssignsAgentOwnership;
use App\Models\Concerns\HasUuid;
use App\Models\Traits\HasTrackingActivities;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Policy extends Model
{
    use AssignsAgentOwnership, HasUuid, SoftDeletes, HasTrackingActivities;

    protected $fillable = [
        'agent_id',
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
}
