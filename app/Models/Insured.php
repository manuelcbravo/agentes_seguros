<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\AssignsAgentOwnership;
use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;

class Insured extends Model
{
     use AssignsAgentOwnership, HasUuid, SoftDeletes, Searchable;

    protected $fillable = [
        'agent_id',
        'client_id',
        'first_name',
        'middle_name',
        'last_name',
        'second_last_name',
        'birthday',
        'rfc',
        'age_current',
        'phone',
        'email',
        'marital_status',
        'marital_status_id',
        'sex',
        'sex_id',
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
        'children_count',
        'children_names',
        'children_birthdates',
    ];

    protected $appends = ['full_name'];

    protected $casts = [
        'birthday' => 'date',
        'approx_income' => 'decimal:2',
        'smokes' => 'boolean',
        'drinks' => 'boolean',
        'children_count' => 'integer',
        'children_names' => 'array',
        'children_birthdates' => 'array',
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
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function maritalStatusCatalog(): BelongsTo
    {
        return $this->belongsTo(CatMaritalStatus::class, 'marital_status_id');
    }

    public function sexCatalog(): BelongsTo
    {
        return $this->belongsTo(CatSex::class, 'sex_id');
    }

    public function policies()
    {
        return $this->hasMany(Policy::class);
    }

    public function toSearchableArray(): array
    {
        $searchText = mb_strtolower(implode(' ', array_filter([
            $this->full_name,
            $this->email,
            $this->phone,
            $this->rfc,
            $this->occupation,
            $this->company_name,
        ])));

        return [
            'id' => $this->id,
            'agent_id' => $this->agent_id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'rfc' => $this->rfc,
            'occupation' => $this->occupation,
            'search_text' => $searchText,
        ];
    }
}
