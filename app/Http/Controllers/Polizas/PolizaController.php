<?php

namespace App\Http\Controllers\Polizas;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertPolizaRequest;
use App\Models\CatPaymentChannel;
use App\Models\Insured;
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
            ->with('insured:id,email,phone')
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $nestedQuery) use ($search): void {
                    $nestedQuery->where('status', 'like', "%{$search}%")
                        ->orWhere('product', 'like', "%{$search}%")
                        ->orWhere('payment_channel', 'like', "%{$search}%")
                        ->orWhere('periodicity', 'like', "%{$search}%");
                });
            })
            ->when($paymentChannel, fn (Builder $query) => $query->where('payment_channel', $paymentChannel))
            ->latest()
            ->get();

        $insureds = Insured::query()
            ->where('agent_id', $agentId)
            ->select(['id', 'email', 'phone'])
            ->orderBy('email')
            ->get();

        $paymentChannels = CatPaymentChannel::query()
            ->select(['code', 'name'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Polizas/index', [
            'polizas' => $polizas,
            'insureds' => $insureds,
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
