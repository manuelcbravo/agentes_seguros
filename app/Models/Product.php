<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasUuid, SoftDeletes;

    protected $fillable = [
        'insurance_company_id',
        'product_type_id',
        'code',
        'name',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function insuranceCompany(): BelongsTo
    {
        return $this->belongsTo(CatInsuranceCompany::class, 'insurance_company_id');
    }

    public function productType(): BelongsTo
    {
        return $this->belongsTo(CatProductType::class, 'product_type_id');
    }
}
