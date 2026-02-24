<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AgentCommissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'id' => ['nullable', 'uuid'],
            'insurer_name' => ['required', 'string', 'max:120'],
            'concept' => ['required', 'string', 'max:150'],
            'reference' => ['nullable', 'string', 'max:120'],
            'period' => ['required', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
            'earned_date' => ['nullable', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['nullable', 'string', 'size:3'],
            'status' => ['nullable', Rule::in(['pending', 'cancelled'])],
            'notes' => ['nullable', 'string'],
        ];
    }
}
