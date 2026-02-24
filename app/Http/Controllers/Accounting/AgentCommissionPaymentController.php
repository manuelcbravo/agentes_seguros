<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Http\Requests\Accounting\AgentCommissionPaymentRequest;
use App\Models\AgentCommissionPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AgentCommissionPaymentController extends Controller
{

    public function index(Request $request): RedirectResponse
    {
        return redirect()->route('accounting.commissions.index', $request->only(['period', 'insurer_name', 'status_effective', 'q']));
    }

    public function store(AgentCommissionPaymentRequest $request): RedirectResponse
    {
        $agentId = (string) $request->user()->agent_id;
        $data = $request->validated();

        $payment = isset($data['id'])
            ? AgentCommissionPayment::query()->forAgent($agentId)->findOrFail($data['id'])
            : new AgentCommissionPayment();

        if ($payment->exists && $payment->status === 'posted') {
            $payment->fill([
                'notes' => $data['notes'] ?? null,
                'reference' => $data['reference'] ?? null,
            ]);
        } else {
            $payment->fill([
                'agent_id' => $agentId,
                'insurer_name' => $data['insurer_name'],
                'payment_date' => $data['payment_date'],
                'amount' => $data['amount'],
                'currency' => strtoupper($data['currency'] ?? 'MXN'),
                'reference' => $data['reference'] ?? null,
                'status' => $data['status'] ?? 'posted',
                'notes' => $data['notes'] ?? null,
                'created_by' => $payment->exists ? $payment->created_by : $request->user()->id,
            ]);
        }

        $payment->save();

        return back()->with('success', $payment->wasRecentlyCreated
            ? 'Pago registrado correctamente.'
            : 'Pago actualizado correctamente.');
    }

    public function update(AgentCommissionPaymentRequest $request, string $payment): RedirectResponse
    {
        $request->merge(['id' => $payment]);

        return $this->store($request);
    }

    public function destroy(Request $request, string $payment): RedirectResponse
    {
        $agentId = (string) $request->user()->agent_id;

        $record = AgentCommissionPayment::query()->forAgent($agentId)->findOrFail($payment);
        $record->delete();

        return back()->with('success', 'Pago eliminado correctamente.');
    }
}
