<?php

return [
    'api_key' => env('OPENAI_API_KEY'),
    'organization' => env('OPENAI_ORGANIZATION'),
    'project' => env('OPENAI_PROJECT'),
    'base_url' => env('OPENAI_BASE_URL'),
    'base_uri' => env('OPENAI_BASE_URL'),
    'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
    'request_timeout' => env('OPENAI_REQUEST_TIMEOUT', 30),
    'connect_timeout' => env('OPENAI_CONNECT_TIMEOUT', 15),
    'policy_ai_process_sync' => (bool) env('IA_PROCESS_SYNC', false),
];
