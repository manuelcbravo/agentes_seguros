<?php

namespace App\Http\Controllers\Polizas;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertPolizaRequest;
use App\Models\CatPaymentChannel;
use App\Models\File;
use App\Models\Policy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Models\Tracking\CatTrackingActivityType;
use App\Models\Tracking\CatTrackingChannel;
use App\Models\Tracking\CatTrackingOutcome;
use App\Models\Tracking\CatTrackingPriority;
use App\Models\Tracking\CatTrackingStatus;
use Inertia\Inertia;
use Inertia\Response;

class PolizaController extends Controller
{
    public function index(Request $request): Response
    {
        $agentId = (string) auth()->user()->agent_id;
        $search = trim((string) $request->string('search', ''));
        $paymentChannel = $request->string('payment_channel')->toString() ?: null;

        $polizas = Policy::query()
            ->where('agent_id', $agentId)
            ->with([
                'client:id,first_name,middle_name,last_name,second_last_name',
                'insured:id,first_name,middle_name,last_name,second_last_name,email,phone',
                'insuranceCompany:id,name',
                'productCatalog:id,name',
            ])
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $nestedQuery) use ($search): void {
                    $nestedQuery->where('status', 'like', "%{$search}%")
                        ->orWhere('product', 'like', "%{$search}%")
                        ->orWhere('payment_channel', 'like', "%{$search}%")
                        ->orWhere('periodicity', 'like', "%{$search}%")
                        ->orWhereHas('client', function (Builder $clientQuery) use ($search): void {
                            $clientQuery
                                ->where('first_name', 'like', "%{$search}%")
                                ->orWhere('middle_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('second_last_name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('insured', function (Builder $insuredQuery) use ($search): void {
                            $insuredQuery
                                ->where('first_name', 'like', "%{$search}%")
                                ->orWhere('middle_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('second_last_name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('insuranceCompany', fn (Builder $insuranceQuery) => $insuranceQuery->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('productCatalog', fn (Builder $productQuery) => $productQuery->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($paymentChannel, fn (Builder $query) => $query->where('payment_channel', $paymentChannel))
            ->latest()
            ->get();

        $paymentChannels = CatPaymentChannel::query()
            ->select(['code', 'name'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Polizas/index', [
            'polizas' => $polizas->map(fn (Policy $policy) => [
                'id' => $policy->id,
                'status' => $policy->status,
                'policy_number' => $policy->policy_number,
                'payment_channel' => $policy->payment_channel,
                'risk_premium' => $policy->risk_premium,
                'client_name' => $policy->client?->full_name,
                'insured_name' => $policy->insured?->full_name,
                'insurance_company_name' => $policy->insuranceCompany?->name,
                'product_name' => $policy->productCatalog?->name ?? $policy->product,
            ]),
            'paymentChannels' => $paymentChannels,
            'filters' => ['search' => $search, 'payment_channel' => $paymentChannel],
            'trackingCatalogs' => $this->trackingCatalogs(),
        ]);
    }

    public function store(UpsertPolizaRequest $request): RedirectResponse
    {
        $agentId = (string) auth()->user()->agent_id;

        $data = $request->validated();

        $data['agent_id'] = $agentId;

        if (! empty($data['id'])) {
            $poliza = Policy::query()
                ->where('agent_id', $agentId)
                ->findOrFail($data['id']);

            $poliza->update($data);

            return back()->with('success', 'Póliza actualizada correctamente.');
        }

        unset($data['id']);
        Policy::query()->create($data);

        return back()->with('success', 'Póliza creada correctamente.');
    }

    public function destroy(string $id): RedirectResponse
    {
        $agentId = (string) auth()->user()->agent_id;

        $poliza = Policy::query()->findOrFail($id);

        if ((string) $poliza->agent_id !== $agentId) {
            abort(403);
        }

        $poliza->delete();

        return back()->with('success', 'Póliza eliminada correctamente.');
    }


    public function sheet(Request $request, string $policy): Response
    {
        $agentId = (string) $request->user()->agent_id;

        $policyModel = Policy::query()
            ->with([
                'client:id,first_name,middle_name,last_name,second_last_name,rfc,phone,email,street,ext_number,int_number,neighborhood,city,state,country,postal_code',
                'insured:id,first_name,middle_name,last_name,second_last_name,rfc,birthday,phone,email,address',
                'insuranceCompany:id,name',
                'productCatalog:id,name',
                'periodicityCatalog:id,name',
                'currencyCatalog:id,code,name',
                'beneficiaries:id,first_name,middle_name,last_name,second_last_name,rfc,relationship,relationship_id',
                'beneficiaries.relationshipCatalog:id,name',
            ])
            ->findOrFail($policy);

        if ((string) $policyModel->agent_id !== $agentId) {
            abort(403);
        }

        $files = File::query()
            ->where('related_uuid', $policyModel->id)
            ->whereIn('related_table', ['policies', 'polizas'])
            ->latest()
            ->get(['id', 'uuid', 'original_name', 'size', 'created_at']);

        $beneficiaries = $policyModel->beneficiaries->map(function ($beneficiary) {
            return [
                'id' => $beneficiary->id,
                'full_name' => $beneficiary->full_name,
                'rfc' => $beneficiary->rfc,
                'relationship' => $beneficiary->relationshipCatalog?->name ?? $beneficiary->relationship,
                'percentage' => round((float) ($beneficiary->pivot?->percentage ?? 0), 2),
            ];
        })->values();

        return Inertia::render('Polizas/Sheet', [
            'policy' => [
                'id' => $policyModel->id,
                'policy_number' => $policyModel->policy_number,
                'status' => $policyModel->status,
                'coverage_start' => optional($policyModel->coverage_start)?->toDateString(),
                'product' => $policyModel->product,
                'payment_channel' => $policyModel->payment_channel,
                'periodicity' => $policyModel->periodicityCatalog?->name ?? $policyModel->periodicity,
                'month' => $policyModel->month,
                'currency' => $policyModel->currencyCatalog?->code ?? $policyModel->currency,
                'risk_premium' => $policyModel->risk_premium,
                'fractional_premium' => $policyModel->fractional_premium,
            ],
            'contractor' => $policyModel->client,
            'insured' => $policyModel->insured,
            'insuranceCompany' => $policyModel->insuranceCompany,
            'productCatalog' => $policyModel->productCatalog,
            'beneficiaries' => $beneficiaries,
            'beneficiariesTotal' => round((float) $beneficiaries->sum('percentage'), 2),
            'files' => $files->map(fn (File $file) => [
                'id' => $file->id,
                'uuid' => $file->uuid,
                'original_name' => $file->original_name,
                'size' => $file->size,
                'created_at' => $file->created_at?->toISOString(),
                'url' => $file->url,
            ])->values(),
        ]);
    }



    private function trackingCatalogs(): array
    {
        return [
            'activityTypes' => CatTrackingActivityType::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'key', 'name']),
            'channels' => CatTrackingChannel::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'key', 'name']),
            'statuses' => CatTrackingStatus::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'key', 'name']),
            'priorities' => CatTrackingPriority::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'key', 'name']),
            'outcomes' => CatTrackingOutcome::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'key', 'name']),
        ];
    }
}
