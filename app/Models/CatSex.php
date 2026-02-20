<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatSex extends Model
{
    use SoftDeletes;

    protected $table = 'cat_sexes';

    protected $fillable = [
        'code',
        'name',
    ];

}
