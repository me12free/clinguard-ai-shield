<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ConversationController extends Controller
{
    /** List conversations for the authenticated user (own only for view_own_conversations; org scope if audit). */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Conversation::query()->where('user_id', $user->id);
        $conversations = $query->orderByDesc('created_at')->limit(100)->get(['id', 'prompt_redacted', 'response_summary', 'created_at']);
        return response()->json(['data' => $conversations]);
    }
}
