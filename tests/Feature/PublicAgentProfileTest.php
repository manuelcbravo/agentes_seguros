<?php

namespace Tests\Feature;

use App\Models\Agent;
use App\Models\AgentProfile;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicAgentProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_profile_route_renders_when_enabled(): void
    {
        [$agent, $profile] = $this->createProfile(true);

        $response = $this->get(route('public-agent-profile.show', $profile->public_slug));

        $response->assertOk();
        $response->assertSee($agent->name);
    }

    public function test_public_profile_route_returns_404_when_disabled(): void
    {
        [, $profile] = $this->createProfile(false);

        $this->get(route('public-agent-profile.show', $profile->public_slug))
            ->assertNotFound();
    }

    public function test_contact_form_creates_lead_with_perfil_web_source(): void
    {
        [, $profile] = $this->createProfile(true);

        $response = $this->post(route('public-agent-profile.contact', $profile->public_slug), [
            'name' => 'Ana Perez',
            'phone' => '5512345678',
            'email' => 'ana@example.com',
            'message' => 'Quiero una cotización',
            'product_interest' => 'Gastos médicos',
            'consent' => '1',
            'utm_source' => 'google',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('leads', [
            'agent_id' => $profile->agent_id,
            'first_name' => 'Ana',
            'last_name' => 'Perez',
            'phone' => '5512345678',
            'email' => 'ana@example.com',
            'source' => 'perfil_web',
            'message' => 'Quiero una cotización',
        ]);

        $lead = Lead::query()->firstOrFail();
        $this->assertSame($profile->public_slug, $lead->metadata['profile_slug'] ?? null);
        $this->assertSame('google', $lead->metadata['utm_source'] ?? null);
    }

    private function createProfile(bool $enabled): array
    {
        $user = User::factory()->create();

        $agent = Agent::query()->create([
            'user_id' => $user->id,
            'name' => 'Agente Demo',
            'email' => 'agente@example.test',
            'phone' => '555-1234',
        ]);

        $profile = AgentProfile::query()->create([
            'agent_id' => $agent->id,
            'display_name' => $agent->name,
            'public_slug' => 'agente-demo',
            'is_public_enabled' => $enabled,
            'contact_form_enabled' => true,
            'specialties' => ['Gastos médicos'],
        ]);

        return [$agent, $profile];
    }
}
