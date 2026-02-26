<?php

namespace App\Http\Controllers\Polizas;

use App\Http\Controllers\Controller;
use App\Http\Requests\Polizas\SaveStep3PolicyWizardRequest;
use App\Http\Requests\Polizas\SaveStep4PolicyWizardRequest;
use App\Http\Requests\UpsertAseguradoRequest;
use App\Http\Requests\UpsertClientRequest;
use App\Models\Beneficiary;
use App\Models\CatCurrency;
use App\Models\CatInsuranceCompany;
use App\Models\CatPaymentChannel;
use App\Models\CatRelationship;
use App\Models\Client;
use App\Models\Insured;
use App\Models\CatPeriodicity;
use App\Models\Policy;
use App\Models\PolicyWizardDraft;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PolicyWizardController extends Controller
{
    public function create(Request $request): Response
    {
        $preselectedClient = null;
        $clientId = $request->query('client_id');

        if (is_string($clientId) && $clientId !== '') {
            $preselectedClient = Client::query()
                ->where('agent_id', (string) auth()->user()->agent_id)
                ->find($clientId);

            if (! $preselectedClient) {
                session()->flash('error', 'El cliente preseleccionado no existe o no pertenece a tu cuenta.');
            }
        }

        return Inertia::render('Polizas/Wizard/Index', $this->wizardProps(null, $preselectedClient));
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
            'client_id' => ['nullable', 'uuid', function ($attribute, $value, $fail) use ($agentId) {
                if (! Client::query()->where('agent_id', $agentId)->whereKey($value)->exists()) {
                    $fail('Selecciona un cliente válido.');
                }
            }],
            'client' => ['nullable', 'array'],
            ...collect(UpsertClientRequest::wizardRules())
                ->mapWithKeys(fn ($rules, $key) => ["client.{$key}" => $rules])
                ->all(),
        ]);

        $policy = $this->resolveDraftPolicy($data['policy_id'] ?? null);

        if (! empty($data['client_id'])) {
            $policy->update([
                'client_id' => $data['client_id'],
                'status' => Policy::STATUS_DRAFT,
                'current_step' => 1,
            ]);

            return to_route('polizas.wizard.edit', $policy->id)->with('success', 'Paso 1 guardado.');
        }

        if (empty($data['client'])) {
            return back()->withErrors(['client' => 'Completa la información del contratante.']);
        }

        $clientPayload = $data['client'];

        $client = Client::query()->create([
            'agent_id' => $agentId,
            'first_name' => $clientPayload['first_name'],
            'middle_name' => $clientPayload['middle_name'] ?? null,
            'last_name' => $clientPayload['last_name'],
            'second_last_name' => $clientPayload['second_last_name'] ?? null,
            'email' => $clientPayload['email'] ?? null,
            'phone' => $clientPayload['phone'] ?? null,
            'rfc' => $clientPayload['rfc'] ?? null,
            'street' => $clientPayload['address'] ?? null,
            'is_active' => true,
        ]);

        $policy->update([
            'client_id' => $client->id,
            'status' => Policy::STATUS_DRAFT,
            'current_step' => 1,
        ]);

        return to_route('polizas.wizard.edit', $policy->id)->with('success', 'Paso 1 guardado y contratante creado correctamente');
    }

    public function storeClient(Request $request): JsonResponse
    {
        $agentId = (string) auth()->user()->agent_id;

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:150'],
            'middle_name' => ['nullable', 'string', 'max:150'],
            'last_name' => ['required', 'string', 'max:150'],
            'second_last_name' => ['nullable', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'rfc' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        if (($data['email'] ?? null) || ($data['phone'] ?? null)) {
            $exists = Client::query()
                ->where('agent_id', $agentId)
                ->where(function (Builder $query) use ($data) {
                    if (! empty($data['email'])) {
                        $query->orWhere('email', $data['email']);
                    }

                    if (! empty($data['phone'])) {
                        $query->orWhere('phone', $data['phone']);
                    }
                })
                ->exists();

            if ($exists) {
                return response()->json(['message' => 'Ya existe un cliente con ese email o teléfono.'], 422);
            }
        }

        $client = Client::query()->create([
            'agent_id' => $agentId,
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'second_last_name' => $data['second_last_name'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'rfc' => $data['rfc'] ?? null,
            'street' => $data['address'] ?? null,
            'is_active' => true,
        ]);

        return response()->json([
            'id' => $client->id,
            'full_name' => $client->full_name,
            'phone' => $client->phone,
            'email' => $client->email,
            'rfc' => $client->rfc,
            'first_name' => $client->first_name,
            'middle_name' => $client->middle_name,
            'last_name' => $client->last_name,
            'second_last_name' => $client->second_last_name,
            'address' => $client->street,
        ]);
    }

    public function saveStep2(Request $request): RedirectResponse
    {
        $agentId = (string) auth()->user()->agent_id;

        $data = $request->validate([
            'policy_id' => ['required', 'uuid'],
            'same_as_client' => ['required', 'boolean'],
            'insured_id' => ['nullable', 'uuid'],
            'insured' => ['nullable', 'array'],
            ...collect((new UpsertAseguradoRequest())->rules())
                ->except(['id', 'client_id'])
                ->mapWithKeys(fn ($rules, $key) => ["insured.{$key}" => $rules])
                ->all(),
        ]);

        $policy = $this->ownedPolicy($data['policy_id']);

        if (($data['same_as_client'] ?? false) === false && empty($data['insured_id']) && empty($data['insured'])) {
            return back()->withErrors(['insured' => 'Completa la información del asegurado.']);
        }

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
                        'first_name' => $client->first_name,
                        'middle_name' => $client->middle_name,
                        'last_name' => $client->last_name,
                        'second_last_name' => $client->second_last_name,
                        'email' => $client->email,
                        'phone' => $client->phone,
                        'rfc' => $client->rfc,
                        'birthday' => $client->birth_date?->toDateString() ?? now()->toDateString(),
                        'address' => $client->street,
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
                'first_name' => $insuredPayload['first_name'],
                'middle_name' => $insuredPayload['middle_name'] ?? null,
                'last_name' => $insuredPayload['last_name'],
                'second_last_name' => $insuredPayload['second_last_name'] ?? null,
                'birthday' => $insuredPayload['birthday'],
                'age_current' => $insuredPayload['age_current'] ?? null,
                'email' => $insuredPayload['email'] ?? null,
                'phone' => $insuredPayload['phone'] ?? null,
                'rfc' => $insuredPayload['rfc'] ?? null,
                'address' => $insuredPayload['address'] ?? null,
                'occupation' => $insuredPayload['occupation'] ?? null,
                'company_name' => $insuredPayload['company_name'] ?? null,
                'approx_income' => $insuredPayload['approx_income'] ?? null,
                'medical_history' => $insuredPayload['medical_history'] ?? null,
                'main_savings_goal' => $insuredPayload['main_savings_goal'] ?? null,
                'personal_interests' => $insuredPayload['personal_interests'] ?? null,
                'personal_likes' => $insuredPayload['personal_likes'] ?? null,
                'smokes' => (bool) ($insuredPayload['smokes'] ?? false),
                'drinks' => (bool) ($insuredPayload['drinks'] ?? false),
                'personality' => $insuredPayload['personality'] ?? null,
                'children_count' => $insuredPayload['children_count'] ?? 0,
            ]);

            return (string) $insured->id;
        });

        $policy->update([
            'insured_id' => $insuredId,
            'status' => Policy::STATUS_DRAFT,
            'current_step' => max((int) ($policy->current_step ?? 1), 2),
        ]);

        return back()->with('success', (($data['same_as_client'] ?? false) === false && empty($data['insured_id'])) ? 'Paso 2 guardado y asegurado creado correctamente' : 'Paso 2 guardado.');
    }

    public function saveStep3(SaveStep3PolicyWizardRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $policy = $this->ownedPolicy($data['policy_id']);
        $product = Product::query()->findOrFail($data['product_id']);
        unset($data['policy_id']);

        $policy->update(array_merge($data, [
            'product' => $product->name,
            'status' => Policy::STATUS_DRAFT,
            'current_step' => max((int) ($policy->current_step ?? 1), 3),
            'month' => (int) $data['month'],
        ]));

        return back()->with('success', 'Paso 3 guardado.');
    }

    public function saveStep4(SaveStep4PolicyWizardRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $policy = $this->ownedPolicy($data['policy_id']);

        $syncPayload = collect($data['beneficiaries'])
            ->mapWithKeys(fn (array $item) => [
                $item['beneficiary_id'] => [
                    'percentage' => round((float) $item['percentage'], 2),
                    'relationship_id' => (int) $item['relationship_id'],
                ],
            ])
            ->all();

        $policy->beneficiaries()->sync($syncPayload);

        $policy->update([
            'status' => Policy::STATUS_DRAFT,
            'current_step' => max((int) ($policy->current_step ?? 1), 4),
        ]);

        return back()->with('success', 'Paso 4 guardado.');
    }

    public function saveAndExit(Request $request, ?string $policyId = null): RedirectResponse
    {
        $policy = $this->resolveDraftPolicy($policyId ?: $request->input('policy_id'));

        $step = (int) $request->input('current_step', 1);
        $policy->update([
            'status' => Policy::STATUS_DRAFT,
            'current_step' => max(1, min(4, $step)),
        ]);

        return to_route('polizas.index')->with('success', 'Borrador guardado.');
    }

    public function finish(string $policyId): RedirectResponse
    {
        $policy = $this->ownedPolicy($policyId);

        $total = (float) $policy->beneficiaries()->sum('beneficiary_policy.percentage');

        if (abs(round($total, 2) - 100.0) > 0.01) {
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
            'current_step' => 1,
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

    private function serializeClient(?Client $client): ?array
    {
        if (! $client) {
            return null;
        }

        return [
            'id' => $client->id,
            'full_name' => $client->full_name,
            'first_name' => $client->first_name,
            'middle_name' => $client->middle_name,
            'last_name' => $client->last_name,
            'second_last_name' => $client->second_last_name,
            'phone' => $client->phone,
            'email' => $client->email,
            'rfc' => $client->rfc,
            'address' => $client->street,
        ];
    }

    private function wizardProps(?Policy $policy = null, ?Client $preselectedClient = null): array
    {
        $policy?->load(['beneficiaries:id,first_name,middle_name,last_name,second_last_name,rfc,phone,email', 'client:id,first_name,middle_name,last_name,second_last_name,email,phone,rfc,street', 'insured:id,client_id,first_name,middle_name,last_name,second_last_name,email,phone,rfc,birthday,age_current,address,occupation,company_name,approx_income,medical_history,main_savings_goal,personal_interests,personal_likes,smokes,drinks,personality,children_count']);

        $selectedClient = $preselectedClient;

        if (! $selectedClient && $policy?->client) {
            $selectedClient = $policy->client;
        }

        $wizardDraft = PolicyWizardDraft::query()->where('agent_id', (string) auth()->user()->agent_id)->first();

        return [
            'policy' => $policy,
            'wizardDraft' => $wizardDraft?->data,
            'initialStep' => (int) ($policy?->current_step ?? 1),
            'preselectedClient' => $this->serializeClient($selectedClient),
            'insureds' => Insured::query()
                ->where('agent_id', (string) auth()->user()->agent_id)
                ->select(['id', 'client_id', 'first_name', 'middle_name', 'last_name', 'second_last_name', 'email', 'phone', 'rfc', 'birthday', 'age_current', 'address', 'occupation', 'company_name', 'approx_income', 'medical_history', 'main_savings_goal', 'personal_interests', 'personal_likes', 'smokes', 'drinks', 'personality', 'children_count'])
                ->latest()
                ->get(),
            'relationships' => CatRelationship::query()->select(['id', 'name'])->orderBy('name')->get(),
            'beneficiariesCatalog' => Beneficiary::query()
                ->where('agent_id', (string) auth()->user()->agent_id)
                ->select(['id', 'first_name', 'middle_name', 'last_name', 'second_last_name', 'rfc', 'phone', 'email'])
                ->orderBy('first_name')
                ->limit(200)
                ->get(),
            'paymentChannels' => CatPaymentChannel::query()->select(['id', 'name'])->orderBy('name')->get(),
            'currencies' => CatCurrency::query()->select(['id', 'name'])->orderBy('name')->get(),
            'periodicities' => CatPeriodicity::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'code']),
            'insuranceCompanies' => CatInsuranceCompany::query()->select(['id', 'name'])->orderBy('name')->get(),
            'products' => Product::query()->select(['id', 'insurance_company_id', 'name'])->orderBy('name')->get(),
        ];
    }
}
