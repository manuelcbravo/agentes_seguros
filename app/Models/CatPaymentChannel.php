<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatPaymentChannel extends Model
{
    use SoftDeletes;

    protected $table = 'cat_payment_channels';

    protected $fillable = [
        'code',
        'name',
    ];
}
