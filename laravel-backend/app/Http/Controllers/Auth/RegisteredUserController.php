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
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $roleId = DB::table('roles')->where('role_name', 'clinician')->value('id');
        $orgId = DB::table('organizations')->value('id');

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->string('password')),
            'role_id' => $roleId,
            'organization_id' => $orgId,
        ]);

        event(new Registered($user));

        Auth::login($user);

        $token = $user->createToken('spa')->plainTextToken;

        $user->load('role', 'organization');
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role_id' => $user->role_id,
            'organization_id' => $user->organization_id,
            'role' => $user->role ? [
                'id' => $user->role->id,
                'role_name' => $user->role->role_name,
                'permissions' => $user->role->permissions ?? [],
            ] : null,
        ];

        return response()->json(['token' => $token, 'user' => $userData], 201);
    }
}
