<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpsertClientRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id' => ['nullable', 'integer', 'exists:clients,id'],
            'first_name' => ['required', 'string', 'max:150'],
            'last_name' => ['required', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'is_active' => ['required', 'boolean'],
            'avatar' => ['nullable', 'image', 'max:2048'],
            'avatar_path' => ['nullable', 'string', 'exists:files,path'],
        ];
    }
}
