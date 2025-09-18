<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $supportedLocales = ['en', 'sq'];
        $defaultLocale = config('app.locale', 'en');

        // Check for locale in various sources (priority order)
        $locale = $this->getLocaleFromSources($request, $supportedLocales, $defaultLocale);

        // Set the application locale
        App::setLocale($locale);

        // Store in session for persistence
        Session::put('locale', $locale);

        return $next($request);
    }

    /**
     * Get locale from various sources in priority order
     */
    private function getLocaleFromSources(Request $request, array $supportedLocales, string $defaultLocale): string
    {
        // 1. Check URL parameter (for explicit switching)
        if ($request->has('lang') && in_array($request->get('lang'), $supportedLocales)) {
            return $request->get('lang');
        }

        // 2. Check session (user's previous choice)
        if (Session::has('locale') && in_array(Session::get('locale'), $supportedLocales)) {
            return Session::get('locale');
        }

        // 3. Check user preference (if authenticated and has locale column)
        if ($request->user() && method_exists($request->user(), 'getLocale')) {
            $userLocale = $request->user()->getLocale();
            if ($userLocale && in_array($userLocale, $supportedLocales)) {
                return $userLocale;
            }
        }

        // 4. Check browser preference
        $preferredLanguage = $request->getPreferredLanguage($supportedLocales);
        if ($preferredLanguage && in_array($preferredLanguage, $supportedLocales)) {
            return $preferredLanguage;
        }

        // 5. Fall back to default
        return $defaultLocale;
    }
}
