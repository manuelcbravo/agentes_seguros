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
        $agentId = $this->resolvedAgentId();

        return [
            'id' => ['nullable', 'uuid', 'exists:leads,id'],
            'agent_id' => ['nullable', 'uuid', 'exists:agents,id'],
            'first_name' => ['required', 'string', 'max:150'],
            'middle_name' => ['nullable', 'string', 'max:150'],
            'last_name' => ['required', 'string', 'max:150'],
            'second_last_name' => ['nullable', 'string', 'max:150'],
            'phone' => [ 'nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'source' => ['required', 'in:facebook,google,whatsapp,referral,landing,other'],
            'status' => ['sometimes', 'in:nuevo,contactado,perfilado,en_pausa,seguimiento,en_tramite,ganado,no_interesado'],
        ];
    }

    private function resolvedAgentId(): ?string
    {
        if ($this->filled('agent_id')) {
            return (string) $this->input('agent_id');
        }

        /** @var User|null $user */
        $user = $this->user();
        $user?->loadMissing('agent');

        return $user?->agent?->id;
    }
}
