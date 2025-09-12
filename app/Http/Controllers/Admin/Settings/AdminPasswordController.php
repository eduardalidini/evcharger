<?php

namespace App\Http\Controllers\Admin\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AdminPasswordController extends Controller
{
    /**
     * Show the admin's password settings page.
     */
    public function edit(): Response
    {
        return Inertia::render('admin/settings/password');
    }

    /**
     * Update the admin's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password:admin'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        Auth::guard('admin')->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back();
    }
}
