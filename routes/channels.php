<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

// Register broadcasting auth routes using both web and admin guards
Broadcast::routes(['middleware' => ['web', 'auth:web,admin']]);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Admin charging dashboard channel - allow authenticated admins and users
Broadcast::channel('admin.charging', function ($user) {
    \Log::info('Admin charging channel auth attempt', [
        'user_id' => $user ? $user->id : null,
        'user_type' => $user ? get_class($user) : 'null',
        'is_authenticated' => $user !== null,
        'guards' => [
            'web' => auth('web')->check(),
            'admin' => auth('admin')->check()
        ]
    ]);
    
    // Allow if user is authenticated through either web or admin guard
    $isAuthenticated = auth('web')->check() || auth('admin')->check();
    \Log::info('Admin channel auth result', ['authenticated' => $isAuthenticated]);
    
    return $isAuthenticated;
});

// User charging updates channel - allow specific user
Broadcast::channel('user.charging.{userId}', function ($user, $userId) {
    \Log::info('User charging channel auth attempt', [
        'user_id' => $user ? $user->id : null,
        'requested_user_id' => $userId,
        'match' => $user && ((int) $user->id === (int) $userId),
        'guards' => [
            'web' => auth('web')->check(),
            'admin' => auth('admin')->check()
        ]
    ]);
    
    // Allow if user is authenticated and matches the requested user ID, or if admin
    $isWebUser = auth('web')->check() && $user && ((int) $user->id === (int) $userId);
    $isAdmin = auth('admin')->check(); // Admins can access any user channel
    $isAuthorized = $isWebUser || $isAdmin;
    
    \Log::info('User channel auth result', [
        'web_user_authorized' => $isWebUser,
        'admin_authorized' => $isAdmin,
        'final_authorized' => $isAuthorized
    ]);
    
    return $isAuthorized;
});

// Global charging updates - allow authenticated users
Broadcast::channel('charging.global', function ($user) {
    \Log::info('Global charging channel auth attempt', [
        'user_id' => $user ? $user->id : null,
        'is_authenticated' => $user !== null,
        'guards' => [
            'web' => auth('web')->check(),
            'admin' => auth('admin')->check()
        ]
    ]);
    
    // Allow if user is authenticated through either web or admin guard
    $isAuthenticated = auth('web')->check() || auth('admin')->check();
    \Log::info('Global channel auth result', ['authenticated' => $isAuthenticated]);
    
    return $isAuthenticated;
});

// Test channel for WebSocket broadcasting - allow authenticated users
Broadcast::channel('channel-messages', function ($user) {
    // Allow if user is authenticated through either web or admin guard
    return auth('web')->check() || auth('admin')->check();
});
