<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Http\Requests\Accounting\AgentCommissionReconcileRequest;
use App\Models\AgentCommission;
use App\Models\AgentCommissionPayment;
use App\Models\AgentCommissionPaymentLine;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AgentCommissionReconcileController extends Controller
{
    public function store(AgentCommissionReconcileRequest $request): RedirectResponse
    {
        $agentId = (string) $request->user()->agent_id;
        $data = $request->validated();

        DB::transaction(function () use ($agentId, $data): void {
            $payment = AgentCommissionPayment::query()
                ->forAgent($agentId)
                ->withSum('lines', 'amount_applied')
                ->findOrFail($data['payment_id']);

            $incomingTotal = collect($data['lines'])->sum('amount_applied');
            $paymentAvailable = $payment->remaining_amount;

            if ($incomingTotal > ($paymentAvailable + 0.00001)) {
                abort(422, 'El total aplicado excede el saldo disponible del pago.');
            }

            foreach ($data['lines'] as $lineData) {
                $commission = AgentCommission::query()
                    ->forAgent($agentId)
                    ->withSum('lines', 'amount_applied')
                    ->findOrFail($lineData['commission_id']);

                $line = AgentCommissionPaymentLine::query()
                    ->where('payment_id', $payment->id)
                    ->where('commission_id', $commission->id)
                    ->first();

                $currentApplied = $line ? (float) $line->amount_applied : 0;
                $remainingCommission = $commission->remaining_amount + $currentApplied;

                if ((float) $lineData['amount_applied'] > ($remainingCommission + 0.00001)) {
                    abort(422, 'No puedes aplicar más que el saldo restante de la comisión.');
                }

                AgentCommissionPaymentLine::query()->updateOrCreate(
                    [
                        'payment_id' => $payment->id,
                        'commission_id' => $commission->id,
                    ],
                    [
                        'amount_applied' => $lineData['amount_applied'],
                    ],
                );
            }
        });

        return back()->with('success', 'Conciliación guardada correctamente.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $agentId = (string) $request->user()->agent_id;

        $validated = $request->validate([
            'payment_id' => ['required', 'uuid'],
            'line_ids' => ['nullable', 'array'],
            'line_ids.*' => ['uuid'],
        ]);

        $payment = AgentCommissionPayment::query()->forAgent($agentId)->findOrFail($validated['payment_id']);

        $query = AgentCommissionPaymentLine::query()->where('payment_id', $payment->id);

        if (! empty($validated['line_ids'])) {
            $query->whereIn('id', $validated['line_ids']);
        }

        $query->delete();

        return back()->with('success', 'Conciliación eliminada correctamente.');
    }
}
