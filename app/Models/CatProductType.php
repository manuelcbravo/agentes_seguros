<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CatProductType extends Model
{
    use HasUuid, SoftDeletes;

    protected $table = 'cat_product_types';

    protected $fillable = [
        'code',
        'name',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'product_type_id');
    }
}
