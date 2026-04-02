<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        /*
         * SPA (Vite on :8080) posts JSON to web routes without a CSRF cookie when the API
         * host differs from the page host (e.g. localhost vs 127.0.0.1) — session cookies
         * are cross-site and CSRF validation fails with 419. Login/register use Sanctum
         * personal access tokens, not session auth, so excluding these routes is safe.
         */
        $middleware->validateCsrfTokens(except: [
            'login',
            'register',
        ]);

        /*
         * Do NOT prepend EnsureFrontendRequestsAreStateful: it applies session + CSRF to /api/*
         * for requests from SANCTUM_STATEFUL_DOMAINS (e.g. localhost:8080). The SPA uses Sanctum
         * Bearer tokens only, not cookie CSRF — those requests would return 419 without X-XSRF-TOKEN.
         * Cookie-based SPA auth would need that middleware + /sanctum/csrf-cookie flow instead.
         */

        $middleware->alias([
            'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            // Override framework guest: JSON login must not 302 to GET / (no token in body).
            'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
            'permission' => \App\Http\Middleware\EnsureUserHasPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Session\TokenMismatchException $e, \Illuminate\Http\Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Session expired or CSRF token mismatch. Refresh the page and try again.',
                ], 419);
            }
        });
    })->create();
