<?php

namespace Tests\Feature\OpenAI;

use App\Services\OpenAI\OpenAiClient;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OpenAiClientTest extends TestCase
{
    public function test_upload_file_uses_multipart_form_data_and_files_endpoint(): void
    {
        config()->set('openai.api_key', 'test-key');
        config()->set('openai.base_url', 'https://api.openai.com/v1');

        Http::fake([
            'https://api.openai.com/v1/files' => Http::response(['id' => 'file_123'], 200),
        ]);

        $client = app(OpenAiClient::class);

        $fileId = $client->uploadFile('poliza.pdf', 'application/pdf', 'fake-content');

        $this->assertSame('file_123', $fileId);

        Http::assertSent(function ($request): bool {
            $contentType = $request->header('Content-Type')[0] ?? '';

            return $request->url() === 'https://api.openai.com/v1/files'
                && str_contains($contentType, 'multipart/form-data;')
                && ! str_contains($contentType, 'application/json')
                && str_contains($request->body(), 'name="purpose"')
                && str_contains($request->body(), 'assistants');
        });
    }
}
