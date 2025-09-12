<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
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
            'recent_users' => User::latest()->take(5)->get(['id', 'name', 'email', 'created_at']),
        ];

        return Inertia::render('admin/dashboard', $stats);
    }
}
