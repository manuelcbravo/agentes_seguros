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
            'policy_id' => ['nullable', 'uuid', Rule::exists('policies', 'id')->where('agent_id', $agentId)],
            'first_name' => ['required', 'string', 'max:150'],
            'middle_name' => ['nullable', 'string', 'max:150'],
            'last_name' => ['required', 'string', 'max:150'],
            'second_last_name' => ['nullable', 'string', 'max:150'],
            'birthday' => ['nullable', 'date'],
            'rfc' => ['nullable', 'string', 'max:30'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
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
