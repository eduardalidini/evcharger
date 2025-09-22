<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Register broadcasting auth routes for both user and admin guards
Broadcast::routes(['middleware' => ['web']]);

// Admin charging dashboard channel
Broadcast::channel('admin.charging', function ($user) {
    // Check if user is authenticated as admin
    if (auth()->guard('admin')->check()) {
        \Log::info('Admin authenticated for admin.charging channel', ['user_id' => auth()->guard('admin')->id()]);
        return ['id' => auth()->guard('admin')->id(), 'name' => auth()->guard('admin')->user()->name];
    }
    \Log::warning('Admin authentication failed for admin.charging channel');
    return false;
});

// User charging updates channel
Broadcast::channel('user.charging.{userId}', function ($user, $userId) {
    // Allow the user to subscribe to their own channel
    if (auth()->guard('web')->check() && auth()->guard('web')->id() == $userId) {
        \Log::info('User authenticated for user.charging channel', ['user_id' => $userId]);
        return ['id' => $userId, 'name' => auth()->guard('web')->user()->name];
    }
    \Log::warning('User authentication failed for user.charging channel', ['requested_id' => $userId, 'auth_id' => auth()->guard('web')->id()]);
    return false;
});

// Global charging updates (for both admin and users)
Broadcast::channel('charging.global', function ($user) {
    // Allow all authenticated users (admin and regular users)
    if (auth()->guard('web')->check()) {
        \Log::info('User authenticated for charging.global channel', ['user_id' => auth()->guard('web')->id()]);
        return ['id' => auth()->guard('web')->id(), 'name' => auth()->guard('web')->user()->name, 'type' => 'user'];
    }
    if (auth()->guard('admin')->check()) {
        \Log::info('Admin authenticated for charging.global channel', ['admin_id' => auth()->guard('admin')->id()]);
        return ['id' => auth()->guard('admin')->id(), 'name' => auth()->guard('admin')->user()->name, 'type' => 'admin'];
    }
    \Log::warning('Authentication failed for charging.global channel');
    return false;
});
