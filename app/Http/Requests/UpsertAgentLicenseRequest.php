<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertAgentLicenseRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = $this->input('id');

        return [
            'id' => ['nullable', 'uuid', 'exists:agent_licenses,id'],
            'agent_id' => ['required', 'uuid', 'exists:agents,id'],
            'aseguradora_id' => ['required', 'uuid', 'exists:cat_insurance_companies,id'],
            'num_licencia' => [
                'required',
                'string',
                'max:120',
                Rule::unique('agent_licenses', 'num_licencia')
                    ->where(fn ($query) => $query->where('aseguradora_id', $this->input('aseguradora_id')))
                    ->ignore($id),
            ],
            'fecha_expiracion' => ['required', 'date'],
            'fecha_emision' => ['required', 'date', 'before_or_equal:fecha_expiracion'],
            'status' => ['required', 'string', 'max:30'],
            'observaciones' => ['nullable', 'string', 'max:1500'],
            'activo' => ['required', 'boolean'],
        ];
    }
}
