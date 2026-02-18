<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatMaritalStatus extends Model
{
    use HasUuid, SoftDeletes;

    protected $table = 'cat_marital_statuses';

    protected $fillable = [
        'code',
        'name',
    ];

}
