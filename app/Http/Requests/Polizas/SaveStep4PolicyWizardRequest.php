<?php

namespace App\Http\Requests\Polizas;

use Illuminate\Foundation\Http\FormRequest;

class SaveStep4PolicyWizardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'policy_id' => ['required', 'uuid'],
            'beneficiaries' => ['required', 'array', 'min:1'],
            'beneficiaries.*.id' => ['nullable', 'uuid'],
            'beneficiaries.*.first_name' => ['required', 'string', 'max:150'],
            'beneficiaries.*.middle_name' => ['nullable', 'string', 'max:150'],
            'beneficiaries.*.last_name' => ['required', 'string', 'max:150'],
            'beneficiaries.*.second_last_name' => ['nullable', 'string', 'max:150'],
            'beneficiaries.*.relationship_id' => ['required', 'uuid', 'exists:cat_relationships,id'],
            'beneficiaries.*.benefit_percentage' => ['required', 'numeric', 'gt:0', 'max:100'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $total = collect($this->input('beneficiaries', []))
                ->sum(fn (array $beneficiary) => (float) ($beneficiary['benefit_percentage'] ?? 0));

            if (round($total, 2) !== 100.0) {
                $validator->errors()->add('beneficiaries', 'Los beneficiarios deben sumar 100%.');
            }
        });
    }
}
