<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class BeneficiaryPolicy extends Pivot
{
    use HasUuid;

    protected $table = 'beneficiary_policy';

    protected $fillable = [
        'policy_id',
        'beneficiary_id',
        'percentage',
        'relationship_id',
    ];

    public function relationship(): BelongsTo
    {
        return $this->belongsTo(CatRelationship::class, 'relationship_id');
    }
}
