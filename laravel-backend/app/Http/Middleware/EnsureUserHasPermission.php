<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPermission
{
    /**
     * @param  \Closure(Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$permissions  Required permission(s); user needs at least one.
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user->load('role');

        $required = [];
        foreach ($permissions as $permission) {
            foreach (preg_split('/\s*,\s*/', $permission, -1, PREG_SPLIT_NO_EMPTY) as $part) {
                $required[] = $part;
            }
        }

        foreach ($required as $permission) {
            if ($user->hasPermission($permission)) {
                return $next($request);
            }
        }

        return response()->json(['message' => 'Permission denied.'], 403);
    }
}
