<?php

namespace App\Http\Controllers;

use App\Models\AdminReceipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the user dashboard.
     */
    public function index(): Response
    {
        $userId = Auth::id();
        
        $stats = [
            'total_receipts' => AdminReceipt::where('user_id', $userId)->notDeleted()->count(),
            'monthly_revenue' => AdminReceipt::where('user_id', $userId)
                ->notDeleted()
                ->where('status', 'paid')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total_amount'),
            'pending_receipts' => AdminReceipt::where('user_id', $userId)
                ->notDeleted()
                ->whereIn('status', ['sent', 'overdue'])
                ->count(),
            'recent_receipts' => AdminReceipt::where('user_id', $userId)
                ->notDeleted()
                ->with(['admin:id,email'])
                ->latest()
                ->take(5)
                ->get(['id', 'receipt_number', 'admin_id', 'type', 'total_amount', 'currency', 'status', 'created_at', 'pdf_base64']),
        ];

        return Inertia::render('dashboard', $stats);
    }
}
