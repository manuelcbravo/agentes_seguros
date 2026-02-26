<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\AssignsAgentOwnership;
use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;

class Beneficiary extends Model
{
    use AssignsAgentOwnership, HasUuid, SoftDeletes, Searchable;

    protected $fillable = [
        'agent_id',
        'policy_id',
        'first_name',
        'middle_name',
        'last_name',
        'second_last_name',
        'birthday',
        'rfc',
        'address',
        'occupation',
        'company_name',
        'approx_income',
        'medical_history',
        'insurer_company',
        'main_savings_goal',
        'personal_interests',
        'personal_likes',
        'smokes',
        'drinks',
        'personality',
        'benefit_percentage',
    ];

    protected $appends = ['full_name'];

    protected $casts = [
        'birthday' => 'date',
        'approx_income' => 'decimal:2',
        'benefit_percentage' => 'decimal:2',
        'smokes' => 'boolean',
        'drinks' => 'boolean',
    ];



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
    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function policies(): BelongsToMany
    {
        return $this->belongsToMany(Policy::class)
            ->using(BeneficiaryPolicy::class)
            ->withPivot(['id', 'percentage', 'relationship_id'])
            ->withTimestamps();
    }

    public function toSearchableArray(): array
    {
        $searchText = mb_strtolower(implode(' ', array_filter([
            $this->full_name,
            $this->rfc,
            $this->occupation,
            $this->company_name,
        ])));

        return [
            'id' => $this->id,
            'agent_id' => $this->agent_id,
            'full_name' => $this->full_name,
            'rfc' => $this->rfc,
            'occupation' => $this->occupation,
            'search_text' => $searchText,
        ];
    }
}
