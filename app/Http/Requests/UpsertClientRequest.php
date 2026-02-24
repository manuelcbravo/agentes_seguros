<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpsertClientRequest extends FormRequest
{
    public static function wizardRules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:150'],
            'middle_name' => ['nullable', 'string', 'max:150'],
            'last_name' => ['required', 'string', 'max:150'],
            'second_last_name' => ['nullable', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'rfc' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id' => ['nullable', 'uuid', 'exists:clients,id'],
            ...self::wizardRules(),
            'is_active' => ['required', 'boolean'],
            'avatar' => ['nullable', 'image', 'max:2048'],
            'avatar_path' => ['nullable', 'string', 'exists:files,path'],
        ];
    }
}
