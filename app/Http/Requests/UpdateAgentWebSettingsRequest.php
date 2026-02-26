<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAgentWebSettingsRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'is_public_enabled' => ['required', 'boolean'],
            'contact_form_enabled' => ['required', 'boolean'],
            'show_licenses' => ['required', 'boolean'],
        ];
    }
}
