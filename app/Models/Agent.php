<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Crypt;

class Agent extends Model
{
    use HasUuid, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'email',
        'license_id',
        'commission_percent',
        'photo_path',
        'city',
        'state',
    ];

    protected $casts = [
        'commission_percent' => 'decimal:2',
        'google_scopes' => 'array',
        'google_token_expires_at' => 'datetime',
        'google_connected_at' => 'datetime',
        'google_disconnected_at' => 'datetime',
        'google_last_sync_at' => 'datetime',
    ];

    protected function googleAccessToken(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? Crypt::decryptString($value) : null,
            set: fn (?string $value) => $value ? Crypt::encryptString($value) : null,
        );
    }

    protected function googleRefreshToken(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? Crypt::decryptString($value) : null,
            set: fn (?string $value) => $value ? Crypt::encryptString($value) : null,
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function insureds(): HasMany
    {
        return $this->hasMany(Insured::class);
    }

    public function policies(): HasMany
    {
        return $this->hasMany(Policy::class);
    }

    public function beneficiaries(): HasMany
    {
        return $this->hasMany(Beneficiary::class);
    }

    public function licenses(): HasMany
    {
        return $this->hasMany(AgentLicense::class);
    }
}
