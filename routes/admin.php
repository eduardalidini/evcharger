<?php

use App\Http\Controllers\Admin\Auth\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\ReceiptController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\Settings\AdminProfileController;
use App\Http\Controllers\Admin\Settings\AdminPasswordController;
use App\Http\Middleware\ShareAdminData;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::prefix('admin')->name('admin.')->group(function () {
    
    // Admin auth routes
    Route::middleware('guest:admin')->group(function () {
        Route::get('login', [AdminAuthController::class, 'create'])->name('login');
        Route::post('login', [AdminAuthController::class, 'store'])->name('login.store');
    });

    // Protected admin routes
    Route::middleware(['auth:admin', ShareAdminData::class])->group(function () {
        Route::post('logout', [AdminAuthController::class, 'destroy'])->name('logout');
        
        Route::get('dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
        Route::get('/', [AdminDashboardController::class, 'index']);
        
        Route::resource('users', UserManagementController::class);
        Route::resource('receipts', ReceiptController::class);
        
        // Additional receipt routes
        Route::post('receipts/{receipt}/generate-pdf', [ReceiptController::class, 'generatePdf'])->name('receipts.generate-pdf');
        Route::get('receipts/{receipt}/view-pdf', [ReceiptController::class, 'viewPdf'])->name('receipts.view-pdf');
        Route::get('receipts/{receipt}/download-pdf', [ReceiptController::class, 'downloadPdf'])->name('receipts.download-pdf');
        Route::delete('receipts/{receipt}/force', [ReceiptController::class, 'forceDestroy'])->name('receipts.force-destroy');
        
        // Admin Settings
        Route::redirect('settings', '/admin/settings/profile');
        Route::get('settings/profile', [AdminProfileController::class, 'edit'])->name('settings.profile.edit');
        Route::patch('settings/profile', [AdminProfileController::class, 'update'])->name('settings.profile.update');
        Route::delete('settings/profile', [AdminProfileController::class, 'destroy'])->name('settings.profile.destroy');
        
        Route::get('settings/password', [AdminPasswordController::class, 'edit'])->name('settings.password.edit');
        Route::put('settings/password', [AdminPasswordController::class, 'update'])
            ->middleware('throttle:6,1')
            ->name('settings.password.update');
            
        Route::get('settings/appearance', function () {
            return Inertia::render('admin/settings/appearance');
        })->name('settings.appearance');
    });
});
