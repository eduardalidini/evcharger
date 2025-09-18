<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\IndividualUser;
use App\Models\BusinessUser;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // Determine if this is a business user based on NIPT presence
        $isBusiness = !empty($request->nipt);
        
        // Set up validation rules based on user type
        $validationRules = [
            'name' => 'required|string|max:255',
            'surname' => 'required|string|max:255',
            'id_number' => 'required|string|max:255',
            'phone_no' => 'required|string|max:20',
            'email' => 'required|string|lowercase|email|max:255',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ];

        if ($isBusiness) {
            $validationRules['id_number'] .= '|unique:business_users,id_number';
            $validationRules['email'] .= '|unique:business_users,email';
            $validationRules['nipt'] = 'required|string|max:255|unique:business_users,nipt';
        } else {
            $validationRules['id_number'] .= '|unique:individual_users,id_number';
            $validationRules['email'] .= '|unique:individual_users,email';
        }

        $request->validate($validationRules);

        // Create user data array
        $userData = [
            'name' => $request->name,
            'surname' => $request->surname,
            'id_number' => $request->id_number,
            'phone_no' => $request->phone_no,
            'email' => $request->email,
            'balance' => 0.00,
            'password' => Hash::make($request->password),
        ];

        // Add NIPT for business users
        if ($isBusiness) {
            $userData['nipt'] = $request->nipt;
        }

        // Create user in the appropriate table
        $user = $isBusiness 
            ? BusinessUser::create($userData)
            : IndividualUser::create($userData);

        event(new Registered($user));

        Auth::login($user);

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
