<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAgentProfileRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $profileId = $this->user()?->agent?->profile?->id;

        return [
            'display_name' => ['required', 'string', 'max:120'],
            'headline' => ['nullable', 'string', 'max:180'],
            'bio' => ['nullable', 'string', 'max:3000'],
            'brand_color' => ['nullable', 'regex:/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/'],
            'logo_path' => ['nullable', 'string', 'max:255'],

            'email_public' => ['nullable', 'email', 'max:255'],
            'phone_public' => ['nullable', 'string', 'max:60'],
            'whatsapp_public' => ['nullable', 'string', 'max:60'],
            'website_url' => ['nullable', 'url', 'max:255'],
            'address_public' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'state' => ['nullable', 'string', 'max:120'],

            'service_areas' => ['nullable', 'array'],
            'service_areas.*' => ['nullable', 'string', 'max:120'],
            'languages' => ['nullable', 'array'],
            'languages.*' => ['nullable', 'string', 'max:120'],
            'working_hours' => ['nullable', 'array'],

            'specialties' => ['nullable', 'array'],
            'specialties.*' => ['nullable', 'string', 'max:120'],
            'insurers' => ['nullable', 'array'],
            'insurers.*' => ['nullable', 'string', 'max:120'],
            'cta_title' => ['nullable', 'string', 'max:120'],
            'cta_description' => ['nullable', 'string', 'max:255'],

            'public_slug' => [
                'required',
                'string',
                'min:3',
                'max:120',
                'alpha_dash',
                Rule::unique('agent_profiles', 'public_slug')->ignore($profileId),
            ],
            'is_public_enabled' => ['required', 'boolean'],
            'contact_form_enabled' => ['required', 'boolean'],
            'show_licenses' => ['required', 'boolean'],

            'profile_photo' => ['nullable', 'image', 'max:4096'],
            'cover_image' => ['nullable', 'image', 'max:6144'],
            'logo_image' => ['nullable', 'image', 'max:4096'],
        ];
    }
}
