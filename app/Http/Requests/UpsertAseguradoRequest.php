<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpsertAseguradoRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id' => ['nullable', 'uuid'],
            'client_id' => ['nullable', 'uuid'],
            'birthday' => ['required', 'date'],
            'age_current' => ['nullable', 'integer', 'min:0'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:160'],
            'occupation' => ['nullable', 'string', 'max:160'],
            'company_name' => ['nullable', 'string', 'max:160'],
            'approx_income' => ['nullable', 'numeric', 'min:0'],
            'address' => ['nullable', 'string'],
            'smokes' => ['nullable', 'boolean'],
            'drinks' => ['nullable', 'boolean'],
        ];
    }
}
