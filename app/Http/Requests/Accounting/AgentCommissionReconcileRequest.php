<?php

namespace App\Http\Requests\Accounting;

use App\Models\AgentCommission;
use App\Models\AgentCommissionPayment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class AgentCommissionReconcileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $agentId = (string) auth()->user()?->agent_id;

        return [
            'payment_id' => [
                'required',
                'uuid',
                function (string $attribute, mixed $value, \Closure $fail) use ($agentId): void {
                    if (! AgentCommissionPayment::query()->where('id', $value)->where('agent_id', $agentId)->exists()) {
                        $fail('El pago no existe para este agente.');
                    }
                },
            ],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.commission_id' => [
                'required',
                'uuid',
                function (string $attribute, mixed $value, \Closure $fail) use ($agentId): void {
                    if (! AgentCommission::query()->where('id', $value)->where('agent_id', $agentId)->exists()) {
                        $fail('La comisión no existe para este agente.');
                    }
                },
            ],
            'lines.*.amount_applied' => ['required', 'numeric', 'min:0.01'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $lines = collect($this->input('lines', []));

            if ($lines->pluck('commission_id')->duplicates()->isNotEmpty()) {
                $validator->errors()->add('lines', 'No puedes repetir comisiones en la misma conciliación.');
            }
        });
    }
}
