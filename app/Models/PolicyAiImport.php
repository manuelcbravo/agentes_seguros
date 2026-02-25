<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PolicyAiImport extends Model
{
    use HasUuid;

    public const STATUS_UPLOADED = 'uploaded';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_READY = 'ready';
    public const STATUS_NEEDS_REVIEW = 'needs_review';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'agent_id',
        'client_id',
        'original_filename',
        'mime_type',
        'disk',
        'path',
        'status',
        'extracted_text',
        'ai_data',
        'ai_confidence',
        'missing_fields',
        'error_message',
        'took_ms',
    ];

    protected $casts = [
        'ai_data' => 'array',
        'ai_confidence' => 'array',
        'missing_fields' => 'array',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(PolicyAiImportFile::class);
    }
}
