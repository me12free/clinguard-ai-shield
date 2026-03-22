<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdminUserRequest;
use App\Http\Requests\UpdateAdminUserRequest;
use App\Models\AuditEvent;
use App\Models\User;
use App\Support\RoleAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    public function index(): JsonResponse
    {
        $user = Auth::user()->load('role');
        if (! RoleAccess::canManageUsers($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $query = User::query()->with(['role:id,role_name', 'organization:id,name'])->orderBy('id');

        if (! RoleAccess::isSystemAdmin($user)) {
            $query->where('organization_id', $user->organization_id);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(StoreAdminUserRequest $request): JsonResponse
    {
        $user = Auth::user()->load('role');
        if (! RoleAccess::canManageUsers($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validated();
        if (! RoleAccess::isSystemAdmin($user)) {
            $data['organization_id'] = $user->organization_id;
        }

        $newUser = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role_id' => $data['role_id'],
            'organization_id' => $data['organization_id'],
        ]);

        AuditEvent::create([
            'user_id' => $user->id,
            'organization_id' => $newUser->organization_id,
            'event_type' => 'user_create',
            'detected_categories' => null,
        ]);

        return response()->json($newUser->load(['role:id,role_name', 'organization:id,name']), 201);
    }

    public function update(UpdateAdminUserRequest $request, int $id): JsonResponse
    {
        $actor = Auth::user()->load('role');
        if (! RoleAccess::canManageUsers($actor)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $target = User::find($id);
        if (! $target) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if (! $this->actorMayManageUser($actor, $target)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validated();
        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if (! RoleAccess::isSystemAdmin($actor) && isset($data['organization_id'])) {
            unset($data['organization_id']);
        }

        $target->update($data);

        AuditEvent::create([
            'user_id' => $actor->id,
            'organization_id' => $target->organization_id,
            'event_type' => 'user_update',
            'detected_categories' => null,
        ]);

        return response()->json($target->fresh()->load(['role:id,role_name', 'organization:id,name']));
    }

    public function destroy(int $id): JsonResponse
    {
        $actor = Auth::user()->load('role');
        if (! RoleAccess::canManageUsers($actor)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($actor->id === $id) {
            return response()->json(['message' => 'Cannot delete your own account.'], 422);
        }

        $target = User::find($id);
        if (! $target) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if (! $this->actorMayManageUser($actor, $target)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $orgId = $target->organization_id;
        $target->delete();

        AuditEvent::create([
            'user_id' => $actor->id,
            'organization_id' => $orgId,
            'event_type' => 'user_delete',
            'detected_categories' => null,
        ]);

        return response()->noContent();
    }

    private function actorMayManageUser(User $actor, User $target): bool
    {
        if (RoleAccess::isSystemAdmin($actor)) {
            return true;
        }

        return (int) $target->organization_id === (int) $actor->organization_id;
    }
}
