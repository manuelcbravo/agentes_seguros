<?php

namespace App\Http\Controllers\Tracking;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Lead;
use App\Models\Policy;
use App\Models\Tracking\CatTrackingActivityType;
use App\Models\Tracking\CatTrackingChannel;
use App\Models\Tracking\CatTrackingOutcome;
use App\Models\Tracking\CatTrackingPriority;
use App\Models\Tracking\CatTrackingStatus;
use App\Models\Tracking\TrackingActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TrackingActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $agentId = (string) $request->user()->agent_id;
        $trackableClass = $this->resolveTrackableClass((string) $request->string('trackable_type'));
        $trackableId = (string) $request->string('trackable_id');

        abort_unless($trackableClass && $trackableId !== '', 422, 'Trackable inválido.');

        $this->ensureTrackableOwnership($trackableClass, $trackableId, $agentId);

        $items = TrackingActivity::query()
            ->where('agent_id', $agentId)
            ->where('trackable_type', $trackableClass)
            ->where('trackable_id', $trackableId)
            ->with(['activityType:id,key,name', 'channel:id,key,name', 'status:id,key,name', 'priority:id,key,name,level', 'outcome:id,key,name'])
            ->orderByDesc('occurred_at')
            ->get();

        return response()->json([
            'items' => $items,
            'catalogs' => $this->catalogs(),
        ]);
    }

    public function upsert(Request $request): RedirectResponse
    {
        $agentId = (string) $request->user()->agent_id;

        $data = $request->validate([
            'id' => ['nullable', 'uuid'],
            'trackable_type' => ['required', 'string'],
            'trackable_id' => ['required', 'uuid'],
            'activity_type_id' => ['required', Rule::exists('cat_tracking_activity_types', 'id')],
            'channel_id' => ['nullable', Rule::exists('cat_tracking_channels', 'id')],
            'status_id' => ['required', Rule::exists('cat_tracking_statuses', 'id')],
            'priority_id' => ['nullable', Rule::exists('cat_tracking_priorities', 'id')],
            'outcome_id' => ['nullable', Rule::exists('cat_tracking_outcomes', 'id')],
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'occurred_at' => ['nullable', 'date'],
            'next_action_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
            'meta' => ['nullable', 'array'],
        ]);

        $trackableClass = $this->resolveTrackableClass($data['trackable_type']);
        abort_unless($trackableClass, 422, 'Trackable inválido.');
        $this->ensureTrackableOwnership($trackableClass, $data['trackable_id'], $agentId);

        $data['trackable_type'] = $trackableClass;
        $data['agent_id'] = $agentId;
        $data['created_by'] = $request->user()->id;
        $data['occurred_at'] = $data['occurred_at'] ?? now();

        $status = CatTrackingStatus::query()->findOrFail($data['status_id']);

        if ($status->key === 'done' && empty($data['completed_at'])) {
            $data['completed_at'] = now();
        }

        if (! empty($data['id'])) {
            $activity = TrackingActivity::query()->where('agent_id', $agentId)->findOrFail($data['id']);
            $activity->update($data);

            return back()->with('success', 'Seguimiento actualizado correctamente.');
        }

        unset($data['id']);
        TrackingActivity::query()->create($data);

        return back()->with('success', 'Seguimiento creado correctamente.');
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $agentId = (string) $request->user()->agent_id;
        $activity = TrackingActivity::query()->findOrFail($id);

        if ((string) $activity->agent_id !== $agentId) {
            abort(403);
        }

        $activity->delete();

        return back()->with('success', 'Seguimiento eliminado correctamente.');
    }

    public function pendientes(Request $request): Response
    {
        $agentId = (string) $request->user()->agent_id;
        $openStatusId = CatTrackingStatus::query()->where('key', 'open')->value('id');

        $items = TrackingActivity::query()
            ->where('agent_id', $agentId)
            ->when($openStatusId, fn (Builder $query) => $query->where('status_id', $openStatusId))
            ->whereNotNull('next_action_at')
            ->with(['activityType:id,key,name', 'status:id,key,name', 'priority:id,key,name,level'])
            ->orderBy('next_action_at')
            ->get();

        return Inertia::render('Tracking/Pendientes/Index', [
            'items' => $items,
            'catalogs' => $this->catalogs(),
        ]);
    }

    private function resolveTrackableClass(string $trackableType): ?string
    {
        return match ($trackableType) {
            'Lead', Lead::class => Lead::class,
            'Client', Client::class => Client::class,
            'Policy', 'Poliza', Policy::class => Policy::class,
            default => null,
        };
    }

    private function ensureTrackableOwnership(string $trackableClass, string $trackableId, string $agentId): void
    {
        $exists = $trackableClass::query()
            ->whereKey($trackableId)
            ->where('agent_id', $agentId)
            ->exists();

        abort_unless($exists, 403);
    }

    private function catalogs(): array
    {
        return [
            'activityTypes' => CatTrackingActivityType::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'key', 'name']),
            'channels' => CatTrackingChannel::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'key', 'name']),
            'statuses' => CatTrackingStatus::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'key', 'name']),
            'priorities' => CatTrackingPriority::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'key', 'name', 'level']),
            'outcomes' => CatTrackingOutcome::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'key', 'name']),
        ];
    }
}
