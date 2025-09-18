<?php

use App\Http\Controllers\User\ChargingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| User Routes
|--------------------------------------------------------------------------
|
| Here is where you can register user routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "user" middleware group. Now create something great!
|
*/

Route::prefix('charging')->name('charging.')->group(function () {
    Route::get('/', [ChargingController::class, 'index'])->name('index');
    Route::get('/session/{session}', [ChargingController::class, 'session'])->name('session');
    Route::post('/start', [ChargingController::class, 'start'])->name('start');
    Route::post('/session/{session}/pause', [ChargingController::class, 'pause'])->name('pause');
    Route::post('/session/{session}/resume', [ChargingController::class, 'resume'])->name('resume');
    Route::post('/session/{session}/stop', [ChargingController::class, 'stop'])->name('stop');
});
