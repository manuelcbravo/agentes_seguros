<?php

namespace App\Http\Controllers\Search;

use App\Http\Controllers\Controller;
use App\Models\Beneficiary;
use App\Models\Client;
use App\Models\Insured;
use App\Models\Policy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

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
            $this->buildInsuredsGroup($query, $rawQuery, $agentId, $limit),
            $this->buildBeneficiariesGroup($query, $rawQuery, $agentId, $limit),
            $this->buildPoliciesGroup($query, $rawQuery, $agentId, $limit),
        ])->filter(fn (array $group) => $group['count'] > 0)->values();

        $total = $groups->sum('count');

        return response()->json([
            'query' => $rawQuery,
            'took_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            'total' => $total,
            'groups' => $groups,
        ]);
    }

    private function buildClientsGroup(string $query, string $rawQuery, ?string $agentId, int $limit): array
    {
        $items = $this->searchWithFallback(
            Client::class,
            $query,
            $agentId,
            $limit,
            fn (Builder $builder) => $builder->where(function (Builder $nested) use ($rawQuery) {
                $term = "%{$rawQuery}%";
                $nested->whereRaw('first_name ILIKE ?', [$term])
                    ->orWhereRaw('middle_name ILIKE ?', [$term])
                    ->orWhereRaw('last_name ILIKE ?', [$term])
                    ->orWhereRaw('second_last_name ILIKE ?', [$term])
                    ->orWhereRaw('email ILIKE ?', [$term])
                    ->orWhereRaw('phone ILIKE ?', [$term])
                    ->orWhereRaw('rfc ILIKE ?', [$term]);
            }),
        )->map(function (Client $client) use ($rawQuery) {
            $subtitle = collect([$client->phone, $client->email])->filter()->implode(' • ');

            return [
                'type' => 'client',
                'id' => $client->id,
                'title' => $client->full_name,
                'subtitle' => $subtitle,
                'badges' => ['Cliente'],
                'url' => route('clients.index', ['search' => $rawQuery, 'focus' => $client->id]),
                'highlight' => [
                    'title' => $client->full_name,
                    'subtitle' => $subtitle,
                ],
            ];
        })->values();

        return [
            'key' => 'clients',
            'label' => 'Clientes',
            'icon' => 'users',
            'count' => $items->count(),
            'items' => $items,
        ];
    }

    private function buildInsuredsGroup(string $query, string $rawQuery, ?string $agentId, int $limit): array
    {
        $items = $this->searchWithFallback(
            Insured::class,
            $query,
            $agentId,
            $limit,
            fn (Builder $builder) => $builder->where(function (Builder $nested) use ($rawQuery) {
                $term = "%{$rawQuery}%";
                $nested->whereRaw('email ILIKE ?', [$term])
                    ->orWhereRaw('phone ILIKE ?', [$term])
                    ->orWhereRaw('rfc ILIKE ?', [$term])
                    ->orWhereRaw('occupation ILIKE ?', [$term])
                    ->orWhereRaw('company_name ILIKE ?', [$term]);
            }),
            ['client:id,first_name,middle_name,last_name,second_last_name,email,phone'],
        )->map(function (Insured $insured) use ($rawQuery) {
            $clientName = $insured->client?->full_name ?? 'Asegurado';
            $subtitle = collect([$insured->phone, $insured->email, $insured->occupation])->filter()->implode(' • ');

            return [
                'type' => 'insured',
                'id' => $insured->id,
                'title' => $clientName,
                'subtitle' => $subtitle,
                'badges' => ['Asegurado'],
                'url' => route('asegurados.index', ['search' => $rawQuery, 'focus' => $insured->id]),
                'highlight' => [
                    'title' => $clientName,
                    'subtitle' => $subtitle,
                ],
            ];
        })->values();

        return [
            'key' => 'insureds',
            'label' => 'Asegurados',
            'icon' => 'shield-check',
            'count' => $items->count(),
            'items' => $items,
        ];
    }

    private function buildBeneficiariesGroup(string $query, string $rawQuery, ?string $agentId, int $limit): array
    {
        $items = $this->searchWithFallback(
            Beneficiary::class,
            $query,
            $agentId,
            $limit,
            fn (Builder $builder) => $builder->where(function (Builder $nested) use ($rawQuery) {
                $term = "%{$rawQuery}%";
                $nested->whereRaw('name ILIKE ?', [$term])
                    ->orWhereRaw('rfc ILIKE ?', [$term])
                    ->orWhereRaw('occupation ILIKE ?', [$term])
                    ->orWhereRaw('company_name ILIKE ?', [$term]);
            }),
            ['policy:id,status,product'],
        )->map(function (Beneficiary $beneficiary) use ($rawQuery) {
            $subtitle = collect([
                $beneficiary->occupation,
                $beneficiary->policy?->status ? 'Estatus: '.$beneficiary->policy->status : null,
            ])->filter()->implode(' • ');

            return [
                'type' => 'beneficiary',
                'id' => $beneficiary->id,
                'title' => $beneficiary->name,
                'subtitle' => $subtitle,
                'badges' => ['Beneficiario'],
                'url' => route('beneficiarios.index', ['search' => $rawQuery, 'focus' => $beneficiary->id]),
                'highlight' => [
                    'title' => $beneficiary->name,
                    'subtitle' => $subtitle,
                ],
            ];
        })->values();

        return [
            'key' => 'beneficiaries',
            'label' => 'Beneficiarios',
            'icon' => 'heart-handshake',
            'count' => $items->count(),
            'items' => $items,
        ];
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
                    ->orWhereRaw('status ILIKE ?', [$term])
                    ->orWhereRaw('periodicity ILIKE ?', [$term]);
            }),
            ['client:id,first_name,middle_name,last_name,second_last_name'],
        )->map(function (Policy $policy) use ($rawQuery) {
            $policyLabel = $policy->product ?: 'Póliza';
            $subtitle = collect([
                $policy->status ? 'Estatus: '.$policy->status : null,
                $policy->client?->full_name,
            ])->filter()->implode(' • ');

            return [
                'type' => 'policy',
                'id' => $policy->id,
                'title' => $policyLabel,
                'subtitle' => $subtitle,
                'badges' => array_values(array_filter(['Póliza', $policy->status ? Str::ucfirst((string) $policy->status) : null])),
                'url' => route('polizas.index', ['search' => $rawQuery, 'focus' => $policy->id]),
                'highlight' => [
                    'title' => $policyLabel,
                    'subtitle' => $subtitle,
                ],
            ];
        })->values();

        return [
            'key' => 'policies',
            'label' => 'Pólizas',
            'icon' => 'file-text',
            'count' => $items->count(),
            'items' => $items,
        ];
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
            $builder = $modelClass::search($query);

            if (method_exists($builder, 'where') && $agentId) {
                $builder->where('agent_id', $agentId);
            }

            $scoutResults = $builder->take($limit * 2)->get();
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
