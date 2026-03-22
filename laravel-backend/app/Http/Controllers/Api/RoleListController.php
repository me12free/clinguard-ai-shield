<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Support\RoleAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/** Read-only role list for admin user forms (system admin only). */
class RoleListController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $user = Auth::user()->load('role');
        if (! RoleAccess::canManageUsers($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json([
            'data' => Role::query()->orderBy('id')->get(['id', 'role_name', 'permissions']),
        ]);
    }
}
