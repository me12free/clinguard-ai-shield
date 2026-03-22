<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\AuditEvent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $user = $request->user()->load('role');
        $token = $user->createToken('spa')->plainTextToken;

        AuditEvent::create([
            'user_id' => $user->id,
            'organization_id' => $user->organization_id,
            'event_type' => 'login',
            'detected_categories' => null,
        ]);

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): Response|JsonResponse
    {
        if ($request->bearerToken()) {
            $request->user()?->currentAccessToken()?->delete();
            return response()->json(['message' => 'Logged out']);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(\App\Models\User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'organization_id' => $user->organization_id,
            'role' => $user->role ? [
                'role_name' => $user->role->role_name,
                'permissions' => $user->role->permissions,
            ] : null,
        ];
    }
}
