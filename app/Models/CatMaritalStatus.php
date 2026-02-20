<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatMaritalStatus extends Model
{
    use SoftDeletes;

    protected $table = 'cat_marital_statuses';

    protected $fillable = [
        'code',
        'name',
    ];

}
