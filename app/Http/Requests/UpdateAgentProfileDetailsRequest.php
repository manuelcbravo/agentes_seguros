<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAgentProfileDetailsRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'display_name' => ['required', 'string', 'max:120'],
            'headline' => ['nullable', 'string', 'max:180'],
            'bio' => ['nullable', 'string', 'max:3000'],
            'email_public' => ['nullable', 'email', 'max:255'],
            'phone_public' => ['nullable', 'string', 'max:60'],
            'whatsapp_public' => ['nullable', 'string', 'max:60'],
            'website_url' => ['nullable', 'url', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'state' => ['nullable', 'string', 'max:120'],
            'service_areas' => ['nullable', 'array'],
            'service_areas.*' => ['nullable', 'string', 'max:120'],
            'specialties' => ['nullable', 'array'],
            'specialties.*' => ['nullable', 'string', 'max:120'],
            'insurers' => ['nullable', 'array'],
            'insurers.*' => ['nullable', 'string', 'max:120'],
            'profile_photo' => ['nullable', 'image', 'max:4096'],
            'cover_image' => ['nullable', 'image', 'max:6144'],
        ];
    }
}
