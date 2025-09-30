<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Auth\LoginRequest;
use App\Models\BusinessUser;
use App\Models\IndividualUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserAuthController extends Controller
{
    public function loginIndividual(LoginRequest $request)
    {
        $email = (string) $request->validated('email');
        $password = (string) $request->validated('password');

        $user = IndividualUser::where('email', $email)->first();
        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials'], 422);
        }

        $token = $user->createToken('api', ['user:individual'])->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user_type' => 'individual',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'surname' => $user->surname,
                    'email' => $user->email,
                    'balance' => (float) $user->balance,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    public function loginBusiness(LoginRequest $request)
    {
        $email = (string) $request->validated('email');
        $password = (string) $request->validated('password');

        $user = BusinessUser::where('email', $email)->first();
        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials'], 422);
        }

        $token = $user->createToken('api', ['user:business'])->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user_type' => 'business',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'surname' => $user->surname,
                    'email' => $user->email,
                    'nipt' => $user->nipt,
                    'balance' => (float) $user->balance,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $userType = $user instanceof IndividualUser ? 'individual' : 'business';

        return response()->json([
            'success' => true,
            'data' => [
                'user_type' => $userType,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'surname' => $user->surname,
                    'email' => $user->email,
                    'nipt' => $userType === 'business' ? $user->nipt : null,
                    'balance' => (float) $user->balance,
                ],
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }
}


