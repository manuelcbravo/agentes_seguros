<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpsertClientRequest;
use App\Models\Client;
use App\Models\File;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use App\Models\Tracking\CatTrackingActivityType;
use App\Models\Tracking\CatTrackingChannel;
use App\Models\Tracking\CatTrackingOutcome;
use App\Models\Tracking\CatTrackingPriority;
use App\Models\Tracking\CatTrackingStatus;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Client::query()
            ->select([
                'id',
                'first_name',
                'last_name',
                'email',
                'phone',
                'avatar_path',
                'is_active',
                'created_at',
            ]);

        if (Schema::hasColumn('clients', 'agent_id')) {
            $user = $request->user();
            $user?->loadMissing('agent');

            $agentId = $user?->agent_id ?? $user?->agent?->id;

            if (! $agentId) {
                $query->whereRaw('1 = 0');
            } else {
                $query->where('agent_id', $agentId);
            }
        }

        return Inertia::render('clients/index', [
            'clients' => $query->latest()->get(),
            'files' => File::query()
                ->select(['id', 'disk', 'path', 'original_name', 'mime_type', 'size', 'related_table', 'related_uuid', 'created_at'])
                ->where('related_table', 'clients')
                ->latest()
                ->get(),
            'trackingCatalogs' => $this->trackingCatalogs(),
        ]);
    }

    public function store(UpsertClientRequest $request): RedirectResponse
    {
        $agentId = (string) auth()->user()->agent_id;
        $data = $request->validated();
        $client = isset($data['id']) ? Client::query()->findOrFail($data['id']) : new Client();

        $client->fill([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'is_active' => $data['is_active'],
            'agent_id' => $agentId,
        ]);

        if (! empty($data['avatar_path'])) {
            $client->avatar_path = $data['avatar_path'];
        }

        if ($request->hasFile('avatar')) {
            if ($client->avatar_path && str_starts_with($client->avatar_path, 'clients/avatars/')) {
                Storage::disk('public')->delete($client->avatar_path);
            }

            $client->avatar_path = $request->file('avatar')->store('clients/avatars', 'public');
        }

        $client->save();

        return back()->with('success', isset($data['id']) ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.');
    }

    public function destroy(Client $client): RedirectResponse
    {
        if ($client->avatar_path && str_starts_with($client->avatar_path, 'clients/avatars/')) {
            Storage::disk('public')->delete($client->avatar_path);
        }

        $client->delete();

        return back()->with('success', 'Cliente eliminado correctamente.');
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
