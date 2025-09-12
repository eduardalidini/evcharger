<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class ShareAdminData
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        Inertia::share([
            'admin' => function () {
                return Auth::guard('admin')->user();
            },
        ]);

        return $next($request);
    }
}