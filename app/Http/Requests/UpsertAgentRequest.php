<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpsertAgentRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $agentId = $this->string('id') ?: null;

        return [
            'id' => ['nullable', 'uuid', 'exists:agents,id'],
            'user_id' => ['required', 'integer', 'exists:users,id', 'unique:agents,user_id,'.$agentId.',id'],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'license_id' => ['nullable', 'string', 'max:255'],
            'commission_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'photo_path' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
        ];
    }
}
