<?php

namespace App\Http\Controllers\Polizas;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertPolizaRequest;
use App\Models\CatPaymentChannel;
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
