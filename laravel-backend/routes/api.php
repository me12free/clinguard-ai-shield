<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/api/hello', function (Request $request) {
    return response()->json(['message' => 'Hello from Laravel API!']);
});
