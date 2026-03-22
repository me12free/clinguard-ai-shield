<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Middleware\RedirectIfAuthenticated as Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Default RedirectIfAuthenticated sends already-authenticated users to GET / (or home).
 * fetch() follows that redirect; the final JSON has no Sanctum token, so the SPA shows
 * "No token received". For JSON login/register, clear the web session and continue so
 * credentials are processed and a token is returned (also fixes switching accounts).
 */
class RedirectIfAuthenticated extends Middleware
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                if ($this->isJsonSpaAuthRequest($request)) {
                    Auth::guard($guard)->logout();
                    if ($request->hasSession()) {
                        $request->session()->invalidate();
                        $request->session()->regenerateToken();
                    }

                    return $next($request);
                }

                return redirect($this->redirectTo($request));
            }
        }

        return $next($request);
    }

    protected function isJsonSpaAuthRequest(Request $request): bool
    {
        if (! $request->isMethod('POST')) {
            return false;
        }

        if (! $request->expectsJson() && ! $request->wantsJson()) {
            return false;
        }

        return $request->routeIs('login', 'register');
    }
}
