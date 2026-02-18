<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\AssignsAgentOwnership;
use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Beneficiary extends Model
{
    use AssignsAgentOwnership, HasUuid, SoftDeletes;

    protected $fillable = [
        'agent_id',
        'policy_id',
        'name',
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
        'relationship',
        'relationship_id',
        'benefit_percentage',
    ];

    protected $casts = [
        'birthday' => 'date',
        'approx_income' => 'decimal:2',
        'benefit_percentage' => 'decimal:2',
        'smokes' => 'boolean',
        'drinks' => 'boolean',
    ];


    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function relationshipCatalog(): BelongsTo
    {
        return $this->belongsTo(CatRelationship::class, 'relationship_id');
    }
}
