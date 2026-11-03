<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if (empty($roles)) {
            return $next($request);
        }

        if (! in_array($user->role, $roles, true)) {
            if ($user->role === 'Employee') {
                return redirect()->route('portal.profile')->with(
                    'error',
                    'Access restricted: Administrative operations require HR/Admin authorization.'
                );
            }

            abort(403, 'Unauthorized access: your role does not permit this operation.');
        }

        return $next($request);
    }
}
