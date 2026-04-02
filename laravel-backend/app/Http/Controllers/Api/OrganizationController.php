<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    /** List organizations (system_admin). */
    public function index(Request $request): JsonResponse
    {
        $organizations = Organization::query()->orderBy('name')->get();
        return response()->json(['data' => $organizations]);
    }

    /** Update an organization. */
    public function update(Request $request, int $id): JsonResponse
    {
        $org = Organization::find($id);
        if (! $org) {
            return response()->json(['message' => 'Organization not found.'], 404);
        }
        $org->update($request->only(['name', 'subscription_tier', 'configuration']));
        return response()->json($org->fresh());
    }
}
