<?php

namespace App\Services\PolicyAi;

use RuntimeException;
use OpenAI\Laravel\Facades\OpenAI;

class PolicyAiAnalyzer
{
    public function analyze(string $text): array
    {
        $schema = [
            'contractor' => ['first_name' => '', 'middle_name' => '', 'last_name' => '', 'second_last_name' => '', 'rfc' => '', 'email' => '', 'phone' => ''],
            'insured' => ['first_name' => '', 'middle_name' => '', 'last_name' => '', 'second_last_name' => '', 'rfc' => ''],
            'policy' => ['insurer_name' => '', 'policy_number' => '', 'valid_from' => '', 'valid_to' => '', 'currency' => 'MXN', 'payment_frequency' => '', 'premium_total' => null],
            'beneficiaries' => [['name' => '', 'percentage' => null, 'relationship' => '']],
            'notes' => '',
        ];

        $response = OpenAI::responses()->create([
            'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
            'input' => [
                [
                    'role' => 'system',
                    'content' => 'Eres un extractor de datos de pólizas. Responde JSON estricto sin markdown, sin texto adicional. Si no encuentras datos, usa strings vacíos o null.',
                ],
                [
                    'role' => 'user',
                    'content' => 'Extrae los datos de este documento y produce SOLO este JSON con esta estructura exacta: '.json_encode($schema, JSON_UNESCAPED_UNICODE)."\n\nDocumento:\n".$text,
                ],
            ],
            'text' => [
                'format' => [
                    'type' => 'json_schema',
                    'name' => 'policy_extraction',
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'contractor' => ['type' => 'object'],
                            'insured' => ['type' => 'object'],
                            'policy' => ['type' => 'object'],
                            'beneficiaries' => ['type' => 'array'],
                            'notes' => ['type' => 'string'],
                        ],
                        'required' => ['contractor', 'insured', 'policy', 'beneficiaries', 'notes'],
                        'additionalProperties' => false,
                    ],
                ],
            ],
        ]);

        $json = data_get($response->toArray(), 'output.0.content.0.text');

        if (! is_string($json) || trim($json) === '') {
            throw new RuntimeException('La IA no devolvió un JSON válido.');
        }

        $parsed = json_decode($json, true);

        if (! is_array($parsed)) {
            throw new RuntimeException('No se pudo parsear la respuesta de IA.');
        }

        return $parsed;
    }
}
