<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Register broadcasting auth routes for both user and admin guards
Broadcast::routes(['middleware' => ['auth:web,admin']]);

// Admin charging dashboard channel
Broadcast::channel('admin.charging', function ($user) {
    // Check if user is authenticated as admin
    return $user && auth()->guard('admin')->check();
});

// User charging updates channel
Broadcast::channel('user.charging.{userId}', function ($user, $userId) {
    // Allow the user to subscribe to their own channel
    return $user && $user->id == $userId;
});

// Global charging updates (for both admin and users)
Broadcast::channel('charging.global', function ($user) {
    // Allow all authenticated users (admin and regular users)
    return $user && (auth()->guard('web')->check() || auth()->guard('admin')->check());
});
