<?php

namespace App\Http\Controllers\Search;

use App\Http\Controllers\Controller;
use App\Models\Beneficiary;
use App\Models\Client;
use App\Models\Insured;
use App\Models\Lead;
use App\Models\Policy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Database\QueryException;
class GlobalSearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $startedAt = microtime(true);
        $rawQuery = trim((string) $request->string('q')->toString());
        $query = mb_strtolower($rawQuery);

        if (mb_strlen($query) < 3) {
            return response()->json([
                'query' => $rawQuery,
                'groups' => [],
                'total' => 0,
                'took_ms' => 0,
            ]);
        }

        $agentId = auth()->user()?->agent_id;
        $limit = max(1, min((int) $request->integer('limit', 6), 15));

        $groups = collect([
            $this->buildClientsGroup($query, $rawQuery, $agentId, $limit),
            $this->buildLeadsGroup($query, $rawQuery, $agentId, $limit),
            $this->buildInsuredsGroup($query, $rawQuery, $agentId, $limit),
            $this->buildBeneficiariesGroup($query, $rawQuery, $agentId, $limit),
            $this->buildPoliciesGroup($query, $rawQuery, $agentId, $limit),
        ])->filter(fn (array $group) => $group['count'] > 0)->values();

        return response()->json([
            'query' => $rawQuery,
            'took_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            'total' => $groups->sum('count'),
            'groups' => $groups,
        ]);
    }

    private function buildClientsGroup(string $query, string $rawQuery, ?string $agentId, int $limit): array
    {
        $items = $this->searchWithFallback(Client::class, $query, $agentId, $limit, fn (Builder $builder) => $this->wherePersonName($builder, $rawQuery, true))
            ->map(fn (Client $client) => [
                'type' => 'client',
                'id' => $client->id,
                'title' => $client->full_name,
                'subtitle' => collect([$client->phone, $client->email])->filter()->implode(' • '),
                'badges' => ['Cliente'],
                'url' => route('clients.index', ['search' => $rawQuery]),
                'highlight' => [
                    'title' => $client->full_name,
                    'subtitle' => collect([$client->phone, $client->email])->filter()->implode(' • '),
                ],
            ])->values();

        return ['key' => 'clients', 'label' => 'Clientes', 'icon' => 'users', 'count' => $items->count(), 'items' => $items];
    }

    private function buildLeadsGroup(string $query, string $rawQuery, ?string $agentId, int $limit): array
    {
        $items = $this->searchWithFallback(Lead::class, $query, $agentId, $limit, fn (Builder $builder) => $this->wherePersonName($builder, $rawQuery, true))
            ->map(fn (Lead $lead) => [
                'type' => 'lead',
                'id' => $lead->id,
                'title' => $lead->full_name,
                'subtitle' => collect([$lead->phone, $lead->email])->filter()->implode(' • '),
                'badges' => ['Lead'],
                'url' => route('leads.index', ['search' => $rawQuery]),
                'highlight' => [
                    'title' => $lead->full_name,
                    'subtitle' => collect([$lead->phone, $lead->email])->filter()->implode(' • '),
                ],
            ])->values();

        return ['key' => 'leads', 'label' => 'Leads', 'icon' => 'user-plus', 'count' => $items->count(), 'items' => $items];
    }

    private function buildInsuredsGroup(string $query, string $rawQuery, ?string $agentId, int $limit): array
    {
        $items = $this->searchWithFallback(Insured::class, $query, $agentId, $limit, fn (Builder $builder) => $this->wherePersonName($builder, $rawQuery, true))
            ->map(fn (Insured $insured) => [
                'type' => 'insured',
                'id' => $insured->id,
                'title' => $insured->full_name,
                'subtitle' => collect([$insured->phone, $insured->email, $insured->occupation])->filter()->implode(' • '),
                'badges' => ['Asegurado'],
                'url' => route('asegurados.index', ['search' => $rawQuery]),
                'highlight' => [
                    'title' => $insured->full_name,
                    'subtitle' => collect([$insured->phone, $insured->email, $insured->occupation])->filter()->implode(' • '),
                ],
            ])->values();

        return ['key' => 'insureds', 'label' => 'Asegurados', 'icon' => 'shield-check', 'count' => $items->count(), 'items' => $items];
    }

    private function buildBeneficiariesGroup(string $query, string $rawQuery, ?string $agentId, int $limit): array
    {
        $items = $this->searchWithFallback(Beneficiary::class, $query, $agentId, $limit, fn (Builder $builder) => $this->wherePersonName($builder, $rawQuery, false))
            ->map(fn (Beneficiary $beneficiary) => [
                'type' => 'beneficiary',
                'id' => $beneficiary->id,
                'title' => $beneficiary->full_name,
                'subtitle' => collect([$beneficiary->occupation, $beneficiary->rfc])->filter()->implode(' • '),
                'badges' => ['Beneficiario'],
                'url' => route('beneficiarios.index', ['search' => $rawQuery]),
                'highlight' => [
                    'title' => $beneficiary->full_name,
                    'subtitle' => collect([$beneficiary->occupation, $beneficiary->rfc])->filter()->implode(' • '),
                ],
            ])->values();

        return ['key' => 'beneficiaries', 'label' => 'Beneficiarios', 'icon' => 'heart-handshake', 'count' => $items->count(), 'items' => $items];
    }

    private function buildPoliciesGroup(string $query, string $rawQuery, ?string $agentId, int $limit): array
    {
        $items = $this->searchWithFallback(
            Policy::class,
            $query,
            $agentId,
            $limit,
            fn (Builder $builder) => $builder->where(function (Builder $nested) use ($rawQuery) {
                $term = "%{$rawQuery}%";
                $nested->whereRaw('product ILIKE ?', [$term])
                    ->orWhereRaw('periodicity ILIKE ?', [$term]);
            }),
            ['client:id,first_name,middle_name,last_name,second_last_name'],
        )->map(function (Policy $policy) use ($rawQuery) {
            $title = $policy->product ? 'Póliza '.$policy->product : 'Póliza';
            $subtitle = collect([$policy->periodicity, $policy->client?->full_name])->filter()->implode(' • ');

            return [
                'type' => 'policy',
                'id' => $policy->id,
                'title' => $title,
                'subtitle' => $subtitle,
                'badges' => ['Póliza'],
                'url' => route('polizas.index', ['search' => $rawQuery]),
                'highlight' => ['title' => $title, 'subtitle' => $subtitle],
            ];
        })->values();

        return ['key' => 'policies', 'label' => 'Pólizas', 'icon' => 'file-text', 'count' => $items->count(), 'items' => $items];
    }

    private function wherePersonName(Builder $builder, string $rawQuery, bool $withContact): Builder
    {
        return $builder->where(function (Builder $nested) use ($rawQuery, $withContact) {
            $term = "%{$rawQuery}%";
            $nested->whereRaw('first_name ILIKE ?', [$term])
                ->orWhereRaw('middle_name ILIKE ?', [$term])
                ->orWhereRaw('last_name ILIKE ?', [$term])
                ->orWhereRaw('second_last_name ILIKE ?', [$term]);

            if ($withContact) {
                $nested->orWhereRaw('email ILIKE ?', [$term])
                    ->orWhereRaw('phone ILIKE ?', [$term]);
            }
        });
    }

    private function searchWithFallback(
        string $modelClass,
        string $query,
        ?string $agentId,
        int $limit,
        \Closure $fallback,
        array $with = [],
    ): Collection {
        $scoutResults = collect();

        if (in_array('Laravel\\Scout\\Searchable', class_uses_recursive($modelClass), true)) {
             try {
                $builder = $modelClass::search(mb_strtolower($query));

                if (method_exists($builder, 'where') && $agentId) {
                    $builder->where('agent_id', $agentId);
                }

                $scoutResults = $builder->take($limit * 2)->get();
            } catch (QueryException $exception) {
                // Cuando Scout usa el motor de base de datos, intenta consultar columnas
                // virtuales como "full_name" o "search_text" que no existen físicamente.
                // En ese caso hacemos fallback al query SQL seguro definido por entidad.
                report($exception);
            }
        }

        $safeScopedScout = $scoutResults
            ->filter(fn ($model) => (string) $model->agent_id === (string) $agentId)
            ->take($limit);

        if ($safeScopedScout->isNotEmpty()) {
            return $safeScopedScout->load($with);
        }

        return $modelClass::query()
            ->when($with !== [], fn (Builder $builder) => $builder->with($with))
            ->where('agent_id', $agentId)
            ->where($fallback)
            ->limit($limit)
            ->get();
    }
}
