<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolicyAiImportFile extends Model
{
    use HasUuid;

    protected $fillable = [
        'policy_ai_import_id',
        'agent_id',
        'original_filename',
        'mime_type',
        'disk',
        'path',
        'size',
    ];

    public function import(): BelongsTo
    {
        return $this->belongsTo(PolicyAiImport::class, 'policy_ai_import_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
