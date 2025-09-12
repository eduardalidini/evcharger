<?php

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\UserApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Admin API Routes
Route::prefix('admin')->group(function () {
    // Admin Authentication
    Route::post('login', [AdminAuthController::class, 'login']);
    
    // Protected Admin Routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AdminAuthController::class, 'logout']);
        Route::get('me', [AdminAuthController::class, 'me']);
        
        // User Management API
        Route::prefix('users')->group(function () {
            Route::get('/', [UserApiController::class, 'index']);
            Route::post('/', [UserApiController::class, 'store']);
            Route::get('{user}', [UserApiController::class, 'show']);
            Route::put('{user}', [UserApiController::class, 'update']);
            Route::delete('{user}', [UserApiController::class, 'destroy']);
        });
    });
});
