<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatCurrency extends Model
{
    use SoftDeletes;

    protected $table = 'cat_currencies';

    protected $fillable = [
        'code',
        'name',
    ];
}
