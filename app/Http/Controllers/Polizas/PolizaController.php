<?php

namespace App\Http\Controllers\Polizas;

use App\Http\Controllers\Controller;
use App\Models\CatPaymentChannel;
use App\Models\Insured;
use App\Models\Policy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PolizaController extends Controller
{
    public function index(Request $request): Response
    {
        $agentId = (string) auth()->user()->agent_id;
        $search = trim((string) $request->string('search', ''));
        $paymentChannel = $request->string('payment_channel')->toString() ?: null;

        $polizas = Policy::query()
            ->where('agent_id', $agentId)
            ->with('insured:id,email,phone')
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $nestedQuery) use ($search): void {
                    $nestedQuery->where('status', 'like', "%{$search}%")
                        ->orWhere('product', 'like', "%{$search}%")
                        ->orWhere('payment_channel', 'like', "%{$search}%")
                        ->orWhere('periodicity', 'like', "%{$search}%");
                });
            })
            ->when($paymentChannel, fn (Builder $query) => $query->where('payment_channel', $paymentChannel))
            ->latest()
            ->get();

        $insureds = Insured::query()
            ->where('agent_id', $agentId)
            ->select(['id', 'email', 'phone'])
            ->orderBy('email')
            ->get();

        $paymentChannels = CatPaymentChannel::query()
            ->select(['code', 'name'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Polizas/index', [
            'polizas' => $polizas,
            'insureds' => $insureds,
            'paymentChannels' => $paymentChannels,
            'filters' => ['search' => $search, 'payment_channel' => $paymentChannel],
        ]);
    }

    public function upsert(Request $request): RedirectResponse
    {
        $agentId = (string) auth()->user()->agent_id;

        $data = $request->validate([
            'id' => ['nullable', 'uuid'],
            'insured_id' => ['required', 'uuid', Rule::exists('insureds', 'id')->where('agent_id', $agentId)],
            'client_id' => ['nullable', 'uuid'],
            'status' => ['required', 'string', 'max:120'],
            'payment_channel' => ['nullable', Rule::exists('cat_payment_channels', 'code')],
            'product' => ['nullable', 'string', 'max:160'],
            'coverage_start' => ['nullable', 'date'],
            'risk_premium' => ['nullable', 'numeric', 'min:0'],
            'fractional_premium' => ['nullable', 'numeric', 'min:0'],
            'periodicity' => ['nullable', 'string', 'max:120'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'currency' => ['nullable', 'integer'],
            'currency_id' => ['nullable', 'uuid'],
        ]);

        $data['agent_id'] = $agentId;

        if (! empty($data['id'])) {
            $poliza = Policy::query()
                ->where('agent_id', $agentId)
                ->findOrFail($data['id']);

            $poliza->update($data);

            return back()->with('success', 'Póliza actualizada correctamente.');
        }

        unset($data['id']);
        Policy::query()->create($data);

        return back()->with('success', 'Póliza creada correctamente.');
    }

    public function destroy(string $id): RedirectResponse
    {
        $agentId = (string) auth()->user()->agent_id;

        $poliza = Policy::query()->findOrFail($id);

        if ((string) $poliza->agent_id !== $agentId) {
            abort(403);
        }

        $poliza->delete();

        return back()->with('success', 'Póliza eliminada correctamente.');
    }
}
