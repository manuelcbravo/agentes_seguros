<?php

namespace App\Models\Tracking;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatTrackingStatus extends Model
{
    use SoftDeletes;

    protected $table = 'cat_tracking_statuses';

    protected $fillable = ['key', 'name', 'is_active', 'sort_order'];

    protected $casts = ['is_active' => 'boolean'];
}
