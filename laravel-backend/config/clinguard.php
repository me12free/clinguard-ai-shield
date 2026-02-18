<?php

return [
    'detection_engine_url' => env('DETECTION_ENGINE_URL', 'http://127.0.0.1:8001'),
    'openai_api_key' => env('OPENAI_API_KEY', ''),
    'openai_model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
];
