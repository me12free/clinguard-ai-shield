<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePolicyRequest;
use App\Models\AuditEvent;
use App\Models\Policy;
use App\Support\RoleAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PolicyController extends Controller
{
    /** List policies — security admin: own org; system admin: all orgs or filter by organization_id. */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user()->load('role');
        if (! RoleAccess::canManagePolicies($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $query = Policy::query()->with('organization:id,name');

        if (RoleAccess::isSystemAdmin($user)) {
            if ($request->filled('organization_id')) {
                $query->where('organization_id', (int) $request->query('organization_id'));
            }
        } else {
            $orgId = $user?->organization_id;
            if (! $orgId) {
                return response()->json(['data' => []]);
            }
            $query->where('organization_id', $orgId);
        }

        return response()->json(['data' => $query->orderBy('organization_id')->orderBy('id')->get()]);
    }

    public function store(StorePolicyRequest $request): JsonResponse
    {
        $user = Auth::user()->load('role');
        if (! RoleAccess::canManagePolicies($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $orgId = $request->validated('organization_id') ?? $user?->organization_id;
        if (! RoleAccess::isSystemAdmin($user)) {
            $orgId = $user?->organization_id;
        }
        if (! $orgId) {
            return response()->json(['message' => 'Organization required.'], 422);
        }

        $policy = Policy::create([
            'organization_id' => $orgId,
            'policy_name' => $request->validated('policy_name'),
            'phi_categories' => $request->validated('phi_categories'),
            'enforcement_action' => $request->validated('enforcement_action', 'redact'),
            'confidence_threshold' => $request->validated('confidence_threshold', 0.85),
        ]);

        AuditEvent::create([
            'user_id' => $user->id,
            'organization_id' => $orgId,
            'event_type' => 'policy_create',
            'detected_categories' => null,
        ]);

        return response()->json($policy->fresh()->load('organization:id,name'), 201);
    }

    /** Update a policy (must belong to allowed organization). */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = Auth::user()->load('role');
        if (! RoleAccess::canManagePolicies($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $policy = Policy::find($id);
        if (! $policy) {
            return response()->json(['message' => 'Policy not found.'], 404);
        }

        if (! $this->userMayAccessPolicy($user, $policy)) {
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
            'organization_id' => $policy->organization_id,
            'event_type' => 'policy_update',
            'detected_categories' => null,
        ]);

        return response()->json($policy->fresh()->load('organization:id,name'));
    }

    public function destroy(int $id): JsonResponse
    {
        $user = Auth::user()->load('role');
        if (! RoleAccess::canManagePolicies($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $policy = Policy::find($id);
        if (! $policy) {
            return response()->json(['message' => 'Policy not found.'], 404);
        }

        if (! $this->userMayAccessPolicy($user, $policy)) {
            return response()->json(['message' => 'Policy not found.'], 404);
        }

        $orgId = $policy->organization_id;
        $policy->delete();

        AuditEvent::create([
            'user_id' => $user->id,
            'organization_id' => $orgId,
            'event_type' => 'policy_delete',
            'detected_categories' => null,
        ]);

        return response()->noContent();
    }

    private function userMayAccessPolicy(\App\Models\User $user, Policy $policy): bool
    {
        if (RoleAccess::isSystemAdmin($user)) {
            return true;
        }

        return (int) $policy->organization_id === (int) $user->organization_id;
    }
}
