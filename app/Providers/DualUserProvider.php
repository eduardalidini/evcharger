<?php

namespace App\Providers;

use App\Models\IndividualUser;
use App\Models\BusinessUser;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Support\Facades\Hash;

class DualUserProvider implements UserProvider
{
    /**
     * Retrieve a user by their unique identifier.
     */
    public function retrieveById($identifier): ?Authenticatable
    {
        // Try individual users first
        $user = IndividualUser::find($identifier);
        if ($user) {
            return $user;
        }

        // Try business users
        $user = BusinessUser::find($identifier);
        if ($user) {
            return $user;
        }

        return null;
    }

    /**
     * Retrieve a user by their unique identifier and "remember me" token.
     */
    public function retrieveByToken($identifier, $token): ?Authenticatable
    {
        // Try individual users first
        $user = IndividualUser::where('id', $identifier)
            ->where('remember_token', $token)
            ->first();
        if ($user) {
            return $user;
        }

        // Try business users
        $user = BusinessUser::where('id', $identifier)
            ->where('remember_token', $token)
            ->first();
        if ($user) {
            return $user;
        }

        return null;
    }

    /**
     * Update the "remember me" token for the given user in storage.
     */
    public function updateRememberToken(Authenticatable $user, $token): void
    {
        $user->setRememberToken($token);
        // Update remember token via direct query to avoid persisting transient attributes
        if ($user instanceof IndividualUser) {
            IndividualUser::where('id', $user->getAuthIdentifier())->update(['remember_token' => $token]);
        } elseif ($user instanceof BusinessUser) {
            BusinessUser::where('id', $user->getAuthIdentifier())->update(['remember_token' => $token]);
        }
    }

    /**
     * Retrieve a user by the given credentials.
     */
    public function retrieveByCredentials(array $credentials): ?Authenticatable
    {
        if (!isset($credentials['email'])) {
            return null;
        }

        $email = $credentials['email'];
        $password = $credentials['password'] ?? null;

        // Fetch possible matches from both tables
        $individual = IndividualUser::where('email', $email)->first();
        $business = BusinessUser::where('email', $email)->first();

        // If only one exists, return it
        if ($individual && !$business) {
            return $individual;
        }
        if ($business && !$individual) {
            return $business;
        }

        // If both exist with the same email, disambiguate using password when provided
        if ($individual && $business) {
            if ($password) {
                if (password_verify($password, $individual->getAuthPassword())) {
                    return $individual;
                }
                if (password_verify($password, $business->getAuthPassword())) {
                    return $business;
                }
            }
            // Fallback: prefer individual by default
            return $individual;
        }

        return null;
    }

    /**
     * Validate a user against the given credentials.
     */
    public function validateCredentials(Authenticatable $user, array $credentials): bool
    {
        return $user->getAuthPassword() && 
               password_verify($credentials['password'], $user->getAuthPassword());
    }

    /**
     * Rehash the user's password if required.
     */
    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false): void
    {
        if ($force || (isset($credentials['password']) && Hash::needsRehash($user->getAuthPassword()))) {
            $user->password = Hash::make($credentials['password']);
            $user->save();
        }
    }
}
