<?php

namespace Tests\Feature\Polizas;

use App\Models\PolicyAiImport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FailStuckPolicyAiImportsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_marks_processing_imports_with_stale_heartbeat_as_failed(): void
    {
        $agentId = (string) User::factory()->create()->agent_id;

        $stuckImport = PolicyAiImport::query()->create([
            'agent_id' => $agentId,
            'client_id' => null,
            'original_filename' => 'stuck.pdf',
            'mime_type' => 'application/pdf',
            'disk' => 'public',
            'path' => 'policy-ai/stuck.pdf',
            'status' => PolicyAiImport::STATUS_PROCESSING,
            'processing_stage' => 'ai_request',
            'processing_heartbeat_at' => now()->subMinutes(6),
        ]);

        $healthyImport = PolicyAiImport::query()->create([
            'agent_id' => $agentId,
            'client_id' => null,
            'original_filename' => 'healthy.pdf',
            'mime_type' => 'application/pdf',
            'disk' => 'public',
            'path' => 'policy-ai/healthy.pdf',
            'status' => PolicyAiImport::STATUS_PROCESSING,
            'processing_stage' => 'saving',
            'processing_heartbeat_at' => now()->subMinutes(2),
        ]);

        $this->artisan('policy-ai:fail-stuck-imports')
            ->expectsOutput('Marked 1 stuck import(s) as failed.')
            ->assertSuccessful();

        $stuckImport->refresh();
        $healthyImport->refresh();

        $this->assertSame(PolicyAiImport::STATUS_FAILED, $stuckImport->status);
        $this->assertSame('failed', $stuckImport->processing_stage);
        $this->assertSame('Procesamiento expiró (worker detenido o error). Reintenta.', $stuckImport->error_message);
        $this->assertNotNull($stuckImport->processing_ended_at);

        $this->assertSame(PolicyAiImport::STATUS_PROCESSING, $healthyImport->status);
    }
}
