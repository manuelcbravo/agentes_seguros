<?php

namespace App\Http\Controllers\Agents;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAgentWebSettingsRequest;
use App\Models\Agent;
use App\Models\AgentCommission;
use App\Models\AgentProfile;
use App\Models\AgentProfileViewStat;
use App\Models\Beneficiary;
use App\Models\Client;
use App\Models\Insured;
use App\Models\Lead;
use App\Models\Policy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AgentWebController extends Controller
{
    public function index(): Response
    {
        $agentId = auth()->user()?->agent_id;
        abort_unless($agentId, 403);

        $agent = Agent::query()->findOrFail($agentId);
        $profile = $this->findOrCreateProfile($agent);

        $today = now()->toDateString();
        $lastThirtyDaysStart = now()->subDays(29)->toDateString();
        $lastThirtyDaysStartDateTime = now()->subDays(29)->startOfDay();

        $viewsLastThirtyDays = AgentProfileViewStat::query()
            ->where('agent_id', $agentId)
            ->whereBetween('date', [$lastThirtyDaysStart, $today])
            ->sum('views_total');

        $leadsLastThirtyDays = Lead::query()
            ->where('agent_id', $agentId)
            ->where('source', 'perfil_web')
            ->where('created_at', '>=', $lastThirtyDaysStartDateTime)
            ->count();

        return Inertia::render('agents/web/index', [
            'profile' => $profile->only(['public_slug', 'is_public_enabled', 'contact_form_enabled', 'show_licenses']),
            'pies' => $this->buildPieCharts($agentId),
            'barras' => $this->buildBarCharts($agentId),
            'lineas' => $this->buildLineCharts($agentId),
            'kpis' => [
                'polizas_total' => Policy::query()->where('agent_id', $agentId)->count(),
                'contratantes_total' => Client::query()->where('agent_id', $agentId)->count(),
                'asegurados_total' => Insured::query()->where('agent_id', $agentId)->count(),
                'beneficiarios_total' => Beneficiary::query()->where('agent_id', $agentId)->count(),
                'vistas_30d' => $viewsLastThirtyDays,
                'leads_30d' => $leadsLastThirtyDays,
                'conversion_30d' => $viewsLastThirtyDays > 0 ? round(($leadsLastThirtyDays / $viewsLastThirtyDays) * 100, 2) : 0,
            ],
        ]);
    }

    public function update(UpdateAgentWebSettingsRequest $request): RedirectResponse
    {
        $agentId = $request->user()?->agent_id;
        abort_unless($agentId, 403);

        $agent = Agent::query()->findOrFail($agentId);
        $profile = $this->findOrCreateProfile($agent);
        $data = $request->validated();

        $profile->update([
            'is_public_enabled' => $data['is_public_enabled'],
            'contact_form_enabled' => $data['contact_form_enabled'],
            'show_licenses' => $data['show_licenses'],
            'last_published_at' => ! $profile->is_public_enabled && $data['is_public_enabled'] && ! $profile->last_published_at
                ? Carbon::now()
                : $profile->last_published_at,
        ]);

        return back()->with('success', 'Configuración web guardada correctamente');
    }

    private function buildPieCharts(string $agentId): array
    {
        $leadStatusLabels = [
            'nuevo' => 'Nuevo',
            'en_proceso' => 'En proceso',
            'ganado' => 'Ganado',
            'perdido' => 'Perdido',
        ];

        $leadStatusCounts = Lead::query()
            ->where('agent_id', $agentId)
            ->selectRaw("CASE
                WHEN status IN ('contactado','perfilado','en_pausa','seguimiento','en_tramite') THEN 'en_proceso'
                WHEN status IN ('no_interesado') THEN 'perdido'
                ELSE status
            END AS grouped_status, COUNT(*) as total")
            ->groupBy('grouped_status')
            ->pluck('total', 'grouped_status');

        $policyStatusLabels = [
            Policy::STATUS_ACTIVE => 'Vigente',
            Policy::STATUS_EXPIRED => 'Vencida',
            Policy::STATUS_DRAFT => 'Borrador',
        ];

        $policyStatusCounts = Policy::query()
            ->where('agent_id', $agentId)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $commissionRecords = AgentCommission::query()
            ->withSum('lines', 'amount_applied')
            ->where('agent_id', $agentId)
            ->get();

        $commissionPaidCount = $commissionRecords->filter(fn (AgentCommission $commission) => $commission->is_paid)->count();
        $commissionPendingCount = $commissionRecords->filter(fn (AgentCommission $commission) => ! $commission->is_paid && $commission->status !== 'cancelled')->count();

        return [
            'leads' => [
                'labels' => array_values($leadStatusLabels),
                'series' => array_map(fn (string $key) => (int) ($leadStatusCounts[$key] ?? 0), array_keys($leadStatusLabels)),
            ],
            'polizas' => [
                'labels' => array_values($policyStatusLabels),
                'series' => array_map(fn (string $key) => (int) ($policyStatusCounts[$key] ?? 0), array_keys($policyStatusLabels)),
            ],
            'comisiones' => [
                'labels' => ['Pagadas', 'Pendientes'],
                'series' => [$commissionPaidCount, $commissionPendingCount],
            ],
        ];
    }

    private function buildBarCharts(string $agentId): array
    {
        $months = $this->buildMonthlyRange(6);
        $categories = $months->map(fn ($month) => $month->translatedFormat('M Y'))->values()->all();

        $leadMonthlyTotals = Lead::query()
            ->where('agent_id', $agentId)
            ->whereBetween('created_at', [$months->first()->copy()->startOfMonth(), $months->last()->copy()->endOfMonth()])
            ->get(['created_at'])
            ->groupBy(fn (Lead $lead) => $lead->created_at?->format('Y-m'))
            ->map(fn (Collection $records) => $records->count());

        $leadMonthlyWon = Lead::query()
            ->where('agent_id', $agentId)
            ->where('status', 'ganado')
            ->whereBetween('created_at', [$months->first()->copy()->startOfMonth(), $months->last()->copy()->endOfMonth()])
            ->get(['created_at'])
            ->groupBy(fn (Lead $lead) => $lead->created_at?->format('Y-m'))
            ->map(fn (Collection $records) => $records->count());

        $policyMonthlyTotals = Policy::query()
            ->where('agent_id', $agentId)
            ->whereBetween('created_at', [$months->first()->copy()->startOfMonth(), $months->last()->copy()->endOfMonth()])
            ->get(['created_at'])
            ->groupBy(fn (Policy $policy) => $policy->created_at?->format('Y-m'))
            ->map(fn (Collection $records) => $records->count());

        $conversionSeries = [];
        $policiesSeries = [];

        foreach ($months as $month) {
            $period = $month->format('Y-m');
            $totalLeads = (int) ($leadMonthlyTotals[$period] ?? 0);
            $wonLeads = (int) ($leadMonthlyWon[$period] ?? 0);
            $conversionSeries[] = $totalLeads > 0 ? round(($wonLeads / $totalLeads) * 100, 2) : 0;
            $policiesSeries[] = (int) ($policyMonthlyTotals[$period] ?? 0);
        }

        return [
            'categories' => $categories,
            'series' => [
                ['name' => 'Leads convertidos %', 'data' => $conversionSeries],
                ['name' => 'Pólizas nuevas', 'data' => $policiesSeries],
            ],
        ];
    }

    private function buildLineCharts(string $agentId): array
    {
        $months = $this->buildMonthlyRange(12);
        $monthKeys = $months->map(fn ($month) => $month->format('Y-m'));

        $monthLabels = $months->map(fn ($month) => $month->translatedFormat('M Y'))->all();

        $newPoliciesByMonth = Policy::query()
            ->where('agent_id', $agentId)
            ->whereBetween('created_at', [$months->first()->copy()->startOfMonth(), $months->last()->copy()->endOfMonth()])
            ->get(['created_at'])
            ->groupBy(fn (Policy $policy) => $policy->created_at?->format('Y-m'))
            ->map(fn (Collection $records) => $records->count());

        $activePoliciesByMonth = Policy::query()
            ->where('agent_id', $agentId)
            ->where('status', Policy::STATUS_ACTIVE)
            ->whereBetween('created_at', [$months->first()->copy()->startOfMonth(), $months->last()->copy()->endOfMonth()])
            ->get(['created_at'])
            ->groupBy(fn (Policy $policy) => $policy->created_at?->format('Y-m'))
            ->map(fn (Collection $records) => $records->count());

        $allPoliciesByMonth = Policy::query()
            ->where('agent_id', $agentId)
            ->whereBetween('created_at', [$months->first()->copy()->startOfMonth(), $months->last()->copy()->endOfMonth()])
            ->get(['created_at'])
            ->groupBy(fn (Policy $policy) => $policy->created_at?->format('Y-m'))
            ->map(fn (Collection $records) => $records->count());

        $nuevas = [];
        $metaNuevas = [];
        $persistencia = [];
        $metaPers = [];

        foreach ($monthKeys as $monthKey) {
            $newPolicies = (int) ($newPoliciesByMonth[$monthKey] ?? 0);
            $totalPolicies = (int) ($allPoliciesByMonth[$monthKey] ?? 0);
            $activePolicies = (int) ($activePoliciesByMonth[$monthKey] ?? 0);

            $nuevas[] = $newPolicies;
            $metaNuevas[] = max(3, (int) ceil($newPolicies * 1.15));
            $persistencia[] = $totalPolicies > 0 ? round(($activePolicies / $totalPolicies) * 100, 2) : 0;
            $metaPers[] = 85;
        }

        return [
            'meses' => $monthLabels,
            'nuevas' => $nuevas,
            'metaNuevas' => $metaNuevas,
            'persistencia' => $persistencia,
            'metaPers' => $metaPers,
        ];
    }

    private function buildMonthlyRange(int $months): Collection
    {
        return collect(range($months - 1, 0))
            ->map(fn (int $offset) => now()->copy()->subMonths($offset)->startOfMonth());
    }

    private function findOrCreateProfile(Agent $agent): AgentProfile
    {
        return $agent->profile ?? AgentProfile::query()->create([
            'agent_id' => $agent->id,
            'display_name' => $agent->name,
            'email_public' => $agent->email,
            'phone_public' => $agent->phone,
            'city' => $agent->city,
            'state' => $agent->state,
            'public_slug' => $this->makeUniqueSlug($agent->name ?: (string) $agent->id),
        ]);
    }

    private function makeUniqueSlug(string $value): string
    {
        $base = Str::slug($value);
        $root = filled($base) ? $base : 'agente';
        $slug = $root;
        $suffix = 1;

        while (AgentProfile::query()->where('public_slug', $slug)->exists()) {
            $slug = $root.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
