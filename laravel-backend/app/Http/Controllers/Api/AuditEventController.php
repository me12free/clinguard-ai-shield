<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Support\RoleAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditEventController extends Controller
{
    /** Audit log — security admin: own org; system admin: all orgs or filter. */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load('role');
        if (! RoleAccess::canViewAudit($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $query = AuditEvent::query()->orderByDesc('created_at')->limit(200)->with(['user:id,name,email']);

        if (RoleAccess::isSystemAdmin($user)) {
            if ($request->filled('organization_id')) {
                $query->where('organization_id', (int) $request->query('organization_id'));
            }
        } else {
            if (! $user->organization_id) {
                return response()->json(['data' => []]);
            }
            $query->where('organization_id', $user->organization_id);
        }

        return response()->json(['data' => $query->get()]);
    }
}
