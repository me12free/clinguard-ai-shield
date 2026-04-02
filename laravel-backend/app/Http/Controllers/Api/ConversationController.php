<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Support\RoleAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ConversationController extends Controller
{
    public function index(): JsonResponse
    {
        $user = Auth::user()?->load('role');
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $q = Conversation::query()->latest();

        // Scope based on role permissions. System admin can view all, security admin can view org.
        if (RoleAccess::canViewAllConversations($user)) {
            // no extra filter
        } elseif (RoleAccess::canViewOrgConversations($user)) {
            $q->where('user_id', '!=', null)->whereHas('user', function ($uq) use ($user) {
                $uq->where('organization_id', $user->organization_id);
            });
        } else {
            $q->where('user_id', $user->id);
        }

        $rows = $q->limit(100)->get([
            'id',
            'user_id',
            'prompt_redacted',
            'response_summary',
            'created_at',
        ]);

        return response()->json(['data' => $rows]);
    }
}

