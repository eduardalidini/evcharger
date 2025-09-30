<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IndividualUser;
use App\Models\BusinessUser;
use App\Models\AdminReceipt;
use App\Models\Product;
use App\Models\ChargingService;
use App\Models\ChargePoint;
use App\Models\ChargingSession;
// Service-related models removed
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    /**
     * Validate unique user fields across both individual and business user tables
     */
    private function validateUniqueUserFields(Request $request, ?int $currentUserId = null, ?string $currentUserType = null)
    {
        $idNumber = $request->id_number;
        $email = $request->email;
        $nipt = $request->nipt;
        $phone = $request->phone_no;
        
        // Check if id_number exists in individual_users table (excluding the current individual if applicable)
        $individualExists = IndividualUser::where('id_number', $idNumber)
            ->when($currentUserId && $currentUserType === 'individual', function($query) use ($currentUserId) {
                return $query->where('id', '!=', $currentUserId);
            })
            ->exists();
        
        // Check if id_number exists in business_users table (excluding the current business if applicable)
        $businessExists = BusinessUser::where('id_number', $idNumber)
            ->when($currentUserId && $currentUserType === 'business', function($query) use ($currentUserId) {
                return $query->where('id', '!=', $currentUserId);
            })
            ->exists();
            
        if ($individualExists || $businessExists) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'id_number' => [trans('validation.id_number_unique')],
            ]);
        }
        
        // Check if email exists in individual_users table
        $individualEmailExists = IndividualUser::where('email', $email)
            ->when($currentUserId && $currentUserType === 'individual', function($query) use ($currentUserId) {
                return $query->where('id', '!=', $currentUserId);
            })
            ->exists();
        
        // Check if email exists in business_users table
        $businessEmailExists = BusinessUser::where('email', $email)
            ->when($currentUserId && $currentUserType === 'business', function($query) use ($currentUserId) {
                return $query->where('id', '!=', $currentUserId);
            })
            ->exists();
            
        if ($individualEmailExists || $businessEmailExists) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => [trans('validation.email_unique')],
            ]);
        }

        // If NIPT is present, ensure it is unique within business_users table (excluding current business if applicable)
        if (!empty($nipt)) {
            $niptExists = BusinessUser::where('nipt', $nipt)
                ->when($currentUserId && $currentUserType === 'business', function($query) use ($currentUserId) {
                    return $query->where('id', '!=', $currentUserId);
                })
                ->exists();

            if ($niptExists) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'nipt' => [trans('validation.nipt_unique')],
                ]);
            }
        }

        // Phone uniqueness across both tables
        if (!empty($phone)) {
            $individualPhoneExists = IndividualUser::where('phone_no', $phone)
                ->when($currentUserId && $currentUserType === 'individual', function($query) use ($currentUserId) {
                    return $query->where('id', '!=', $currentUserId);
                })
                ->exists();

            $businessPhoneExists = BusinessUser::where('phone_no', $phone)
                ->when($currentUserId && $currentUserType === 'business', function($query) use ($currentUserId) {
                    return $query->where('id', '!=', $currentUserId);
                })
                ->exists();

            if ($individualPhoneExists || $businessPhoneExists) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'phone_no' => [trans('validation.phone_unique')],
                ]);
            }
        }
    }

    /**
     * Find a user by ID in either individual_users or business_users table
     */
    private function findUser($id, $userType = null)
    {
        // If user type is specified, search in the specific table first
        if ($userType === 'individual') {
            $user = IndividualUser::find($id);
            if ($user) {
                $user->user_type = 'individual';
                $user->nipt = null; // Individual users don't have NIPT
                return $user;
            }
        } elseif ($userType === 'business') {
            $user = BusinessUser::find($id);
            if ($user) {
                $user->user_type = 'business';
                return $user;
            }
        } else {
            // Fallback: Try to find in individual users first
            $user = IndividualUser::find($id);
            if ($user) {
                $user->user_type = 'individual';
                $user->nipt = null; // Individual users don't have NIPT
                return $user;
            }
            
            // Try to find in business users
            $user = BusinessUser::find($id);
            if ($user) {
                $user->user_type = 'business';
                return $user;
            }
        }
        
        // User not found in either table
        abort(404, 'User not found');
    }

    /**
     * Migrate user from one table to another while preserving all data and relationships
     */
    private function migrateUserType($oldUser, $newUserType, $validatedData)
    {
        return DB::transaction(function () use ($oldUser, $newUserType, $validatedData) {
            $oldUserType = $oldUser->user_type;
            $oldUserId = $oldUser->id;
            
            // Create new user in target table
            if ($newUserType === 'business') {
                $newUser = BusinessUser::create($validatedData);
            } else {
                // Remove NIPT for individual users
                $userData = $validatedData;
                unset($userData['nipt']);
                $newUser = IndividualUser::create($userData);
            }
            
            $newUserId = $newUser->id;
            
            // Update all admin receipts to reference the new user_id
            AdminReceipt::where('user_id', $oldUserId)->update(['user_id' => $newUserId]);
            
            // TODO: Update other related models that might reference user_id
            // (Add here as needed when more relationships are added)
            
            // Delete the old user record
            $oldUser->delete();
            
            // Add user_type to the new user for consistency
            $newUser->user_type = $newUserType;
            
            return $newUser;
        });
    }

    /**
     * Display a listing of users.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $filter = $request->get('filter', 'all'); // all, individual, business
        
        // Get individual users
        $individualUsers = IndividualUser::query()
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                           ->orWhere('surname', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%")
                           ->orWhere('id_number', 'like', "%{$search}%")
                           ->orWhere('phone_no', 'like', "%{$search}%");
            })
            ->latest()
            ->get()
            ->map(function ($user) {
                $user->user_type = 'individual';
                $user->nipt = null; // Individual users don't have NIPT
                return $user;
            });

        // Get business users
        $businessUsers = BusinessUser::query()
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                           ->orWhere('surname', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%")
                           ->orWhere('id_number', 'like', "%{$search}%")
                           ->orWhere('phone_no', 'like', "%{$search}%")
                           ->orWhere('nipt', 'like', "%{$search}%");
            })
            ->latest()
            ->get()
            ->map(function ($user) {
                $user->user_type = 'business';
                return $user;
            });

        // Filter and combine results
        $allUsers = collect();
        
        if ($filter === 'all' || $filter === 'individual') {
            $allUsers = $allUsers->merge($individualUsers);
        }
        
        if ($filter === 'all' || $filter === 'business') {
            $allUsers = $allUsers->merge($businessUsers);
        }

        // Sort by created_at descending
        $allUsers = $allUsers->sortByDesc('created_at');

        // Paginate the results
        $perPage = 10;
        $currentPage = $request->get('page', 1);
        $total = $allUsers->count();
        $items = $allUsers->forPage($currentPage, $perPage)->values();
        
        $users = new \Illuminate\Pagination\LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $currentPage,
            [
                'path' => $request->url(),
                'pageName' => 'page',
            ]
        );
        $users->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'search' => $search,
            'filter' => $filter,
            'stats' => [
                'total' => $individualUsers->count() + $businessUsers->count(),
                'individual' => $individualUsers->count(),
                'business' => $businessUsers->count(),
            ],
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
     * Display the specified user.
     */
    public function show(Request $request, $id): Response
    {
        $userType = $request->get('type');
        $user = $this->findUser($id, $userType);
        
        // Get charging services
        $chargingServices = ChargingService::where('is_active', true)->get();
        
        // Get available charge points
        $availableChargePoints = ChargePoint::where('status', 'Available')->get();
        
        // Check for active charging session
        $activeSession = ChargingSession::where('user_id', $user->id)
            ->whereIn('status', ['Starting', 'Active', 'Paused'])
            ->with(['chargingService', 'chargePoint'])
            ->first();
        
        // Build unified transactions feed (ALL currency by default)
        // 1) Top-ups from receipts (identified by description pattern created by buyProduct)
        $topUpReceipts = AdminReceipt::notDeleted()
            ->where('user_id', $user->id)
            ->whereNotNull('description')
            ->where('description', 'like', '%top up%')
            ->latest()
            ->limit(200)
            ->get(['id', 'receipt_number', 'description', 'created_at']);

        $topUps = $topUpReceipts->map(function ($r) {
            // Try to extract credits from description pattern "+{credits} credits"
            $credits = null;
            if (!empty($r->description) && preg_match('/\+(\d+(?:\.\d{1,2})?)\s*credits?/i', $r->description, $m)) {
                $credits = (float) $m[1];
            }
            return [
                'id' => $r->id,
                'kind' => 'top_up',
                'title' => $r->receipt_number,
                'description' => $r->description,
                'amount' => $credits ?? 0,
                'sign' => '+',
                'currency' => 'ALL',
                'created_at' => optional($r->created_at)->toDateTimeString(),
            ];
        });

        // 2) Service usage deductions removed
        $usageTx = collect();

        // Merge and sort by created_at desc, limit 100 (cast to base collections to avoid Eloquent merge behavior)
        $transactions = $topUps->toBase()
            ->merge($usageTx->toBase())
            ->sortByDesc('created_at')
            ->values()
            ->take(100);

        // Provide credit products for admin actions

        $creditProducts = Product::query()->active()->where('type', 'credit')->orderBy('sort_order')->orderBy('name')->get([
            'id', 'name', 'description', 'sku', 'price', 'currency', 'credit_value', 'image_url', 'sort_order'
        ]);

        // Active usage removed
        $activeUsage = null;

        return Inertia::render('admin/users/show', [
            'user' => $user,
            'transactions' => $transactions,
            'creditProducts' => $creditProducts,
            'activeUsage' => $activeUsage,
            'chargingServices' => $chargingServices->map(fn (ChargingService $service) => [
                'id' => $service->id,
                'name' => $service->name,
                'description' => $service->description,
                'rate_per_kwh' => $service->rate_per_kwh,
                'currency' => $service->currency,
                'is_active' => $service->is_active,
            ]),
            'availableChargePoints' => $availableChargePoints->map(fn (ChargePoint $cp) => [
                'id' => $cp->id,
                'identifier' => $cp->identifier,
                'name' => $cp->name,
                'status' => $cp->status,
            ]),
            'activeSession' => $activeSession ? [
                'id' => $activeSession->id,
                'service_name' => $activeSession->chargingService->name,
                'charge_point_name' => $activeSession->chargePoint->name,
                'status' => $activeSession->status,
                'started_at' => $activeSession->started_at?->toISOString(),
                'energy_consumed' => $activeSession->energy_consumed,
                'credits_used' => $activeSession->credits_used,
            ] : null,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        // Determine if this is a business user based on NIPT presence
        $isBusiness = !empty($request->nipt);
        
        // Validate uniqueness across both tables
        $this->validateUniqueUserFields($request, null, $isBusiness ? 'business' : 'individual');
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'required|string|max:255',
            'id_number' => 'required|string|max:255',
            'phone_no' => 'required|string|max:20',
            'email' => 'required|string|email|max:255',
            'nipt' => $isBusiness ? 'required|string|max:255' : 'prohibited',
            'balance' => 'nullable|numeric|min:0',
            'password' => ['required', Rules\Password::defaults()],
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['balance'] = $validated['balance'] ?? 0.00;

        // Create user in appropriate table
        if ($isBusiness) {
            BusinessUser::create($validated);
        } else {
            // Remove nipt field for individual users
            unset($validated['nipt']);
            IndividualUser::create($validated);
        }

        return redirect()->route('admin.users.index')
                        ->with('success', 'User created successfully.');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(Request $request, $id): Response
    {
        $userType = $request->get('type');
        $user = $this->findUser($id, $userType);
        
        return Inertia::render('admin/users/edit', [
            'user' => $user,
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, $id)
    {
        $userType = $request->get('type');
        $user = $this->findUser($id, $userType);
        $currentUserType = $user->user_type;
        $newUserType = !empty($request->nipt) ? 'business' : 'individual';
        
        // Determine if type is changing
        $isTypeChanging = $currentUserType !== $newUserType;
        
        // Validate uniqueness across both tables (exclude current user if not changing type)
        $excludeId = $isTypeChanging ? null : $user->id;
        $this->validateUniqueUserFields($request, $excludeId, $isTypeChanging ? null : $currentUserType);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'required|string|max:255',
            'id_number' => 'required|string|max:255',
            'phone_no' => 'required|string|max:20',
            'email' => 'required|string|email|max:255',
            'nipt' => $newUserType === 'business' ? 'required|string|max:255' : 'prohibited',
            // balanceDelta allows signed adjustments (e.g., +500 or -500)
            'balance' => 'nullable|numeric',
            'password' => 'nullable|string|min:8',
        ]);

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        // If user type is changing, migrate to the new table
        if ($isTypeChanging) {
            $user = $this->migrateUserType($user, $newUserType, $validated);
            $message = $newUserType === 'business' 
                ? 'User converted to business user successfully.' 
                : 'User converted to individual user successfully.';
        } else {
            // Remove nipt field for individual users if not changing type
            if ($newUserType === 'individual') {
                unset($validated['nipt']);
            }
            // Apply signed balance adjustment if provided
            if (array_key_exists('balance', $validated) && $validated['balance'] !== null && $validated['balance'] !== '') {
                $delta = (float) $validated['balance'];
                unset($validated['balance']);
                $user->balance = (float) ($user->balance ?? 0) + $delta;
                if ($user->balance < 0) {
                    $user->balance = 0.0; // prevent negative balances
                }
            }
            // Ensure transient attributes are not persisted
            unset($validated['user_type']);
            // Remove any transient attributes present on the model instance
            unset($user->user_type);
            unset($user->nipt); // individual models may have had nipt set for UI convenience

            $user->fill($validated);
            $user->save();
            $message = 'User updated successfully.';
        }

        if ($request->query('from') === 'view') {
            return redirect()->route('admin.users.show', ['user' => $user->id, 'type' => $user->user_type])
                             ->with('success', $message);
        }

        return redirect()->route('admin.users.index')
                         ->with('success', $message);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(Request $request, $id)
    {
        $userType = $request->get('type');
        $user = $this->findUser($id, $userType);
        $user->delete();

        return redirect()->route('admin.users.index')
                        ->with('success', 'User deleted successfully.');
    }
}
