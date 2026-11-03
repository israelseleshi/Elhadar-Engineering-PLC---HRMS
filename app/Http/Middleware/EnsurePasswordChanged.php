<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->must_change_password) {
            $route = $request->route()?->getName();

            $allowedRoutes = [
                'password.first-change',
                'password.first-change.update',
                'logout',
            ];

            if (! in_array($route, $allowedRoutes, true)) {
                return redirect()->route('password.first-change');
            }
        }

        return $next($request);
    }
}
