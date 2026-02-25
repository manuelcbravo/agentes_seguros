<?php

namespace App\Services\PolicyAi;

use App\Models\Client;

class PolicyAiMapper
{
    public function toWizardDraft(array $aiData, string $agentId): array
    {
        $contractor = $aiData['contractor'] ?? [];
        $insured = $aiData['insured'] ?? [];
        $policy = $aiData['policy'] ?? [];

        $contractorRfc = strtoupper(trim((string) ($contractor['rfc'] ?? '')));
        $insuredRfc = strtoupper(trim((string) ($insured['rfc'] ?? '')));

        $matchedContractor = $contractorRfc !== ''
            ? Client::query()->where('agent_id', $agentId)->whereRaw('UPPER(rfc) = ?', [$contractorRfc])->first(['id'])
            : null;

        $matchedInsured = $insuredRfc !== ''
            ? Client::query()->where('agent_id', $agentId)->whereRaw('UPPER(rfc) = ?', [$insuredRfc])->first(['id'])
            : null;

        return [
            'client' => [
                'first_name' => $this->normalizeName($contractor['first_name'] ?? ''),
                'middle_name' => $this->normalizeName($contractor['middle_name'] ?? ''),
                'last_name' => $this->normalizeName($contractor['last_name'] ?? ''),
                'second_last_name' => $this->normalizeName($contractor['second_last_name'] ?? ''),
                'email' => trim((string) ($contractor['email'] ?? '')),
                'phone' => trim((string) ($contractor['phone'] ?? '')),
                'rfc' => $contractorRfc,
                'address' => '',
            ],
            'insured' => [
                'first_name' => $this->normalizeName($insured['first_name'] ?? ''),
                'middle_name' => $this->normalizeName($insured['middle_name'] ?? ''),
                'last_name' => $this->normalizeName($insured['last_name'] ?? ''),
                'second_last_name' => $this->normalizeName($insured['second_last_name'] ?? ''),
                'rfc' => $insuredRfc,
            ],
            'policy' => [
                'policy_number' => strtoupper(trim((string) ($policy['policy_number'] ?? ''))),
                'coverage_start' => $policy['valid_from'] ?? '',
                'valid_to' => $policy['valid_to'] ?? '',
                'currency' => $policy['currency'] ?? 'MXN',
                'periodicity_hint' => $policy['payment_frequency'] ?? '',
                'risk_premium' => $policy['premium_total'] ?? '',
                'insurance_company_name' => trim((string) ($policy['insurer_name'] ?? '')),
            ],
            'beneficiaries' => collect($aiData['beneficiaries'] ?? [])->map(fn (array $beneficiary) => [
                'name' => $this->normalizeName($beneficiary['name'] ?? ''),
                'percentage' => $beneficiary['percentage'] ?? null,
                'relationship' => $beneficiary['relationship'] ?? '',
            ])->all(),
            'notes' => $aiData['notes'] ?? '',
            'meta' => [
                'matched_client_id' => $matchedContractor?->id,
                'matched_insured_client_id' => $matchedInsured?->id,
            ],
        ];
    }

    private function normalizeName(string $value): string
    {
        return mb_convert_case(trim($value), MB_CASE_TITLE, 'UTF-8');
    }
}
