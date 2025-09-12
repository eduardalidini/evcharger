<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        
        $users = User::query()
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                           ->orWhere('surname', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%")
                           ->orWhere('id_number', 'like', "%{$search}%")
                           ->orWhere('phone_no', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'search' => $search,
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        return Inertia::render('admin/users/create');
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'required|string|max:255',
            'id_number' => 'required|string|max:255|unique:users',
            'phone_no' => 'required|string|max:20',
            'email' => 'required|string|email|max:255|unique:users',
            'nipt' => 'nullable|string|max:255',
            'balance' => 'nullable|numeric|min:0',
            'password' => ['required', Rules\Password::defaults()],
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['balance'] = $validated['balance'] ?? 0.00;

        User::create($validated);

        return redirect()->route('admin.users.index')
                        ->with('success', 'User created successfully.');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        return Inertia::render('admin/users/edit', [
            'user' => $user,
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'required|string|max:255',
            'id_number' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone_no' => 'required|string|max:20',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'nipt' => 'nullable|string|max:255',
            'balance' => 'required|numeric|min:0',
            'password' => 'nullable|string|min:8',
        ]);

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('admin.users.index')
                        ->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('admin.users.index')
                        ->with('success', 'User deleted successfully.');
    }
}
