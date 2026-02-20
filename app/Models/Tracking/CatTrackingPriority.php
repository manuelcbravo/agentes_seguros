<?php

namespace App\Models\Tracking;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatTrackingPriority extends Model
{
    use SoftDeletes;

    protected $table = 'cat_tracking_priorities';

    protected $fillable = ['key', 'name', 'level', 'is_active', 'sort_order'];

    protected $casts = ['is_active' => 'boolean', 'level' => 'integer'];
}
