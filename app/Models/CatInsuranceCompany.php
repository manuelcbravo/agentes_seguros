<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CatInsuranceCompany extends Model
{
    use HasUuid, SoftDeletes;

    protected $table = 'cat_insurance_companies';

    protected $fillable = [
        'code',
        'name',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'insurance_company_id');
    }
}
