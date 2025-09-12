<?php

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
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
