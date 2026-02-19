<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateLeadStatusRequest;
use App\Http\Requests\UpsertLeadRequest;
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
        return $this->renderLeadTable($request, 'leads/index', 'Leads', null, false);
    }

    public function archived(Request $request): Response
    {
        return $this->renderLeadTable($request, 'leads/archived/index', 'Leads archivados', null, true);
    }

    public function ganados(Request $request): Response
    {
        return $this->renderLeadTable($request, 'leads/index', 'Leads ganados', 'ganado', false);
    }

    public function noInteresados(Request $request): Response
    {
        return $this->renderLeadTable($request, 'leads/index', 'Leads no interesados', 'no_interesado', false);
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
                ->select(['id', 'path', 'original_name', 'mime_type', 'size', 'related_table', 'related_uuid', 'created_at'])
                ->where('related_table', 'leads')
                ->latest()
                ->get(),
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

    public function archive(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorizeLead($request, $lead);

        if (method_exists($lead, 'archive')) {
            $lead->archive();
        } else {
            $lead->forceFill(['archived_at' => now()])->save();
        }

        return back()->with('success', 'Lead archivado correctamente.');
    }

    public function unarchive(Request $request, string $lead): RedirectResponse
    {
        $query = $this->baseQuery($request, true);
        $leadModel = $query->whereKey($lead)->firstOrFail();

        $this->authorizeLead($request, $leadModel);

        if (method_exists($leadModel, 'unarchive')) {
            $leadModel->unarchive();
        } elseif (method_exists($leadModel, 'unArchive')) {
            $leadModel->unArchive();
        } else {
            $leadModel->forceFill(['archived_at' => null])->save();
        }

        return back()->with('success', 'Lead restaurado correctamente.');
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

    private function renderLeadTable(Request $request, string $page, string $title, ?string $fixedStatus, bool $onlyArchived): Response
    {
        $search = trim((string) $request->string('search', ''));
        $status = $fixedStatus ?? ($request->string('status')->toString() ?: null);
        $leads = $this->baseQuery($request, $onlyArchived)
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $nestedQuery) use ($search) {
                    $nestedQuery->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($status, fn (Builder $query) => $query->where('status', $status))
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
            ],
            'leads' => $leads,
            'files' => File::query()
                ->select(['id', 'path', 'original_name', 'mime_type', 'size', 'related_table', 'related_uuid', 'created_at'])
                ->where('related_table', 'leads')
                ->latest()
                ->get(),
        ]);
    }

    private function baseQuery(Request $request, bool $onlyArchived = false): Builder
    {
        $query = Lead::query()->with('agent:id,name');

        if ($onlyArchived) {
            $query = $this->applyArchivedScope($query);
        } elseif (method_exists(Lead::class, 'scopeWithoutArchived')) {
            $query->withoutArchived();
        } else {
            $query->whereNull('archived_at');
        }

        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return $query;
        }

        $user->loadMissing('agent');

        $currentAgentId = $this->resolveCurrentAgentId($user);

        if (! $currentAgentId) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where('agent_id', $currentAgentId);
    }

    private function applyArchivedScope(Builder $query): Builder
    {
        if (method_exists(Lead::class, 'scopeOnlyArchived')) {
            return $query->onlyArchived();
        }

        if (method_exists(Lead::class, 'scopeArchived')) {
            return $query->archived();
        }

        if (method_exists(Lead::class, 'scopeWithArchived')) {
            return $query->withArchived()->whereNotNull('archived_at');
        }

        return Lead::query()
            ->with('agent:id,name')
            ->withoutGlobalScopes()
            ->whereNotNull('archived_at');
    }

    private function resolveCurrentAgentId(User $user): ?string
    {
        $agentId = $user->agent_id ?? $user->agent?->id;

        return $agentId ? (string) $agentId : null;
    }

    private function currentAgentIdFromRequest(Request $request): ?string
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return null;
        }

        $user->loadMissing('agent');

        return $this->resolveCurrentAgentId($user);
    }

    private function resolveAgentId(Request $request, array $data, bool $isUpdating): string
    {
        /** @var User|null $user */
        $user = $request->user();
        $user?->loadMissing('agent');

        if (! $isUpdating) {
            $agentId = $this->currentAgentIdFromRequest($request);

            if (! $agentId) {
                throw ValidationException::withMessages([
                    'agent_id' => 'No se pudo asignar el agente del usuario autenticado.',
                ]);
            }

            return $agentId;
        }

        $agentId = $this->currentAgentIdFromRequest($request);

        if (! $agentId) {
            return (string) ($data['agent_id'] ?? '');
        }

        return $agentId;
    }

    private function authorizeLead(Request $request, Lead $lead): void
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $agentId = $this->currentAgentIdFromRequest($request);

        if (! $agentId || ($lead->exists && $lead->agent_id !== $agentId)) {
            abort(403);
        }
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
