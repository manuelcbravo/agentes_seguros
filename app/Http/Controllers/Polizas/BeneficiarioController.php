<?php

namespace App\Http\Controllers\Polizas;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertBeneficiarioRequest;
use App\Models\Beneficiary;
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

class BeneficiarioController extends Controller
{
    public function index(Request $request): Response
    {
        $agentId = (string) auth()->user()->agent_id;
        $search = trim((string) $request->string('search', ''));
        $policyId = $request->string('policy_id')->toString() ?: null;

        $beneficiarios = Beneficiary::query()
            ->where('agent_id', $agentId)
            ->with('policy:id,product,status')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $nestedQuery) use ($search): void {
                    $nestedQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('rfc', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%")
                        ->orWhere('occupation', 'like', "%{$search}%");
                });
            })
            ->when($policyId, fn (Builder $query) => $query->where('policy_id', $policyId))
            ->latest()
            ->get();

        $polizas = Policy::query()
            ->where('agent_id', $agentId)
            ->select(['id', 'product', 'status'])
            ->orderBy('product')
            ->get();

        return Inertia::render('Beneficiarios/index', [
            'beneficiarios' => $beneficiarios,
            'polizas' => $polizas,
            'filters' => ['search' => $search, 'policy_id' => $policyId],
            'trackingCatalogs' => $this->trackingCatalogs(),
        ]);
    }

    public function store(UpsertBeneficiarioRequest $request): RedirectResponse
    {
        $agentId = (string) auth()->user()->agent_id;

        $data = $request->validated();

        $data['agent_id'] = $agentId;
        $data['smokes'] = (bool) ($data['smokes'] ?? false);
        $data['drinks'] = (bool) ($data['drinks'] ?? false);

        if (! empty($data['id'])) {
            $beneficiario = Beneficiary::query()
                ->where('agent_id', $agentId)
                ->findOrFail($data['id']);

            $beneficiario->update($data);

            return back()->with('success', 'Beneficiario actualizado correctamente.');
        }

        unset($data['id']);
        Beneficiary::query()->create($data);

        return back()->with('success', 'Beneficiario creado correctamente.');
    }

    public function destroy(string $id): RedirectResponse
    {
        $agentId = (string) auth()->user()->agent_id;

        $beneficiario = Beneficiary::query()->findOrFail($id);

        if ((string) $beneficiario->agent_id !== $agentId) {
            abort(403);
        }

        $beneficiario->delete();

        return back()->with('success', 'Beneficiario eliminado correctamente.');
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
