<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuditEventController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\DetectionController;
use App\Http\Controllers\Api\HelloController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\RoleListController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public
Route::get('/hello', HelloController::class)->middleware('throttle:60,1');

// Protected: require Sanctum token, rate limit (MySQL-backed; no Supabase)
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::get('/user', function (Request $request) {
        $user = $request->user()->load('role');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'organization_id' => $user->organization_id,
            'role' => $user->role ? [
                'role_name' => $user->role->role_name,
                'permissions' => $user->role->permissions,
            ] : null,
        ]);
    });
    Route::post('/logout', function (Request $request) {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out']);
    });

    Route::post('/detect', DetectionController::class);
    Route::post('/chat', ChatController::class);

    Route::get('/conversations', [ConversationController::class, 'index']);

    Route::get('/policies', [PolicyController::class, 'index']);
    Route::post('/policies', [PolicyController::class, 'store']);
    Route::put('/policies/{id}', [PolicyController::class, 'update']);
    Route::delete('/policies/{id}', [PolicyController::class, 'destroy']);

    Route::get('/audit-events', [AuditEventController::class, 'index']);

    Route::get('/roles', RoleListController::class);

    Route::get('/organizations', [OrganizationController::class, 'index']);
    Route::post('/organizations', [OrganizationController::class, 'store']);
    Route::put('/organizations/{id}', [OrganizationController::class, 'update']);
    Route::delete('/organizations/{id}', [OrganizationController::class, 'destroy']);

    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::put('/admin/users/{id}', [AdminUserController::class, 'update']);
    Route::delete('/admin/users/{id}', [AdminUserController::class, 'destroy']);
});
