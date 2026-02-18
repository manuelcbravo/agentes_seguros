<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatRelationship extends Model
{
    use HasUuid, SoftDeletes;

    protected $table = 'cat_relationships';

    protected $fillable = [
        'code',
        'name',
    ];

}
