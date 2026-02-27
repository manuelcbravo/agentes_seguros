<?php

namespace Tests\Feature\Polizas;

use App\Jobs\ProcessPolicyAiImportJob;
use App\Models\PolicyAiImport;
use App\Models\User;
use App\Services\PolicyAI\PolicyAiOpenAiProcessor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PolicyAiImportProcessTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_start_manual_processing_for_owned_import(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $import = PolicyAiImport::query()->create([
            'agent_id' => (string) $user->agent_id,
            'client_id' => null,
            'original_filename' => 'poliza.pdf',
            'mime_type' => 'application/pdf',
            'disk' => 'public',
            'path' => 'policy-ai/example.pdf',
            'status' => PolicyAiImport::STATUS_FAILED,
            'error_message' => 'Error previo',
        ]);

        $response = $this->actingAs($user)->post(route('polizas.ia.process', $import));

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Procesamiento iniciado correctamente');

        $import->refresh();

        $this->assertSame(PolicyAiImport::STATUS_PROCESSING, $import->status);
        $this->assertSame('queued', $import->processing_stage);
        $this->assertSame(1, $import->progress);
        $this->assertNotNull($import->processing_started_at);
        $this->assertNull($import->error_message);

        Queue::assertPushed(ProcessPolicyAiImportJob::class, function (ProcessPolicyAiImportJob $job) use ($import): bool {
            return $job->importId === $import->id;
        });
    }

    public function test_user_cannot_process_other_agent_import(): void
    {
        Queue::fake();

        $owner = User::factory()->create();
        $anotherUser = User::factory()->create();

        $import = PolicyAiImport::query()->create([
            'agent_id' => (string) $owner->agent_id,
            'client_id' => null,
            'original_filename' => 'poliza.pdf',
            'mime_type' => 'application/pdf',
            'disk' => 'public',
            'path' => 'policy-ai/example.pdf',
            'status' => PolicyAiImport::STATUS_UPLOADED,
        ]);

        $response = $this->actingAs($anotherUser)->post(route('polizas.ia.process', $import));

        $response->assertForbidden();

        Queue::assertNothingPushed();
    }

    public function test_job_fails_when_s3_file_does_not_exist(): void
    {
        Storage::fake('s3');

        $import = PolicyAiImport::query()->create([
            'agent_id' => (string) User::factory()->create()->agent_id,
            'client_id' => null,
            'original_filename' => 'poliza.pdf',
            'mime_type' => 'application/pdf',
            'disk' => 's3',
            'path' => 'policy-ai/missing.pdf',
            'status' => PolicyAiImport::STATUS_UPLOADED,
        ]);

        $import->files()->create([
            'agent_id' => (string) $import->agent_id,
            'original_filename' => 'poliza.pdf',
            'mime_type' => 'application/pdf',
            'disk' => 's3',
            'path' => 'policy-ai/missing.pdf',
            'size' => 100,
        ]);

        $processor = $this->app->make(PolicyAiOpenAiProcessor::class);

        (new ProcessPolicyAiImportJob($import->id))->handle($processor);

        $import->refresh();

        $this->assertSame(PolicyAiImport::STATUS_FAILED, $import->status);
        $this->assertSame('failed', $import->processing_stage);
        $this->assertSame('No se pudo acceder al archivo en S3. Verifica configuración del disk.', $import->error_message);
        $this->assertNotNull($import->processing_ended_at);
        $this->assertNotNull($import->took_ms);
    }

    public function test_user_can_poll_processing_status_for_owned_import(): void
    {
        $user = User::factory()->create();
        $import = PolicyAiImport::query()->create([
            'agent_id' => (string) $user->agent_id,
            'client_id' => null,
            'original_filename' => 'poliza.pdf',
            'mime_type' => 'application/pdf',
            'disk' => 'public',
            'path' => 'policy-ai/example.pdf',
            'status' => PolicyAiImport::STATUS_PROCESSING,
            'processing_stage' => 'ai_request',
            'progress' => 60,
            'processing_heartbeat_at' => now(),
            'missing_fields' => ['policy.policy_number'],
        ]);

        $response = $this->actingAs($user)->get(route('polizas.ia.status', $import->id));

        $response->assertOk()->assertJson([
            'status' => PolicyAiImport::STATUS_PROCESSING,
            'processing_stage' => 'ai_request',
            'progress' => 60,
            'missing_fields' => ['policy.policy_number'],
        ]);
    }
}
