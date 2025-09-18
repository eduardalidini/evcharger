<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Register broadcasting auth routes for both user and admin guards
Broadcast::routes(['middleware' => ['auth:web,admin']]);

// Admin charging dashboard channel - allow authenticated admins and users
Broadcast::channel('admin.charging', function ($user) {
    \Log::info('Admin charging channel auth attempt', [
        'user_id' => $user ? $user->id : null,
        'user_type' => get_class($user ?? new \stdClass()),
        'is_authenticated' => $user !== null
    ]);
    return $user !== null; // Allow any authenticated user
});

// User charging updates channel - allow specific user
Broadcast::channel('user.charging.{userId}', function ($user, $userId) {
    \Log::info('User charging channel auth attempt', [
        'user_id' => $user ? $user->id : null,
        'requested_user_id' => $userId,
        'match' => $user && ((int) $user->id === (int) $userId)
    ]);
    return $user && ((int) $user->id === (int) $userId);
});

// Global charging updates - allow authenticated users
Broadcast::channel('charging.global', function ($user) {
    \Log::info('Global charging channel auth attempt', [
        'user_id' => $user ? $user->id : null,
        'is_authenticated' => $user !== null
    ]);
    return $user !== null; // Allow any authenticated user
});
