<?php

namespace App\Services\OpenAI;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAiClient
{
    public function uploadFile(string $filename, string $mime, string $contents, string $purpose = 'assistants'): string
    {
        $response = $this->httpClient()
            ->attach('file', $contents, $filename, ['Content-Type' => $mime])
            ->post('/files', [
                'purpose' => $purpose,
            ]);

        $this->throwIfFailed($response->status(), $response->json(), $response->body());

        $fileId = data_get($response->json(), 'id');

        if (! is_string($fileId) || $fileId === '') {
            throw new RuntimeException('OpenAI no devolvió un file_id válido.');
        }

        return $fileId;
    }

    public function extractPolicyJsonWithFiles(string $systemPrompt, string $userPrompt, array $fileIds): string
    {
        $inputContent = [
            [
                'type' => 'input_text',
                'text' => $userPrompt,
            ],
        ];

        foreach ($fileIds as $fileId) {
            $inputContent[] = [
                'type' => 'input_file',
                'file_id' => $fileId,
            ];
        }

        try {
            $response = $this->httpClient()->post('/responses', [
                'model' => $this->model(),
                'temperature' => 0,
                'input' => [
                    [
                        'role' => 'system',
                        'content' => [
                            [
                                'type' => 'input_text',
                                'text' => $systemPrompt,
                            ],
                        ],
                    ],
                    [
                        'role' => 'user',
                        'content' => $inputContent,
                    ],
                ],
            ]);

            $this->throwIfFailed($response->status(), $response->json(), $response->body());

            $content = data_get($response->json(), 'output_text');

            if (! is_string($content) || trim($content) === '') {
                $content = data_get($response->json(), 'output.0.content.0.text');
            }

            if (! is_string($content) || trim($content) === '') {
                throw new RuntimeException('OpenAI no devolvió texto de extracción.');
            }

            return $content;
        } catch (ConnectionException $exception) {
            throw new RuntimeException('No se pudo conectar con OpenAI: '.$exception->getMessage(), previous: $exception);
        } catch (RequestException $exception) {
            throw new RuntimeException('Error al invocar OpenAI: '.$exception->getMessage(), previous: $exception);
        }
    }

    private function httpClient(): PendingRequest
    {
        $apiKey = (string) config('openai.api_key');

        if ($apiKey === '') {
            throw new RuntimeException('OPENAI_API_KEY no está configurada.');
        }

        return Http::baseUrl($this->baseUrl())
            ->withToken($apiKey)
            ->acceptJson()
            ->asJson()
            ->timeout((int) config('openai.request_timeout', 60))
            ->connectTimeout((int) config('openai.connect_timeout', 15));
    }

    private function baseUrl(): string
    {
        return rtrim((string) (config('openai.base_url') ?: config('openai.base_uri') ?: 'https://api.openai.com/v1'), '/');
    }

    private function model(): string
    {
        return (string) (config('openai.model') ?: 'gpt-4o-mini');
    }

    private function throwIfFailed(int $status, mixed $json, string $body): void
    {
        if ($status < 400) {
            return;
        }

        $apiMessage = (string) data_get($json, 'error.message', $body);

        throw new RuntimeException("OpenAI devolvió error {$status}: {$apiMessage}");
    }
}
