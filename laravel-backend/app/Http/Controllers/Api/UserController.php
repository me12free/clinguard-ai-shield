<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /** List users in the same organization (system_admin). */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = User::query()->select('id', 'name', 'email', 'role_id', 'organization_id', 'created_at');
        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        }
        $users = $query->orderBy('name')->get();
        return response()->json(['data' => $users]);
    }

    /** Update a user (role_id, organization_id, name) - same org only. */
    public function update(Request $request, int $id): JsonResponse
    {
        $auth = Auth::user();
        $target = User::find($id);
        if (! $target || ($auth->organization_id && $target->organization_id !== $auth->organization_id)) {
            return response()->json(['message' => 'User not found.'], 404);
        }
        $target->update($request->only(['name', 'role_id', 'organization_id']));
        return response()->json($target->fresh(['role', 'organization']));
    }
}
