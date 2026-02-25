<?php

namespace App\Http\Requests\Polizas;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveStep3PolicyWizardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'policy_id' => ['required', 'uuid'],
            'payment_channel' => ['required', 'integer', Rule::exists('cat_payment_channels', 'id')],
            'coverage_start' => ['required', 'date'],
            'risk_premium' => ['required', 'numeric', 'min:0'],
            'fractional_premium' => ['required', 'numeric', 'min:0'],
            'periodicity_id' => ['required', 'integer', 'exists:cat_periodicities,id'],
            'month' => ['required', 'string', 'regex:/^(0[1-9]|1[0-2])$/'],
            'currency' => ['required', 'integer', 'exists:cat_currencies,id'],
            'insurance_company_id' => ['required', 'uuid', 'exists:cat_insurance_companies,id'],
            'product_id' => [
                'required',
                'uuid',
                function ($attribute, $value, $fail) {
                    $exists = Product::query()
                        ->whereKey($value)
                        ->where('insurance_company_id', $this->string('insurance_company_id'))
                        ->exists();

                    if (! $exists) {
                        $fail('Selecciona un producto válido para la marca elegida.');
                    }
                },
            ],
        ];
    }
}
