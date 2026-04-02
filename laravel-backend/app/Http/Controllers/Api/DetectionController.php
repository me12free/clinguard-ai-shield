<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DetectRequest;
use App\Services\DetectionService;
use App\Support\RoleAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/** PHI detection endpoint: returns spans for redaction. */
class DetectionController extends Controller
{
    public function __construct(private DetectionService $detection) {}

    public function __invoke(DetectRequest $request): JsonResponse
    {
        $user = Auth::user()->load('role');
        if (! RoleAccess::hasPermission($user, 'detect')) {
            return response()->json(['message' => 'Forbidden: detect permission required.'], 403);
        }

        $out = $this->detection->detect($request->validated('text'));

        return response()->json([
            'spans' => $out['spans'] ?? [],
            'engine_error' => $out['engine_error'] ?? null,
        ]);
    }
}
