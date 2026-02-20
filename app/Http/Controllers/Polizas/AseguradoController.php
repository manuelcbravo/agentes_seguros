<?php

namespace App\Http\Controllers\Polizas;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertAseguradoRequest;
use App\Models\Insured;
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

class AseguradoController extends Controller
{
    public function index(Request $request): Response
    {
        $agentId = (string) auth()->user()->agent_id;
        $search = trim((string) $request->string('search', ''));
        $smokes = $request->string('smokes')->toString();

        $asegurados = Insured::query()
            ->where('agent_id', $agentId)
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $nestedQuery) use ($search): void {
                    $nestedQuery->where('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('occupation', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%");
                });
            })
            ->when($smokes !== '', fn (Builder $query) => $query->where('smokes', $smokes === '1'))
            ->latest()
            ->get();

        return Inertia::render('Asegurados/index', [
            'asegurados' => $asegurados,
            'filters' => ['search' => $search, 'smokes' => $smokes],
            'trackingCatalogs' => $this->trackingCatalogs(),
        ]);
    }

    public function store(UpsertAseguradoRequest $request): RedirectResponse
    {
        $agentId = (string) auth()->user()->agent_id;

        $data = $request->validated();

        $data['agent_id'] = $agentId;
        $data['smokes'] = (bool) ($data['smokes'] ?? false);
        $data['drinks'] = (bool) ($data['drinks'] ?? false);

        if (! empty($data['id'])) {
            $asegurado = Insured::query()
                ->where('agent_id', $agentId)
                ->findOrFail($data['id']);

            $asegurado->update($data);

            return back()->with('success', 'Asegurado actualizado correctamente.');
        }

        unset($data['id']);
        Insured::query()->create($data);

        return back()->with('success', 'Asegurado creado correctamente.');
    }

    public function destroy(string $id): RedirectResponse
    {
        $agentId = (string) auth()->user()->agent_id;

        $asegurado = Insured::query()->findOrFail($id);

        if ((string) $asegurado->agent_id !== $agentId) {
            abort(403);
        }

        $asegurado->delete();

        return back()->with('success', 'Asegurado eliminado correctamente.');
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
