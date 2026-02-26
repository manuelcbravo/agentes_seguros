<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentProfile extends Model
{
    use HasUuid;

    protected $fillable = [
        'agent_id',
        'display_name',
        'headline',
        'bio',
        'profile_photo_path',
        'cover_image_path',
        'brand_color',
        'logo_path',
        'email_public',
        'phone_public',
        'whatsapp_public',
        'website_url',
        'address_public',
        'city',
        'state',
        'service_areas',
        'languages',
        'working_hours',
        'specialties',
        'insurers',
        'cta_title',
        'cta_description',
        'public_slug',
        'is_public_enabled',
        'contact_form_enabled',
        'show_licenses',
        'last_published_at',
    ];

    protected $casts = [
        'service_areas' => 'array',
        'languages' => 'array',
        'working_hours' => 'array',
        'specialties' => 'array',
        'insurers' => 'array',
        'is_public_enabled' => 'boolean',
        'contact_form_enabled' => 'boolean',
        'show_licenses' => 'boolean',
        'last_published_at' => 'datetime',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
