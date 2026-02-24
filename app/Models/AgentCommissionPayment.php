<?php

namespace App\Models;

use App\Models\Concerns\AssignsAgentOwnership;
use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AgentCommissionPayment extends Model
{
    use AssignsAgentOwnership, HasUuid, SoftDeletes;

    protected $fillable = [
        'agent_id',
        'insurer_name',
        'payment_date',
        'amount',
        'currency',
        'reference',
        'status',
        'notes',
        'meta',
        'created_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'decimal:2',
        'meta' => 'array',
    ];

    protected $appends = ['applied_amount', 'remaining_amount'];

    public function scopeForAgent(Builder $query, string $agentId): Builder
    {
        return $query->where('agent_id', $agentId);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(AgentCommissionPaymentLine::class, 'payment_id');
    }

    public function getAppliedAmountAttribute(): float
    {
        $amount = $this->lines_sum_amount_applied
            ?? $this->lines()->sum('amount_applied');

        return (float) $amount;
    }

    public function getRemainingAmountAttribute(): float
    {
        return max(0, (float) $this->amount - $this->applied_amount);
    }
}
