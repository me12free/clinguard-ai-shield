<?php

use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\DetectionController;
use App\Http\Controllers\Api\HelloController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public
Route::get('/hello', HelloController::class)->middleware('throttle:60,1');

// Protected: require Sanctum token, rate limit
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::get('/user', fn (Request $request) => response()->json($request->user()));
    Route::post('/logout', function (Request $request) {
        $request->user()?->currentAccessToken()?->delete();
        return response()->json(['message' => 'Logged out']);
    });
    Route::post('/detect', DetectionController::class);
    Route::post('/chat', ChatController::class);
});
