<?php

namespace Tests\Feature\Polizas;

use App\Jobs\ProcessPolicyAiImportJob;
use App\Models\PolicyAiImport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
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
}
