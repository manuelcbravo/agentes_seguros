<?php

namespace App\Models;

use App\Models\Traits\HasTrackingActivities;
use Illuminate\Database\Eloquent\Model;
use Mattiverse\Userstamps\Traits\Userstamps;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;
use App\Models\Concerns\HasUuid;

class Client extends Model
{
    use Userstamps, SoftDeletes, HasUuid, HasTrackingActivities, Searchable;

    // ===== MASS ASSIGNMENT =====
    protected $fillable = [
        'company_id',
        'agent_id',

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

    public function toSearchableArray(): array
    {
        $searchText = mb_strtolower(implode(' ', array_filter([
            $this->full_name,
            $this->email,
            $this->phone,
            $this->rfc,
        ])));

        return [
            'id' => $this->id,
            'agent_id' => $this->agent_id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'rfc' => $this->rfc,
            'search_text' => $searchText,
        ];
    }
}
