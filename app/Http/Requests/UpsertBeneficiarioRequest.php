<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertBeneficiarioRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $agentId = (string) ($this->user()?->agent_id ?? '');

        return [
            'id' => ['nullable', 'uuid'],
            'policy_id' => ['required', 'uuid', Rule::exists('policies', 'id')->where('agent_id', $agentId)],
            'name' => ['required', 'string', 'max:180'],
            'birthday' => ['nullable', 'date'],
            'rfc' => ['nullable', 'string', 'max:30'],
            'relationship' => ['nullable', 'integer'],
            'benefit_percentage' => ['nullable', 'numeric', 'between:0,100'],
            'occupation' => ['nullable', 'string', 'max:160'],
            'company_name' => ['nullable', 'string', 'max:160'],
            'approx_income' => ['nullable', 'numeric', 'min:0'],
            'address' => ['nullable', 'string'],
            'smokes' => ['nullable', 'boolean'],
            'drinks' => ['nullable', 'boolean'],
        ];
    }
}
