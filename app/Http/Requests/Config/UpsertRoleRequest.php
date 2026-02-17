<?php

namespace App\Http\Requests\Config;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpsertRoleRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $roleId = $this->integer('id') ?: null;

        return [
            'id' => ['nullable', 'integer', 'exists:roles,id'],
            'name' => ['required', 'string', 'max:255', 'unique:roles,name,'.$roleId],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }
}
