<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;

class UserApiController extends Controller
{
    /**
     * Display a listing of users
     */
    public function index(Request $request)
    {
        $query = User::query();
        
        // Individual field filters
        if ($request->filled('name')) {
            $query->where('name', 'like', "%{$request->name}%");
        }
        
        if ($request->filled('surname')) {
            $query->where('surname', 'like', "%{$request->surname}%");
        }
        
        if ($request->filled('email')) {
            $query->where('email', 'like', "%{$request->email}%");
        }
        
        if ($request->filled('id_number')) {
            $query->where('id_number', 'like', "%{$request->id_number}%");
        }
        
        if ($request->filled('phone_no')) {
            $query->where('phone_no', 'like', "%{$request->phone_no}%");
        }
        
        if ($request->filled('nipt')) {
            $query->where('nipt', 'like', "%{$request->nipt}%");
        }
        
        $users = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Store a newly created user
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

        $user = User::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user
        ], 201);
    }

    /**
     * Display the specified user
     */
    public function show(User $user)
    {
        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * Update the specified user
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

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user->fresh()
        ]);
    }

    /**
     * Remove the specified user
     */
    public function destroy(User $user)
    {
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }
}
