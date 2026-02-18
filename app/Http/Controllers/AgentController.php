<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpsertAgentRequest;
use App\Models\Agent;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search', ''));

        return Inertia::render('agents/index', [
            'filters' => [
                'search' => $search,
            ],
            'agents' => Agent::query()
                ->with('user:id,name,email')
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($nestedQuery) use ($search) {
                        $nestedQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%")
                            ->orWhere('license_id', 'like', "%{$search}%");
                    });
                })
                ->select([
                    'id',
                    'user_id',
                    'name',
                    'phone',
                    'email',
                    'license_id',
                    'commission_percent',
                    'city',
                    'state',
                    'created_at',
                ])
                ->latest()
                ->paginate(10)
                ->withQueryString(),
            'users' => User::query()
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
        ]);
    }

    public function store(UpsertAgentRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $agent = isset($data['id']) ? Agent::query()->findOrFail($data['id']) : new Agent();

        $agent->fill([
            'user_id' => $data['user_id'],
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'license_id' => $data['license_id'] ?? null,
            'commission_percent' => $data['commission_percent'] ?? null,
            'photo_path' => $data['photo_path'] ?? null,
            'city' => $data['city'] ?? null,
            'state' => $data['state'] ?? null,
        ]);

        $agent->save();

        return back()->with('success', isset($data['id']) ? 'Agente actualizado correctamente.' : 'Agente creado correctamente.');
    }

    public function destroy(Agent $agent): RedirectResponse
    {
        $agent->delete();

        return back()->with('success', 'Agente eliminado correctamente.');
    }
}
