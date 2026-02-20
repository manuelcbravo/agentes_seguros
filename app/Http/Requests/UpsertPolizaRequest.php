<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertPolizaRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $agentId = (string) ($this->user()?->agent_id ?? '');

        return [
            'id' => ['nullable', 'uuid'],
            'insured_id' => ['required', 'uuid', Rule::exists('insureds', 'id')->where('agent_id', $agentId)],
            'client_id' => ['nullable', 'uuid'],
            'status' => ['required', 'string', 'max:120'],
            'payment_channel' => ['nullable', Rule::exists('cat_payment_channels', 'code')],
            'product' => ['nullable', 'string', 'max:160'],
            'coverage_start' => ['nullable', 'date'],
            'risk_premium' => ['nullable', 'numeric', 'min:0'],
            'fractional_premium' => ['nullable', 'numeric', 'min:0'],
            'periodicity' => ['nullable', 'string', 'max:120'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'currency' => ['nullable', 'integer'],
            'currency_id' => ['nullable', 'uuid'],
        ];
    }
}
