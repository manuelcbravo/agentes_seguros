<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatCurrency extends Model
{
    use HasUuid, SoftDeletes;

    protected $table = 'cat_currencies';

    protected $fillable = [
        'code',
        'name',
    ];
}
