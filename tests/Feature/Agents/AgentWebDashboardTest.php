<?php

namespace Tests\Feature\Agents;

use App\Models\AgentCommission;
use App\Models\AgentCommissionPayment;
use App\Models\AgentCommissionPaymentLine;
use App\Models\AgentProfileViewStat;
use App\Models\Beneficiary;
use App\Models\Client;
use App\Models\Insured;
use App\Models\Lead;
use App\Models\Policy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AgentWebDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_renders_agent_web_dashboard_with_agent_scoped_metrics(): void
    {
        Carbon::setTestNow('2026-03-01 12:00:00');

        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $agentId = $user->agent_id;
        $otherAgentId = $otherUser->agent_id;

        AgentProfileViewStat::query()->create([
            'agent_id' => $agentId,
            'date' => now()->toDateString(),
            'views_total' => 120,
            'views_unique' => 80,
        ]);

        AgentProfileViewStat::query()->create([
            'agent_id' => $otherAgentId,
            'date' => now()->toDateString(),
            'views_total' => 999,
            'views_unique' => 500,
        ]);

        Lead::query()->create([
            'agent_id' => $agentId,
            'first_name' => 'Lead',
            'last_name' => 'Nuevo',
            'phone' => '5511111111',
            'source' => 'perfil_web',
            'status' => 'nuevo',
            'created_at' => now()->subDays(2),
        ]);

        Lead::query()->create([
            'agent_id' => $agentId,
            'first_name' => 'Lead',
            'last_name' => 'Ganado',
            'phone' => '5522222222',
            'source' => 'perfil_web',
            'status' => 'ganado',
            'created_at' => now()->subDays(5),
        ]);

        Lead::query()->create([
            'agent_id' => $otherAgentId,
            'first_name' => 'Lead',
            'last_name' => 'Ajeno',
            'phone' => '5533333333',
            'source' => 'perfil_web',
            'status' => 'ganado',
            'created_at' => now()->subDays(1),
        ]);

        Client::query()->create([
            'agent_id' => $agentId,
            'first_name' => 'Cliente',
            'last_name' => 'Uno',
        ]);

        Client::query()->create([
            'agent_id' => $otherAgentId,
            'first_name' => 'Cliente',
            'last_name' => 'Ajeno',
        ]);

        Insured::query()->create([
            'agent_id' => $agentId,
            'first_name' => 'Asegurado',
            'last_name' => 'Uno',
            'birthday' => now()->subYears(30)->toDateString(),
        ]);

        Insured::query()->create([
            'agent_id' => $otherAgentId,
            'first_name' => 'Asegurado',
            'last_name' => 'Ajeno',
            'birthday' => now()->subYears(25)->toDateString(),
        ]);

        Beneficiary::query()->create([
            'agent_id' => $agentId,
            'first_name' => 'Beneficiario',
            'last_name' => 'Uno',
        ]);

        Beneficiary::query()->create([
            'agent_id' => $otherAgentId,
            'first_name' => 'Beneficiario',
            'last_name' => 'Ajeno',
        ]);

        Policy::query()->create([
            'agent_id' => $agentId,
            'status' => Policy::STATUS_ACTIVE,
            'insured_id' => null,
            'created_at' => now()->subMonth(),
        ]);

        Policy::query()->create([
            'agent_id' => $agentId,
            'status' => Policy::STATUS_DRAFT,
            'insured_id' => null,
            'created_at' => now()->subMonths(2),
        ]);

        Policy::query()->create([
            'agent_id' => $otherAgentId,
            'status' => Policy::STATUS_EXPIRED,
            'insured_id' => null,
            'created_at' => now()->subMonth(),
        ]);

        $paidCommission = AgentCommission::query()->create([
            'agent_id' => $agentId,
            'insurer_name' => 'Insurer',
            'concept' => 'Comisión pagada',
            'period' => now()->format('Y-m'),
            'amount' => 1000,
            'status' => 'pending',
        ]);

        $payment = AgentCommissionPayment::query()->create([
            'agent_id' => $agentId,
            'insurer_name' => 'Insurer',
            'payment_date' => now()->toDateString(),
            'amount' => 1000,
            'status' => 'posted',
        ]);

        AgentCommissionPaymentLine::query()->create([
            'payment_id' => $payment->id,
            'commission_id' => $paidCommission->id,
            'amount_applied' => 1000,
        ]);

        AgentCommission::query()->create([
            'agent_id' => $agentId,
            'insurer_name' => 'Insurer',
            'concept' => 'Comisión pendiente',
            'period' => now()->format('Y-m'),
            'amount' => 500,
            'status' => 'pending',
        ]);

        AgentCommission::query()->create([
            'agent_id' => $otherAgentId,
            'insurer_name' => 'Insurer',
            'concept' => 'Comisión ajena',
            'period' => now()->format('Y-m'),
            'amount' => 999,
            'status' => 'pending',
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->where('kpis.polizas_total', 2)
                ->where('kpis.contratantes_total', 1)
                ->where('kpis.asegurados_total', 1)
                ->where('kpis.beneficiarios_total', 1)
                ->where('kpis.vistas_30d', 120)
                ->where('kpis.leads_30d', 2)
                ->where('kpis.conversion_30d', 1.67)
                ->where('pies.leads.series', [1, 0, 1, 0])
                ->where('pies.polizas.series', [1, 0, 1])
                ->where('pies.comisiones.series', [1, 1])
                ->has('barras.categories', 6)
                ->has('lineas.meses', 12)
            );

        Carbon::setTestNow();
    }
}
