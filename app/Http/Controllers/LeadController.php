<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateLeadStatusRequest;
use App\Http\Requests\UpsertLeadRequest;
use App\Models\Agent;
use App\Models\Client;
use App\Models\File;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    private const MAIN_KANBAN_STATUSES = [
        'nuevo',
        'contactado',
        'perfilado',
        'en_pausa',
        'seguimiento',
        'en_tramite',
    ];

    private const ALL_STATUSES = [
        ...self::MAIN_KANBAN_STATUSES,
        'ganado',
        'no_interesado',
    ];

    public function index(Request $request): Response
    {
        return $this->renderLeadTable($request, 'leads/index', 'Leads', null);
    }

    public function ganados(Request $request): Response
    {
        return $this->renderLeadTable($request, 'leads/index', 'Leads ganados', 'ganado');
    }

    public function noInteresados(Request $request): Response
    {
        return $this->renderLeadTable($request, 'leads/index', 'Leads no interesados', 'no_interesado');
    }

    public function kanban(Request $request): Response
    {
        $query = $this->baseQuery($request)
            ->whereIn('status', self::MAIN_KANBAN_STATUSES)
            ->latest();

        return Inertia::render('leads/kanban', [
            'boardStatuses' => self::MAIN_KANBAN_STATUSES,
            'allStatuses' => self::ALL_STATUSES,
            'statusOptions' => $this->statusOptions(),
            'sourceOptions' => $this->sourceOptions(),
            'leads' => $query->get([
                'id',
                'agent_id',
                'first_name',
                'last_name',
                'phone',
                'email',
                'source',
                'status',
                'created_at',
            ]),
            'files' => File::query()
                ->select(['id', 'uuid', 'path', 'original_name', 'mime_type', 'size', 'related_table', 'related_uuid', 'created_at'])
                ->where('related_table', 'leads')
                ->latest()
                ->get(),
            'agents' => Agent::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => trim((string) $request->string('search', '')),
                'agent_id' => $request->string('agent_id')->toString() ?: null,
            ],
        ]);
    }

    public function store(UpsertLeadRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $isUpdating = isset($data['id']);
        $lead = $isUpdating ? Lead::query()->findOrFail($data['id']) : new Lead();

        $this->authorizeLead($request, $lead);

        $lead->fill([
            'agent_id' => $this->resolveAgentId($request, $data, $isUpdating),
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'] ?? null,
            'phone' => $data['phone'],
            'email' => $data['email'] ?? null,
            'source' => $data['source'],
            'status' => $isUpdating ? ($data['status'] ?? $lead->status) : 'nuevo',
        ]);

        $lead->save();

        return back()->with('success', isset($data['id']) ? 'Lead actualizado correctamente.' : 'Lead creado correctamente.');
    }

    public function convertToClient(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorizeLead($request, $lead);

        $existingClient = $lead->client_id
            ? Client::query()->find($lead->client_id)
            : Client::query()
                ->where(function (Builder $query) use ($lead): void {
                    if ($lead->email) {
                        $query->orWhere('email', $lead->email);
                    }

                    $query->orWhere('phone', $lead->phone);
                })
                ->first();

        if (! $existingClient) {
            $existingClient = Client::query()->create([
                'first_name' => $lead->first_name,
                'last_name' => $lead->last_name ?? 'Sin apellido',
                'email' => $lead->email,
                'phone' => $lead->phone,
                'source' => $lead->source,
                'is_active' => true,
            ]);
        }

        $lead->update([
            'status' => 'ganado',
            'client_id' => $existingClient->id,
            'converted_at' => now(),
        ]);

        return back()->with('success', 'Lead convertido a cliente correctamente.');
    }

    public function destroy(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorizeLead($request, $lead);
        $lead->delete();

        return back()->with('success', 'Lead eliminado correctamente.');
    }

    public function updateStatus(UpdateLeadStatusRequest $request, Lead $lead): JsonResponse
    {
        $this->authorizeLead($request, $lead);
        $lead->update([
            'status' => $request->validated('status'),
        ]);

        return response()->json([
            'message' => 'Estatus actualizado correctamente.',
        ]);
    }

    private function renderLeadTable(Request $request, string $page, string $title, ?string $fixedStatus): Response
    {
        $search = trim((string) $request->string('search', ''));
        $status = $fixedStatus ?? ($request->string('status')->toString() ?: null);
        $agentId = $request->string('agent_id')->toString() ?: null;

        $leads = $this->baseQuery($request)
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $nestedQuery) use ($search) {
                    $nestedQuery->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($status, fn (Builder $query) => $query->where('status', $status))
            ->when($agentId, fn (Builder $query) => $query->where('agent_id', $agentId))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render($page, [
            'title' => $title,
            'allStatuses' => self::ALL_STATUSES,
            'statusOptions' => $this->statusOptions(),
            'sourceOptions' => $this->sourceOptions(),
            'fixedStatus' => $fixedStatus,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'agent_id' => $agentId,
            ],
            'leads' => $leads,
            'files' => File::query()
                ->select(['id', 'uuid', 'path', 'original_name', 'mime_type', 'size', 'related_table', 'related_uuid', 'created_at'])
                ->where('related_table', 'leads')
                ->latest()
                ->get(),
            'agents' => Agent::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    private function baseQuery(Request $request): Builder
    {
        $query = Lead::query()->with('agent:id,name');

        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return $query;
        }

        $user->loadMissing('agent');

        if ($this->isSuperAdmin($user)) {
            return $query;
        }

        return $query->where('agent_id', $user->agent?->id);
    }

    private function resolveAgentId(Request $request, array $data, bool $isUpdating): string
    {
        /** @var User|null $user */
        $user = $request->user();
        $user?->loadMissing('agent');

        if (! $isUpdating) {
            if (! $user?->agent?->id) {
                throw ValidationException::withMessages([
                    'agent_id' => 'No se pudo asignar el agente del usuario autenticado.',
                ]);
            }

            return (string) $user->agent->id;
        }

        if ($user && $this->isSuperAdmin($user) && ! empty($data['agent_id'])) {
            return (string) $data['agent_id'];
        }

        if (! $user || ! $user->agent?->id) {
            return (string) ($data['agent_id'] ?? '');
        }

        return (string) $user->agent->id;
    }

    private function authorizeLead(Request $request, Lead $lead): void
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        if ($this->isSuperAdmin($user)) {
            return;
        }

        if ($lead->exists && $lead->agent_id !== $user->agent?->id) {
            abort(403);
        }
    }

    private function isSuperAdmin(User $user): bool
    {
        return $user->hasRole('SuperAdmin')
            || $user->hasRole('superadmin')
            || $user->hasRole('super_admin');
    }

    /**
     * @return array<array{value: string, label: string}>
     */
    private function statusOptions(): array
    {
        return [
            ['value' => 'nuevo', 'label' => 'Nuevo'],
            ['value' => 'contactado', 'label' => 'Contactado'],
            ['value' => 'perfilado', 'label' => 'Perfilado'],
            ['value' => 'en_pausa', 'label' => 'En pausa'],
            ['value' => 'seguimiento', 'label' => 'Seguimiento'],
            ['value' => 'en_tramite', 'label' => 'En trámite'],
            ['value' => 'ganado', 'label' => 'Ganado'],
            ['value' => 'no_interesado', 'label' => 'No interesado'],
        ];
    }

    /**
     * @return array<array{value: string, label: string}>
     */
    private function sourceOptions(): array
    {
        return [
            ['value' => 'facebook', 'label' => 'Facebook'],
            ['value' => 'google', 'label' => 'Google'],
            ['value' => 'whatsapp', 'label' => 'WhatsApp'],
            ['value' => 'referral', 'label' => 'Referido'],
            ['value' => 'landing', 'label' => 'Landing'],
            ['value' => 'other', 'label' => 'Otro'],
        ];
    }
}
