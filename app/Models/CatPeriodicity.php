<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CatPeriodicity extends Model
{
    protected $table = 'cat_periodicities';

    protected $fillable = [
        'name',
        'code',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
