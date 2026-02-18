<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AgentLicense extends Model
{
    use HasUuid, SoftDeletes;

    protected $fillable = [
        'agent_id',
        'aseguradora_id',
        'num_licencia',
        'fecha_expiracion',
        'fecha_emision',
        'status',
        'observaciones',
        'activo',
    ];

    protected $casts = [
        'fecha_expiracion' => 'date',
        'fecha_emision' => 'date',
        'activo' => 'boolean',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function insuranceCompany(): BelongsTo
    {
        return $this->belongsTo(CatInsuranceCompany::class, 'aseguradora_id');
    }
}
