<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class HelloController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'message' => 'ClinGuard API is running.',
            'service' => 'Laravel',
        ]);
    }
}
