<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register custom user provider
        Auth::provider('custom', function ($app, $config) {
            return new DualUserProvider();
        });

        // Configure admin guard to redirect to admin login
        \Illuminate\Auth\Middleware\Authenticate::redirectUsing(function () {
            if (request()->is('admin/*')) {
                return route('admin.login');
            }
            return route('login');
        });
    }
}
