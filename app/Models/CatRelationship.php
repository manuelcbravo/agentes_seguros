<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatRelationship extends Model
{
    use SoftDeletes;

    protected $table = 'cat_relationships';

    protected $fillable = [
        'code',
        'name',
    ];

}
