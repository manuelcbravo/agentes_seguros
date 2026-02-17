<?php

namespace App\Http\Requests\Config;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpsertUserRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->integer('id') ?: null;

        return [
            'id' => ['nullable', 'integer', 'exists:users,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$userId],
            'password' => ['nullable', 'string', 'min:8', 'required_without:id'],
            'roles' => ['array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ];
    }
}
