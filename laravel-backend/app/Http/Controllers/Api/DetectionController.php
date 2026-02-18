<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DetectRequest;
use App\Services\DetectionService;
use Illuminate\Http\JsonResponse;

/** PHI detection endpoint: returns spans for redaction. */
class DetectionController extends Controller
{
    public function __construct(private DetectionService $detection) {}

    public function __invoke(DetectRequest $request): JsonResponse
    {
        $spans = $this->detection->detect($request->validated('text'));
        return response()->json(['spans' => $spans]);
    }
}
