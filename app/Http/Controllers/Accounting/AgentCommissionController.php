<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Http\Requests\Accounting\AgentCommissionRequest;
use App\Models\AgentCommission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgentCommissionController extends Controller
{
    public function index(Request $request): Response
    {
        $agentId = (string) $request->user()->agent_id;

        $commissionsQuery = AgentCommission::query()
            ->forAgent($agentId)
            ->withSum('lines', 'amount_applied')
            ->latest();

        if ($period = $request->string('period')->toString()) {
            $commissionsQuery->where('period', $period);
        }

        if ($insurerName = $request->string('insurer_name')->toString()) {
            $commissionsQuery->where('insurer_name', 'like', "%{$insurerName}%");
        }

        if ($query = $request->string('q')->toString()) {
            $commissionsQuery->where(function ($builder) use ($query): void {
                $builder->where('concept', 'like', "%{$query}%")
                    ->orWhere('reference', 'like', "%{$query}%")
                    ->orWhere('insurer_name', 'like', "%{$query}%");
            });
        }

        $commissions = $commissionsQuery->get();

        if ($statusEffective = $request->string('status_effective')->toString()) {
            $commissions = $commissions->filter(fn (AgentCommission $commission) => $commission->status_effective === $statusEffective)->values();
        }

        $payments = \App\Models\AgentCommissionPayment::query()
            ->forAgent($agentId)
            ->withSum('lines', 'amount_applied')
            ->latest('payment_date')
            ->get();

        $insurers = AgentCommission::query()
            ->forAgent($agentId)
            ->select('insurer_name')
            ->distinct()
            ->orderBy('insurer_name')
            ->pluck('insurer_name');

        return Inertia::render('accounting/commissions/index', [
            'commissions' => $commissions,
            'payments' => $payments,
            'insurers' => $insurers,
            'filters' => [
                'period' => $request->string('period')->toString(),
                'insurer_name' => $request->string('insurer_name')->toString(),
                'status_effective' => $request->string('status_effective')->toString(),
                'q' => $request->string('q')->toString(),
            ],
            'summary' => [
                'pending' => round($commissions->where('status_effective', 'pending')->sum('remaining_amount'), 2),
                'paid' => round($commissions->where('is_paid', true)->sum('amount'), 2),
                'total' => round($commissions->sum('amount'), 2),
            ],
        ]);
    }

    public function store(AgentCommissionRequest $request): RedirectResponse
    {
        $agentId = (string) $request->user()->agent_id;
        $data = $request->validated();

        $commission = isset($data['id'])
            ? AgentCommission::query()->forAgent($agentId)->findOrFail($data['id'])
            : new AgentCommission();

        $commission->fill([
            'agent_id' => $agentId,
            'insurer_name' => $data['insurer_name'],
            'concept' => $data['concept'],
            'reference' => $data['reference'] ?? null,
            'period' => $data['period'],
            'earned_date' => $data['earned_date'] ?? null,
            'amount' => $data['amount'],
            'currency' => strtoupper($data['currency'] ?? 'MXN'),
            'status' => $data['status'] ?? 'pending',
            'notes' => $data['notes'] ?? null,
            'created_by' => $commission->exists ? $commission->created_by : $request->user()->id,
        ]);
        $commission->save();

        return back()->with('success', $commission->wasRecentlyCreated
            ? 'Comisión registrada correctamente.'
            : 'Comisión actualizada correctamente.');
    }

    public function update(AgentCommissionRequest $request, string $commission): RedirectResponse
    {
        $request->merge(['id' => $commission]);

        return $this->store($request);
    }

    public function cancel(Request $request, string $commission): RedirectResponse
    {
        $agentId = (string) $request->user()->agent_id;

        $record = AgentCommission::query()->forAgent($agentId)->findOrFail($commission);
        $record->update(['status' => 'cancelled']);

        return back()->with('success', 'Comisión cancelada correctamente.');
    }
}
