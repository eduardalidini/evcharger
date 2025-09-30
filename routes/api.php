<?php

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\BusinessUserApiController;
use App\Http\Controllers\Api\Admin\IndividualUserApiController;
use App\Http\Controllers\Api\Admin\UserApiController;
use App\Http\Controllers\Ocpp\ChargePointCommandController;
use App\Http\Controllers\Api\V1\Auth\UserAuthController;
use App\Http\Controllers\Api\V1\ChargePointController as V1ChargePointController;
use App\Events\OcppRemoteStartRequested;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\OcppLogController;
use App\Http\Middleware\VerifyNodeConnector;

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

Route::middleware([VerifyNodeConnector::class])->group(function () {
    Route::post('/ocpp/logs', [OcppLogController::class, 'store'])->name('api.ocpp.logs.store');
    Route::post('/ocpp/logs/append', [OcppLogController::class, 'append'])->name('api.ocpp.logs.append');
    // Node → Laravel realtime status events for broadcasting
    Route::post('/ocpp/events/status', [\App\Http\Controllers\Api\OcppEventController::class, 'status']);
});

// Admin API Routes
Route::prefix('admin')->group(function () {
    // Admin Authentication
    Route::post('login', [AdminAuthController::class, 'login']);

    // Protected Admin Routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AdminAuthController::class, 'logout']);
        Route::get('me', [AdminAuthController::class, 'me']);

        // Unified Users (optional aggregate listing)
        Route::get('users', [UserApiController::class, 'index']);

        // Individual Users API
        Route::prefix('individual-users')->group(function () {
            Route::get('/', [IndividualUserApiController::class, 'index']);
            Route::post('/', [IndividualUserApiController::class, 'store']);
            Route::get('{id}', [IndividualUserApiController::class, 'show']);
            Route::put('{id}', [IndividualUserApiController::class, 'update']);
            Route::delete('{id}', [IndividualUserApiController::class, 'destroy']);
        });

        // Business Users API
        Route::prefix('business-users')->group(function () {
            Route::get('/', [BusinessUserApiController::class, 'index']);
            Route::post('/', [BusinessUserApiController::class, 'store']);
            Route::get('{id}', [BusinessUserApiController::class, 'show']);
            Route::put('{id}', [BusinessUserApiController::class, 'update']);
            Route::delete('{id}', [BusinessUserApiController::class, 'destroy']);
        });
    });
});

// Commands from Laravel → Node bridge → Charger
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/ocpp/{chargePointId}/commands', [ChargePointCommandController::class, 'send']);
});


// Public V1 Auth (Users)
Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('individual/login', [UserAuthController::class, 'loginIndividual']);
        Route::post('business/login', [UserAuthController::class, 'loginBusiness']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('me', [UserAuthController::class, 'me']);
            Route::post('logout', [UserAuthController::class, 'logout']);
        });
    });

    // Charge Points for authenticated users
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('charge-points', [V1ChargePointController::class, 'index']);
        Route::get('charge-points/{chargePoint}', [V1ChargePointController::class, 'show']);

        // Trigger start via Reverb (Node listens on port 9000)
        Route::post('charge-points/{identifier}/start', function (\Illuminate\Http\Request $request, string $identifier) {
            $idTag = (string) ($request->string('idTag')->toString() ?: $identifier);
            $connectorId = (int) ($request->integer('connectorId') ?: 1);
            broadcast(new OcppRemoteStartRequested($identifier, $idTag, $connectorId));
            return response()->json(['success' => true]);
        });
});
});

