<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertLeadRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->filled('agent_id')) {
            return;
        }

        /** @var User|null $user */
        $user = $this->user();
        $user?->loadMissing('agent');

        if ($user?->agent?->id) {
            $this->merge(['agent_id' => $user->agent->id]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $leadId = $this->input('id');
        $agentId = (string) $this->input('agent_id');

        return [
            'id' => ['nullable', 'integer', 'exists:leads,id'],
            'agent_id' => ['required', 'uuid', 'exists:agents,id'],
            'first_name' => ['required', 'string', 'max:150'],
            'last_name' => ['nullable', 'string', 'max:150'],
            'phone' => [
                'required',
                'string',
                'max:30',
                Rule::unique('leads', 'phone')->ignore($leadId)->where(fn ($query) => $query
                    ->where('agent_id', $agentId)
                    ->whereNull('deleted_at')),
            ],
            'email' => ['nullable', 'email', 'max:255'],
            'source' => ['required', 'in:facebook,google,whatsapp,referral,landing,other'],
            'status' => ['sometimes', 'in:nuevo,contactado,perfilado,en_pausa,seguimiento,en_tramite,ganado,no_interesado'],
        ];
    }
}
