<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusinessUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class BusinessUserApiController extends Controller
{
    /**
     * Display a listing of business users with optional filters.
     */
    public function index(Request $request)
    {
        $query = BusinessUser::query();

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

        // Append user_type for client clarity
        $users->each(function ($u) {
            $u->user_type = 'business';
        });

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Store a newly created business user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'required|string|max:255',
            'id_number' => 'required|string|max:255|unique:business_users',
            'phone_no' => 'required|string|max:20',
            'email' => 'required|string|email|max:255|unique:business_users',
            'nipt' => 'required|string|max:255',
            'balance' => 'nullable|numeric|min:0',
            'password' => ['required', Password::min(8)],
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['balance'] = $validated['balance'] ?? 0.00;

        $user = BusinessUser::create($validated);
        $user->user_type = 'business';

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user,
        ], 201);
    }

    /**
     * Display the specified business user.
     */
    public function show(int $id)
    {
        $user = BusinessUser::findOrFail($id);
        $user->user_type = 'business';

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Update the specified business user.
     */
    public function update(Request $request, int $id)
    {
        $user = BusinessUser::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'required|string|max:255',
            'id_number' => ['required', 'string', 'max:255', Rule::unique('business_users')->ignore($user->id)],
            'phone_no' => 'required|string|max:20',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('business_users')->ignore($user->id)],
            'nipt' => 'required|string|max:255',
            'balance' => 'required|numeric|min:0',
            'password' => ['nullable', Password::min(8)],
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
            'data' => $user->fresh()->setAttribute('user_type', 'business'),
        ]);
    }

    /**
     * Remove the specified business user.
     */
    public function destroy(int $id)
    {
        $user = BusinessUser::findOrFail($id);
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }
}
