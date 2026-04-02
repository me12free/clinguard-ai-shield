<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditEventController extends Controller
{
    /** List audit events for the user's organization. */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = AuditEvent::query();
        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        }
        if ($request->has('event_type')) {
            $query->where('event_type', $request->query('event_type'));
        }
        $events = $query->orderByDesc('created_at')->limit(200)->get(['id', 'user_id', 'organization_id', 'event_type', 'detected_categories', 'created_at']);
        return response()->json(['data' => $events]);
    }
}
