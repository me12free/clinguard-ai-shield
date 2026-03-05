<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Models\Policy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PolicyController extends Controller
{
    /** List policies for the authenticated user's organization. */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $orgId = $request->query('organization_id', $user?->organization_id);
        if (!$orgId) {
            return response()->json(['data' => []]);
        }
        $policies = Policy::where('organization_id', $orgId)->get();
        return response()->json(['data' => $policies]);
    }

    /** Update a policy (must belong to user's organization). */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $policy = Policy::find($id);
        if (!$policy || $policy->organization_id !== $user?->organization_id) {
            return response()->json(['message' => 'Policy not found.'], 404);
        }
        $policy->update($request->only([
            'policy_name',
            'phi_categories',
            'enforcement_action',
            'confidence_threshold',
        ]));

        AuditEvent::create([
            'user_id' => $user->id,
            'organization_id' => $user->organization_id,
            'event_type' => 'policy_update',
            'detected_categories' => null,
        ]);

        return response()->json($policy->fresh());
    }
}
