<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\ReceiptController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    // Redirect based on authentication state
    if (Auth::guard('admin')->check()) {
        return redirect()->route('admin.dashboard');
    }
    
    if (Auth::guard('web')->check()) {
        return redirect()->route('dashboard');
    }
    
    // Default to welcome page for unauthenticated users
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // User marketplace (products only)
    Route::get('marketplace', [MarketplaceController::class, 'index'])->name('marketplace.index');
    Route::post('marketplace/product/{product}/buy', [MarketplaceController::class, 'buyProduct'])->name('marketplace.product.buy');
    
    // User receipt routes
    Route::get('receipts', [ReceiptController::class, 'index'])->name('receipts.index');
    Route::get('receipts/{receipt}', [ReceiptController::class, 'show'])->name('receipts.show');
    Route::get('receipts/{receipt}/view-pdf', [ReceiptController::class, 'viewPdf'])->name('receipts.view-pdf');
    Route::get('receipts/{receipt}/download-pdf', [ReceiptController::class, 'downloadPdf'])->name('receipts.download-pdf');
    Route::delete('receipts/{receipt}', [ReceiptController::class, 'destroy'])->name('receipts.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';

/*
|--------------------------------------------------------------------------
| User Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('user')->name('user.')->group(function () {
    require __DIR__.'/user.php';
});
