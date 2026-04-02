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
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrganizationRequest;
use App\Http\Requests\UpdateOrganizationRequest;
use App\Models\AuditEvent;
use App\Models\Organization;
use App\Support\RoleAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class OrganizationController extends Controller
{
    public function index(): JsonResponse
    {
        $user = Auth::user()->load('role');
        if (! RoleAccess::canManageOrganizations($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json(['data' => Organization::query()->orderBy('name')->get()]);
    }

    public function store(StoreOrganizationRequest $request): JsonResponse
    {
        $user = Auth::user()->load('role');
        if (! RoleAccess::canManageOrganizations($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $org = Organization::create($request->validated());

        AuditEvent::create([
            'user_id' => $user->id,
            'organization_id' => $org->id,
            'event_type' => 'organization_create',
            'detected_categories' => null,
        ]);

        return response()->json($org->fresh(), 201);
    }

    public function update(UpdateOrganizationRequest $request, int $id): JsonResponse
    {
        $user = Auth::user()->load('role');
        if (! RoleAccess::canManageOrganizations($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $org = Organization::find($id);
        if (! $org) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $org->update($request->validated());

        AuditEvent::create([
            'user_id' => $user->id,
            'organization_id' => $org->id,
            'event_type' => 'organization_update',
            'detected_categories' => null,
        ]);

        return response()->json($org->fresh());
    }

    public function destroy(int $id): JsonResponse
    {
        $user = Auth::user()->load('role');
        if (! RoleAccess::canManageOrganizations($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $org = Organization::find($id);
        if (! $org) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if ($org->users()->exists()) {
            return response()->json(['message' => 'Cannot delete organization with users. Reassign users first.'], 422);
        }

        $orgId = $org->id;
        $org->delete();

        AuditEvent::create([
            'user_id' => $user->id,
            'organization_id' => $orgId,
            'event_type' => 'organization_delete',
            'detected_categories' => null,
        ]);

        return response()->noContent();
    }
}
