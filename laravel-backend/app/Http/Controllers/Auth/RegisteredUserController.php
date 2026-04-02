<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     * New accounts get the **clinician** role and the first organization (when seeded)
     * so chat, detect, and conversations work immediately — same as seeded demo users.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): JsonJsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $roleId = DB::table('roles')->where('role_name', 'clinician')->value('id');
        $orgId = DB::table('organizations')->value('id');

        $roleId = DB::table('roles')->where('role_name', 'clinician')->value('id');
        $orgId = DB::table('organizations')->orderBy('id')->value('id');

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->string('password')),
            'role_id' => $roleId,
            'organization_id' => $orgId,
        ];
        if ($roleId !== null) {
            $data['role_id'] = $roleId;
        }
        if ($orgId !== null) {
            $data['organization_id'] = $orgId;
        }

        $user = User::create($data);

        event(new Registered($user));

        if ($request->hasSession()) {
            Auth::login($user);
        }

        $user->load('role');
        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
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
