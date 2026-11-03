<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class FirstPasswordChangeController extends Controller
{
    /**
     * Show the first-time password change view.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();

        if (! $user?->must_change_password) {
            return redirect()->route('portal.profile');
        }

        return Inertia::render('Auth/FirstPasswordChange', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle the first-time password change request.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            return back()->withErrors([
                'current_password' => 'The current password is incorrect.',
            ]);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
        ]);

        return redirect()->route('portal.profile')->with('status', 'Password changed successfully.');
    }
}
