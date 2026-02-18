<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use App\Models\Concerns\HasUuid;

class File extends Model
{
    use HasUuid, SoftDeletes;

    protected $fillable = [
        'uuid',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size',
        'related_table',
        'related_uuid',
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
