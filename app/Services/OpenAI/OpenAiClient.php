<?php

namespace App\Services\OpenAI;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAiClient
{
    public function chatJson(array $messages, array $options = []): array
    {
        $apiKey = (string) config('openai.api_key');

        if ($apiKey === '') {
            throw new RuntimeException('OPENAI_API_KEY no está configurada.');
        }

        $baseUrl = rtrim((string) (config('openai.base_url') ?: config('openai.base_uri') ?: 'https://api.openai.com/v1'), '/');
        $model = (string) ($options['model'] ?? config('openai.model') ?? env('OPENAI_MODEL', 'gpt-4o-mini'));
        $timeout = (int) ($options['timeout'] ?? config('openai.request_timeout', 60));
        $connectTimeout = (int) ($options['connect_timeout'] ?? 15);

        try {
            $response = Http::baseUrl($baseUrl)
                ->withToken($apiKey)
                ->acceptJson()
                ->asJson()
                ->timeout($timeout)
                ->connectTimeout($connectTimeout)
                ->post('/chat/completions', [
                    'model' => $model,
                    'messages' => $messages,
                    'temperature' => $options['temperature'] ?? 0,
                ]);

            if ($response->failed()) {
                $status = $response->status();
                $apiMessage = (string) data_get($response->json(), 'error.message', $response->body());
                throw new RuntimeException("OpenAI devolvió error {$status}: {$apiMessage}");
            }

            $content = data_get($response->json(), 'choices.0.message.content');

            if (! is_string($content) || trim($content) === '') {
                throw new RuntimeException('OpenAI no devolvió contenido en choices[0].message.content.');
            }

            return [
                'content' => $content,
            ];
        } catch (ConnectionException $exception) {
            throw new RuntimeException('No se pudo conectar con OpenAI: '.$exception->getMessage(), previous: $exception);
        } catch (RequestException $exception) {
            throw new RuntimeException('Error al invocar OpenAI: '.$exception->getMessage(), previous: $exception);
        }
    }
}
