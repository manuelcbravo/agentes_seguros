<?php

namespace App\Http\Requests\Polizas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveStep4PolicyWizardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $agentId = (string) ($this->user()?->agent_id ?? '');

        return [
            'policy_id' => ['required', 'uuid'],
            'beneficiaries' => ['required', 'array', 'min:1'],
            'beneficiaries.*.beneficiary_id' => [
                'required',
                'uuid',
                Rule::exists('beneficiaries', 'id')->where('agent_id', $agentId),
            ],
            'beneficiaries.*.percentage' => ['required', 'numeric', 'min:0.01', 'max:100'],
            'beneficiaries.*.relationship_id' => ['required', 'integer', 'exists:cat_relationships,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $total = collect($this->input('beneficiaries', []))
                ->sum(fn (array $beneficiary) => (float) ($beneficiary['percentage'] ?? 0));

            if (abs(round($total, 2) - 100.0) > 0.01) {
                $validator->errors()->add('beneficiaries', 'Los beneficiarios deben sumar 100%.');
            }
        });
    }
}
