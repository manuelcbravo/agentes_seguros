<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Mattiverse\Userstamps\Traits\Userstamps;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Models\Concerns\HasUuid;

class Client extends Model
{
    use Userstamps, SoftDeletes, HasUuid;

    // ===== MASS ASSIGNMENT =====
    protected $fillable = [
        'uuid',
        'company_id',

        // datos personales
        'first_name',
        'middle_name',
        'last_name',
        'second_last_name',
        'birth_date',
        'age',
        'gender',

        // identificación
        'curp',
        'rfc',
        'tax_regime',

        // contacto
        'email',
        'email_verified_at',
        'phone',

        // dirección
        'street',
        'ext_number',
        'int_number',
        'neighborhood',
        'city',
        'state',
        'country',
        'postal_code',

        // perfil digital
        'avatar_path',

        // crm
        'source',
        'campaign',
        'sales_stage',
        'lifetime_value',
        'first_contact_at',
        'last_contact_at',
        'next_followup_at',

        // estado
        'is_active',
        'is_blacklisted',

        // json
        'documents',
        'extra_attributes',
    ];
    
    protected static function booted()
    {
        static::creating(function ($model) {
            if (!$model->uuid) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    // ===== CASTS =====
    protected $casts = [
        'birth_date' => 'date',
        'first_contact_at' => 'date',
        'last_contact_at' => 'date',
        'next_followup_at' => 'date',

        'documents' => 'array',
        'extra_attributes' => 'array',

        'is_active' => 'boolean',
        'is_blacklisted' => 'boolean',

        'lifetime_value' => 'decimal:2',
    ];

    // ===== APPENDS =====
    protected $appends = [
        'full_name',
        'avatar_url',
    ];

    // =====================================================
    // ACCESSORS
    // =====================================================

    public function getFullNameAttribute()
    {
        return trim(implode(' ', array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
            $this->second_last_name
        ])));
    }

    public function getAvatarUrlAttribute()
    {
        if (!$this->avatar_path) {
            return asset('assets/images/default_client.png');
        }

        // Si usas S3
        if (str_starts_with($this->avatar_path, 'http')) {
            return $this->avatar_path;
        }

        return \Storage::url($this->avatar_path);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeNotBlacklisted($query)
    {
        return $query->where('is_blacklisted', false);
    }

    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('first_name', 'like', "%{$term}%")
                ->orWhere('last_name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%")
                ->orWhere('rfc', 'like', "%{$term}%");
        });
    }

    public function isActive(): bool
    {
        return $this->is_active;
    }

    public function isBlacklisted(): bool
    {
        return $this->is_blacklisted;
    }
}
