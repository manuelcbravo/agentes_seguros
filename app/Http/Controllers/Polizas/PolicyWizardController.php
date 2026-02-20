<?php

namespace App\Http\Controllers\Polizas;

use App\Http\Controllers\Controller;
use App\Models\Beneficiary;
use App\Models\CatCurrency;
use App\Models\CatInsuranceCompany;
use App\Models\CatPaymentChannel;
use App\Models\CatRelationship;
use App\Models\Client;
use App\Models\Insured;
use App\Models\Policy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PolicyWizardController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Polizas/Wizard/Index', $this->wizardProps());
    }

    public function edit(string $policyId): Response
    {
        $policy = $this->ownedPolicy($policyId);

        return Inertia::render('Polizas/Wizard/Index', $this->wizardProps($policy));
    }

    public function saveStep1(Request $request): RedirectResponse
    {
        $agentId = (string) auth()->user()->agent_id;
        $data = $request->validate([
            'policy_id' => ['nullable', 'uuid'],
            'client_id' => ['required', 'uuid', function ($attribute, $value, $fail) use ($agentId) {
                if (! Client::query()->where('agent_id', $agentId)->whereKey($value)->exists()) {
                    $fail('Selecciona un cliente válido.');
                }
            }],
        ]);

        $policy = $this->resolveDraftPolicy($data['policy_id'] ?? null);
        $policy->update([
            'client_id' => $data['client_id'],
            'status' => Policy::STATUS_DRAFT,
        ]);

        return to_route('polizas.wizard.edit', $policy->id)->with('success', 'Paso 1 guardado.');
    }

    public function saveStep2(Request $request): RedirectResponse
    {
        $agentId = (string) auth()->user()->agent_id;

        $data = $request->validate([
            'policy_id' => ['required', 'uuid'],
            'same_as_client' => ['required', 'boolean'],
            'insured_id' => ['nullable', 'uuid'],
            'insured' => ['nullable', 'array'],
            'insured.email' => ['nullable', 'email', 'max:255'],
            'insured.phone' => ['nullable', 'string', 'max:30'],
            'insured.rfc' => ['nullable', 'string', 'max:20'],
            'insured.birthday' => ['nullable', 'date'],
            'insured.occupation' => ['nullable', 'string', 'max:150'],
            'insured.company_name' => ['nullable', 'string', 'max:150'],
        ]);

        $policy = $this->ownedPolicy($data['policy_id']);

        $insuredId = DB::transaction(function () use ($data, $policy, $agentId) {
            if (($data['same_as_client'] ?? false) === true) {
                $client = Client::query()->where('agent_id', $agentId)->findOrFail($policy->client_id);

                $insured = Insured::query()
                    ->where('agent_id', $agentId)
                    ->where('client_id', $client->id)
                    ->first();

                if (! $insured) {
                    $insured = Insured::query()->create([
                        'agent_id' => $agentId,
                        'client_id' => $client->id,
                        'email' => $client->email,
                        'phone' => $client->phone,
                        'rfc' => $client->rfc,
                        'birthday' => $client->birth_date?->toDateString() ?? now()->toDateString(),
                    ]);
                }

                return (string) $insured->id;
            }

            if (! empty($data['insured_id'])) {
                $insured = Insured::query()->where('agent_id', $agentId)->findOrFail($data['insured_id']);

                return (string) $insured->id;
            }

            $insuredPayload = $data['insured'] ?? [];

            $insured = Insured::query()->create([
                'agent_id' => $agentId,
                'client_id' => $policy->client_id,
                'birthday' => $insuredPayload['birthday'] ?? now()->toDateString(),
                'email' => $insuredPayload['email'] ?? null,
                'phone' => $insuredPayload['phone'] ?? null,
                'rfc' => $insuredPayload['rfc'] ?? null,
                'occupation' => $insuredPayload['occupation'] ?? null,
                'company_name' => $insuredPayload['company_name'] ?? null,
            ]);

            return (string) $insured->id;
        });

        $policy->update([
            'insured_id' => $insuredId,
            'status' => Policy::STATUS_DRAFT,

        ]);

        return back()->with('success', 'Paso 2 guardado.');
    }

    public function saveStep3(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'policy_id' => ['required', 'uuid'],
            'payment_channel' => ['nullable', 'integer'],
            'product' => ['nullable', 'string', 'max:160'],
            'coverage_start' => ['nullable', 'date'],
            'risk_premium' => ['nullable', 'numeric', 'min:0'],
            'fractional_premium' => ['nullable', 'numeric', 'min:0'],
            'periodicity' => ['nullable', 'string', 'max:120'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'currency' => ['nullable', 'integer'],
            'currency_id' => ['nullable', 'uuid'],
        ]);

        $policy = $this->ownedPolicy($data['policy_id']);
        unset($data['policy_id']);

        $policy->update(array_merge($data, ['status' => Policy::STATUS_DRAFT]));

        return back()->with('success', 'Paso 3 guardado.');
    }

    public function saveStep4(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'policy_id' => ['required', 'uuid'],
            'beneficiaries' => ['array'],
            'beneficiaries.*.id' => ['nullable', 'uuid'],
            'beneficiaries.*.name' => ['required', 'string', 'max:255'],
            'beneficiaries.*.relationship_id' => ['nullable', 'uuid'],
            'beneficiaries.*.benefit_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $policy = $this->ownedPolicy($data['policy_id']);
        $agentId = (string) auth()->user()->agent_id;

        DB::transaction(function () use ($data, $policy, $agentId) {
            $keepIds = [];

            foreach ($data['beneficiaries'] ?? [] as $item) {
                $beneficiary = Beneficiary::query()
                    ->where('policy_id', $policy->id)
                    ->when(! empty($item['id']), fn (Builder $q) => $q->whereKey($item['id']))
                    ->first();

                if (! $beneficiary) {
                    $beneficiary = new Beneficiary();
                    $beneficiary->policy_id = $policy->id;
                    $beneficiary->agent_id = $agentId;
                }

                $beneficiary->fill([
                    'name' => $item['name'],
                    'relationship_id' => $item['relationship_id'] ?? null,
                    'benefit_percentage' => $item['benefit_percentage'],
                ]);

                $beneficiary->save();
                $keepIds[] = $beneficiary->id;
            }

            Beneficiary::query()
                ->where('policy_id', $policy->id)
                ->whereNotIn('id', $keepIds)
                ->delete();
        });

        $policy->update(['status' => Policy::STATUS_DRAFT]);

        return back()->with('success', 'Paso 4 guardado.');
    }

    public function saveAndExit(string $policyId): RedirectResponse
    {
        $policy = $this->ownedPolicy($policyId);
        $policy->update(['status' => Policy::STATUS_DRAFT]);

        return to_route('polizas.index')->with('success', 'Póliza guardada como borrador.');
    }

    public function finish(string $policyId): RedirectResponse
    {
        $policy = $this->ownedPolicy($policyId);

        $total = (float) Beneficiary::query()
            ->where('policy_id', $policy->id)
            ->sum('benefit_percentage');

        if (round($total, 2) !== 100.0) {
            return back()->withErrors(['beneficiaries' => 'Los beneficiarios deben sumar 100%.']);
        }

        $policy->update([
            'status' => Policy::STATUS_ACTIVE,
            'coverage_start' => $policy->coverage_start ?? now()->toDateString(),
        ]);

        return to_route('polizas.index')->with('success', 'Póliza terminada y activada correctamente.');
    }

    private function resolveDraftPolicy(?string $policyId): Policy
    {
        if ($policyId) {
            return $this->ownedPolicy($policyId);
        }

        $agentId = (string) auth()->user()->agent_id;
        $insuredId = Insured::query()->where('agent_id', $agentId)->value('id');

        if (! $insuredId) {
            $insuredId = Insured::query()->create([
                'agent_id' => $agentId,
                'birthday' => now()->toDateString(),
            ])->id;
        }

        return Policy::query()->create([
            'agent_id' => $agentId,
            'status' => Policy::STATUS_DRAFT,
            'insured_id' => $insuredId,
        ]);
    }

    private function ownedPolicy(string $policyId): Policy
    {
        $policy = Policy::query()->findOrFail($policyId);

        if ((string) $policy->agent_id !== (string) auth()->user()->agent_id) {
            abort(403);
        }

        return $policy;
    }

    private function wizardProps(?Policy $policy = null): array
    {
        $agentId = (string) auth()->user()->agent_id;

        $policy?->load(['beneficiaries:id,policy_id,name,relationship_id,benefit_percentage', 'client:id,first_name,middle_name,last_name,second_last_name,email,phone,rfc', 'insured:id,client_id,email,phone,rfc,birthday,occupation,company_name']);

        return [
            'policy' => $policy,
            'clients' => Client::query()
                ->where('agent_id', $agentId)
                ->select(['id', 'first_name', 'middle_name', 'last_name', 'second_last_name', 'email', 'phone', 'rfc'])
                ->orderBy('first_name')
                ->get(),
            'insureds' => Insured::query()
                ->where('agent_id', $agentId)
                ->select(['id', 'client_id', 'email', 'phone', 'rfc', 'birthday', 'occupation', 'company_name'])
                ->latest()
                ->get(),
            'relationships' => CatRelationship::query()->select(['id', 'name'])->orderBy('name')->get(),
            'paymentChannels' => CatPaymentChannel::query()->select(['code', 'name'])->orderBy('name')->get(),
            'currencies' => CatCurrency::query()->select(['id', 'name'])->orderBy('name')->get(),
            'insuranceCompanies' => CatInsuranceCompany::query()->select(['id', 'name'])->orderBy('name')->get(),
        ];
    }
}
