<?php

return [
    'detection_engine_url' => env('DETECTION_ENGINE_URL', 'http://127.0.0.1:8001'),
    /** Seconds to wait for Python /detect (ML cold start can exceed 10s). */
    'detection_engine_timeout' => (int) env('DETECTION_ENGINE_TIMEOUT', 120),
    'openai_api_key' => env('OPENAI_API_KEY', ''),
    'openai_model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
    'allow_emergency_bypass' => filter_var(env('ALLOW_EMERGENCY_BYPASS', false), FILTER_VALIDATE_BOOLEAN),
];
