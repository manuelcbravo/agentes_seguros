<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\SoftDeletes;

class Beneficiary extends Model
{
    use HasUuid, SoftDeletes;

    protected $fillable = [
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
        'benefit_percentage',
    ];

    protected $casts = [
        'birthday' => 'date',
        'approx_income' => 'decimal:2',
        'benefit_percentage' => 'decimal:2',
        'smokes' => 'boolean',
        'drinks' => 'boolean',
    ];

    public function policy()
    {
        return $this->belongsTo(Policy::class);
    }
}
