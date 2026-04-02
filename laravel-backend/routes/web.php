<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

/**
 * Browser-friendly redirects so opening backend auth routes directly
 * sends users to the SPA instead of showing "GET method not supported".
 */
Route::get('/login', function () {
    $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:8080'), '/');
    return redirect()->away($frontend.'/login');
});

Route::get('/register', function () {
    $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:8080'), '/');
    return redirect()->away($frontend.'/register');
});

require __DIR__.'/auth.php';
