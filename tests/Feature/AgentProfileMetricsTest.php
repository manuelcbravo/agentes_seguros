<?php

namespace Tests\Feature;

use App\Models\Agent;
use App\Models\AgentProfile;
use App\Models\AgentProfileViewStat;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AgentProfileMetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_profile_edit_page_includes_metrics_summary(): void
    {
        Carbon::setTestNow('2026-02-26 12:00:00');

        $user = User::factory()->create();
        $agent = Agent::query()->create([
            'user_id' => $user->id,
            'name' => 'Agente Métricas',
            'email' => 'metricas@example.test',
            'phone' => '555-0011',
        ]);

        AgentProfile::query()->create([
            'agent_id' => $agent->id,
            'display_name' => $agent->name,
            'public_slug' => 'agente-metricas',
            'is_public_enabled' => true,
        ]);

        AgentProfileViewStat::query()->create([
            'agent_id' => $agent->id,
            'date' => now()->toDateString(),
            'views_total' => 40,
            'views_unique' => 30,
        ]);

        AgentProfileViewStat::query()->create([
            'agent_id' => $agent->id,
            'date' => now()->subDays(10)->toDateString(),
            'views_total' => 60,
            'views_unique' => 45,
        ]);

        Lead::query()->create([
            'agent_id' => $agent->id,
            'first_name' => 'Lead',
            'last_name' => 'Reciente',
            'phone' => '5512345678',
            'source' => 'perfil_web',
            'status' => 'nuevo',
            'created_at' => now()->subDays(3),
        ]);

        Lead::query()->create([
            'agent_id' => $agent->id,
            'first_name' => 'Lead',
            'last_name' => 'Mensual',
            'phone' => '5512345679',
            'source' => 'perfil_web',
            'status' => 'nuevo',
            'created_at' => now()->subDays(20),
        ]);

        $this->actingAs($user)
            ->get(route('agent-profile.edit'))
            ->assertInertia(fn ($page) => $page
                ->component('agent-profile/edit')
                ->where('summary.views_today', 40)
                ->where('summary.views_last_30_days', 100)
                ->where('summary.leads_last_7_days', 1)
                ->where('summary.leads_last_30_days', 2)
                ->where('summary.leads_total', 2)
                ->where('summary.conversion_rate', 2)
                ->has('summary.recent_profile_leads', 2)
            );

        Carbon::setTestNow();
    }
}
