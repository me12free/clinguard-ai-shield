<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Support\RoleAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Lists persisted chat rows — clinicians: own only; security admin: org; system admin: all or filter.
 */
class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load('role');

        if (! RoleAccess::hasPermission($user, 'chat')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $query = Conversation::query()->orderByDesc('created_at')->limit(200);

        if (RoleAccess::canViewAllConversations($user)) {
            if ($request->filled('organization_id')) {
                $query->whereHas('user', function ($q) use ($request) {
                    $q->where('organization_id', (int) $request->query('organization_id'));
                });
            }
        } elseif (RoleAccess::canViewOrgConversations($user)) {
            $orgId = $user->organization_id;
            if (! $orgId) {
                return response()->json(['data' => []]);
            }
            $query->whereHas('user', function ($q) use ($orgId) {
                $q->where('organization_id', $orgId);
            });
        } else {
            $query->where('user_id', $user->id);
        }

        $rows = $query->with(['user:id,name,email,organization_id'])->get();

        return response()->json(['data' => $rows]);
    }
}
