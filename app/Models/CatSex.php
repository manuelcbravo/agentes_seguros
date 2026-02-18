<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatSex extends Model
{
    use HasUuid, SoftDeletes;

    protected $table = 'cat_sexes';

    protected $fillable = [
        'code',
        'name',
    ];

}
