<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Relations\Pivot;

class BeneficiaryPolicy extends Pivot
{
    use HasUuid;

    protected $table = 'beneficiary_policy';

    protected $fillable = [
        'policy_id',
        'beneficiary_id',
        'percentage',
    ];
}

