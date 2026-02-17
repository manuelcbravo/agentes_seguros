<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class File extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size',
        'table_id',
        'related_id',
    ];

    protected $appends = [
        'url',
    ];

    protected $casts = [
        'related_id' => 'integer',
    ];

    public function getUrlAttribute(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }
}
