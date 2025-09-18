<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IndividualUser;
use App\Models\BusinessUser;
use App\Models\AdminReceipt;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * Display the admin dashboard.
     */
    public function index(): Response
    {
        // Get total users from both tables
        $totalIndividualUsers = IndividualUser::count();
        $totalBusinessUsers = BusinessUser::count();
        $totalUsers = $totalIndividualUsers + $totalBusinessUsers;

        // Get recent users from both tables and merge them
        $recentIndividualUsers = IndividualUser::latest()
            ->take(5)
            ->get(['id', 'name', 'surname', 'email', 'created_at'])
            ->map(function ($user) {
                $user->user_type = 'individual';
                return $user;
            });

        $recentBusinessUsers = BusinessUser::latest()
            ->take(5)
            ->get(['id', 'name', 'surname', 'email', 'created_at'])
            ->map(function ($user) {
                $user->user_type = 'business';
                return $user;
            });

        // Merge and sort by created_at, then take the 5 most recent
        $recentUsers = $recentIndividualUsers->concat($recentBusinessUsers)
            ->sortByDesc('created_at')
            ->take(5)
            ->values();

        $stats = [
            'total_users' => $totalUsers,
            'total_individual_users' => $totalIndividualUsers,
            'total_business_users' => $totalBusinessUsers,
            'recent_users' => $recentUsers,
            'total_receipts' => AdminReceipt::notDeleted()->count(),
            'monthly_revenue' => AdminReceipt::notDeleted()
                ->where('status', 'paid')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total_amount'),
            'pending_receipts' => AdminReceipt::notDeleted()
                ->whereIn('status', ['sent', 'overdue'])
                ->count(),
            'recent_receipts' => AdminReceipt::notDeleted()
                ->with(['user:id,name,surname,email'])
                ->latest()
                ->take(5)
                ->get(['id', 'receipt_number', 'user_id', 'type', 'total_amount', 'currency', 'status', 'created_at']),
        ];

        return Inertia::render('admin/dashboard', $stats);
    }
}
