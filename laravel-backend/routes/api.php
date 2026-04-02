<?php

use App\Http\Controllers\Api\AuditEventController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\DetectionController;
use App\Http\Controllers\Api\HelloController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public
Route::get('/hello', HelloController::class)->middleware('throttle:60,1');

// Protected: require Sanctum token, rate limit
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        $user->load('role', 'organization');
        $data = $user->toArray();
        $data['role'] = $user->role ? [
            'id' => $user->role->id,
            'role_name' => $user->role->role_name,
            'permissions' => $user->role->permissions ?? [],
        ] : null;
        return response()->json($data);
    });
    Route::post('/logout', function (Request $request) {
        $request->user()?->currentAccessToken()?->delete();
        return response()->json(['message' => 'Logged out']);
    });

    Route::post('/detect', DetectionController::class)->middleware('permission:detect');
    Route::post('/chat', ChatController::class)->middleware('permission:chat');
    Route::get('/conversations', [ConversationController::class, 'index'])->middleware('permission:view_own_conversations');
    Route::get('/policies', [PolicyController::class, 'index'])->middleware('permission:policies');
    Route::put('/policies/{id}', [PolicyController::class, 'update'])->middleware('permission:policies');
    Route::get('/audit-events', [AuditEventController::class, 'index'])->middleware('permission:audit');
    Route::get('/users', [UserController::class, 'index'])->middleware('permission:users');
    Route::put('/users/{id}', [UserController::class, 'update'])->middleware('permission:users');
    Route::get('/organizations', [OrganizationController::class, 'index'])->middleware('permission:organizations');
    Route::put('/organizations/{id}', [OrganizationController::class, 'update'])->middleware('permission:organizations');

    Route::get('/reports/summary', [ReportController::class, 'summary'])->middleware(
        'permission:view_own_conversations,audit,organizations'
    );
    Route::get('/reports/export', [ReportController::class, 'exportPdf'])->middleware(
        'permission:view_own_conversations,audit,organizations'
    );
});
