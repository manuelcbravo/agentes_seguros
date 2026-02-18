<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpsertAgentLicenseRequest;
use App\Models\Agent;
use App\Models\AgentLicense;
use App\Models\CatInsuranceCompany;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AgentLicenseController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('agent-licenses/index', [
            'licenses' => AgentLicense::query()
                ->with([
                    'agent:id,name,email',
                    'insuranceCompany:id,name,code',
                ])
                ->select([
                    'id',
                    'agent_id',
                    'aseguradora_id',
                    'num_licencia',
                    'fecha_expiracion',
                    'fecha_emision',
                    'status',
                    'observaciones',
                    'activo',
                    'created_at',
                ])
                ->latest()
                ->get(),
            'agents' => Agent::query()
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
            'insuranceCompanies' => CatInsuranceCompany::query()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'statusOptions' => [
                ['value' => 'vigente', 'label' => 'Vigente'],
                ['value' => 'por_vencer', 'label' => 'Por vencer'],
                ['value' => 'vencida', 'label' => 'Vencida'],
                ['value' => 'suspendida', 'label' => 'Suspendida'],
            ],
        ]);
    }

    public function store(UpsertAgentLicenseRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $license = isset($data['id']) ? AgentLicense::query()->findOrFail($data['id']) : new AgentLicense();

        $license->fill([
            'agent_id' => $data['agent_id'],
            'aseguradora_id' => $data['aseguradora_id'],
            'num_licencia' => $data['num_licencia'],
            'fecha_expiracion' => $data['fecha_expiracion'],
            'fecha_emision' => $data['fecha_emision'],
            'status' => $data['status'],
            'observaciones' => $data['observaciones'] ?? null,
            'activo' => $data['activo'],
        ]);

        $license->save();

        return back()->with('success', isset($data['id']) ? 'Licencia actualizada correctamente.' : 'Licencia creada correctamente.');
    }

    public function destroy(AgentLicense $agentLicense): RedirectResponse
    {
        $agentLicense->delete();

        return back()->with('success', 'Licencia eliminada correctamente.');
    }
}
