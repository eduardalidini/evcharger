<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
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
        $stats = [
            'total_users' => User::count(),
            'recent_users' => User::latest()->take(5)->get(['id', 'name', 'surname', 'email', 'created_at']),
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
