<?php

namespace App\Models;

use App\Models\Concerns\AssignsAgentOwnership;
use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AgentCommission extends Model
{
    use AssignsAgentOwnership, HasUuid, SoftDeletes;

    protected $fillable = [
        'agent_id',
        'insurer_name',
        'concept',
        'reference',
        'period',
        'earned_date',
        'amount',
        'currency',
        'status',
        'notes',
        'meta',
        'created_by',
    ];

    protected $casts = [
        'earned_date' => 'date',
        'amount' => 'decimal:2',
        'meta' => 'array',
    ];

    protected $appends = ['applied_amount', 'remaining_amount', 'is_paid', 'status_effective'];

    public function scopeForAgent(Builder $query, string $agentId): Builder
    {
        return $query->where('agent_id', $agentId);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(AgentCommissionPaymentLine::class, 'commission_id');
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

    public function getIsPaidAttribute(): bool
    {
        return $this->remaining_amount <= 0.00001;
    }

    public function getStatusEffectiveAttribute(): string
    {
        if ($this->status === 'cancelled') {
            return 'cancelled';
        }

        return $this->is_paid ? 'paid' : 'pending';
    }
}
