<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Services\PhoneNormalizationService;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'login' => ['required_without:email', 'nullable', 'string'],
            'email' => ['required_without:login', 'nullable', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials via Phone or Email only.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $loginInput = trim((string) ($this->input('login') ?: $this->input('email')));
        $password = (string) $this->input('password');

        $user = $this->resolveUser($loginInput);

        if (! $user || ! Hash::check($password, $user->password)) {
            RateLimiter::hit($this->throttleKey());

            $errorField = $this->filled('login') ? 'login' : 'email';

            throw ValidationException::withMessages([
                $errorField => trans('auth.failed'),
                'email' => trans('auth.failed'),
            ]);
        }

        Auth::login($user, $this->boolean('remember'));

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Resolve the authenticating User model by Email or Phone only.
     */
    protected function resolveUser(string $loginInput): ?User
    {
        $loginInput = trim($loginInput);

        if ($loginInput === '') {
            return null;
        }

        // 1. Direct Email Match
        if (str_contains($loginInput, '@')) {
            return User::where('email', strtolower($loginInput))->first();
        }

        // 2. Mobile Phone Match (any Ethiopian format)
        $phoneService = app(PhoneNormalizationService::class);
        $employee = $phoneService->findEmployeeByPhone($loginInput);

        if ($employee && $employee->user) {
            return $employee->user;
        }

        // 3. Fallback: exact user email match
        return User::where('email', strtolower($loginInput))->first();
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());
        $errorField = $this->filled('login') ? 'login' : 'email';

        throw ValidationException::withMessages([
            $errorField => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        $login = $this->input('login') ?: $this->input('email');

        return Str::transliterate(Str::lower((string) $login).'|'.$this->ip());
    }
}
