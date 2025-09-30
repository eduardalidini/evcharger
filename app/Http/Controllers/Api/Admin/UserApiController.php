<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusinessUser;
use App\Models\IndividualUser;
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
        $applyFilters = function ($builder) use ($request) {
            if ($request->filled('name')) {
                $builder->where('name', 'like', "%{$request->name}%");
            }
            if ($request->filled('surname')) {
                $builder->where('surname', 'like', "%{$request->surname}%");
            }
            if ($request->filled('email')) {
                $builder->where('email', 'like', "%{$request->email}%");
            }
            if ($request->filled('id_number')) {
                $builder->where('id_number', 'like', "%{$request->id_number}%");
            }
            if ($request->filled('phone_no')) {
                $builder->where('phone_no', 'like', "%{$request->phone_no}%");
            }
        };

        $individualQuery = IndividualUser::query();
        $applyFilters($individualQuery);
        $individuals = $individualQuery->latest()->get();
        $individuals->each(function ($u) {
            $u->user_type = 'individual';
        });

        $businessQuery = BusinessUser::query();
        $applyFilters($businessQuery);
        if ($request->filled('nipt')) {
            $businessQuery->where('nipt', 'like', "%{$request->nipt}%");
        }
        $businesses = $businessQuery->latest()->get();
        $businesses->each(function ($u) {
            $u->user_type = 'business';
        });

        // Merge and sort by created_at desc for a unified response
        $merged = $individuals->concat($businesses)->sortByDesc('created_at')->values();

        return response()->json([
            'success' => true,
            'data' => $merged,
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
        $validated['isBusiness'] = ! empty($validated['nipt']); // Set to true if NIPT is provided

        $user = User::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user,
        ], 201);
    }

    /**
     * Display the specified user
     */
    public function show(User $user)
    {
        return response()->json([
            'success' => true,
            'data' => $user,
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

        $validated['isBusiness'] = ! empty($validated['nipt']); // Set to true if NIPT is provided

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user->fresh(),
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
            'message' => 'User deleted successfully',
        ]);
    }
}
