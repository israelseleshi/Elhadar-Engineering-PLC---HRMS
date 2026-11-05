import { Checkbox } from '@/Components/ui/checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PasswordInput from '@/Components/PasswordInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Lock, ArrowRight, Phone, Mail } from 'lucide-react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [emailAddress, setEmailAddress] = useState('');

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        login: '',
        password: '',
        remember: true as boolean,
    });

    /**
     * Sanitizes Ethiopian phone input:
     * - Strips non-digits
     * - Strips +251 / 251 prefix if pasted or entered
     * - Strips any leading zeros (e.g. 09 -> 9)
     * - Only accepts starting from 9
     * - Limits to 9 digits (standard Ethiopian mobile length after prefix)
     */
    const sanitizePhoneNumber = (raw: string): string => {
        let digits = raw.replace(/\D/g, '');

        // Remove 251 prefix if pasted or typed
        if (digits.startsWith('251')) {
            digits = digits.slice(3);
        }

        // Remove any leading zeros (e.g. 09... -> 9...)
        digits = digits.replace(/^0+/, '');

        // It only has to accept from 9
        if (digits.length > 0 && !digits.startsWith('9')) {
            const nineIdx = digits.indexOf('9');
            if (nineIdx !== -1) {
                digits = digits.slice(nineIdx);
            } else {
                digits = '';
            }
        }

        return digits.slice(0, 9);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitized = sanitizePhoneNumber(e.target.value);
        setPhoneNumber(sanitized);
        setData('login', sanitized ? `+251${sanitized}` : '');
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.trim();
        setEmailAddress(val);
        setData('login', val);
    };

    const switchMethod = (method: 'phone' | 'email') => {
        setAuthMethod(method);
        clearErrors();
        if (method === 'phone') {
            setData('login', phoneNumber ? `+251${phoneNumber}` : '');
        } else {
            setData('login', emailAddress);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Ensure current active tab credentials are submitted
        const finalLogin = authMethod === 'phone'
            ? (phoneNumber ? `+251${phoneNumber}` : '')
            : emailAddress;

        data.login = finalLogin;

        post(route('login'), {
            onFinish: () => {
                setData('password', '');
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Sign In - Elhadar Engineering HRMS" />

            <div className="mb-5">
                <h2 className="text-xl font-bold text-black tracking-tight">Sign in</h2>
                <p className="text-xs text-[#595959] mt-1 font-light">
                    Access your employee records, leave and payroll tools.
                </p>
            </div>

            {status && (
                <div className="mb-4 text-xs font-semibold text-[#008254] bg-[#effcf8] p-3 border border-[#b7ecda] rounded-xs">
                    {status}
                </div>
            )}

            {/* Credential Type Selector Tabs */}
            <div className="flex p-1 bg-[#f4f5f6] border border-[#e5e7eb] rounded-xs mb-5 gap-1">
                <button
                    type="button"
                    onClick={() => switchMethod('phone')}
                    className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-2 text-[11px] sm:text-xs font-semibold rounded-xs transition-all cursor-pointer ${
                        authMethod === 'phone'
                            ? 'bg-white text-[#008254] shadow-xs font-bold border border-[#d8d9da]'
                            : 'text-[#64666a] hover:text-black'
                    }`}
                >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Phone</span>
                    <span className="hidden sm:inline">number</span>
                </button>
                <button
                    type="button"
                    onClick={() => switchMethod('email')}
                    className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-2 text-[11px] sm:text-xs font-semibold rounded-xs transition-all cursor-pointer ${
                        authMethod === 'email'
                            ? 'bg-white text-[#008254] shadow-xs font-bold border border-[#d8d9da]'
                            : 'text-[#64666a] hover:text-black'
                    }`}
                >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Email</span>
                    <span className="hidden sm:inline">address</span>
                </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
                {authMethod === 'phone' ? (
                    <div>
                        <InputLabel
                            htmlFor="phone"
                            value="Mobile phone number"
                            className="text-xs font-semibold text-black"
                        />

                        <div className="mt-1">
                            <Input
                                id="phone"
                                type="tel"
                                name="phone"
                                inputMode="numeric"
                                value={phoneNumber}
                                placeholder="9XXXXXXXX"
                                className="border-[#d8d9da] bg-white text-sm text-black placeholder:text-[#9e9e9e] font-medium tracking-wider"
                                autoComplete="tel-national"
                                autoFocus
                                onChange={handlePhoneChange}
                            />
                        </div>

                        <InputError
                            message={errors.login || (errors as Record<string, string | undefined>).email}
                            className="mt-1.5 text-xs text-[#de2828]"
                        />
                    </div>
                ) : (
                    <div>
                        <InputLabel
                            htmlFor="email"
                            value="Email address"
                            className="text-xs font-semibold text-black"
                        />

                        <div className="mt-1">
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={emailAddress}
                                placeholder="Enter your email"
                                className="border-[#d8d9da] bg-white text-sm text-black placeholder:text-[#9e9e9e]"
                                autoComplete="username"
                                autoFocus
                                onChange={handleEmailChange}
                            />
                        </div>

                        <InputError
                            message={errors.login || (errors as Record<string, string | undefined>).email}
                            className="mt-1.5 text-xs text-[#de2828]"
                        />
                    </div>
                )}

                <div>
                    <div className="flex items-center justify-between">
                        <InputLabel
                            htmlFor="password"
                            value="Password"
                            className="text-xs font-semibold text-black"
                        />
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs text-[#008254] hover:underline font-medium"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>

                    <div className="mt-1">
                        <PasswordInput
                            id="password"
                            name="password"
                            value={data.password}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                    </div>

                    <InputError message={errors.password} className="mt-1.5 text-xs text-[#de2828]" />
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                    <label className="flex items-center cursor-pointer min-w-0">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            className="rounded-xs text-[#008254] focus-visible:ring-[#008254] border-[#d8d9da] shrink-0 data-[state=checked]:bg-[#008254] data-[state=checked]:text-white"
                            onCheckedChange={(checked) => setData('remember', checked === true)}
                        />
                        <span className="ms-2 text-xs text-[#595959]">
                            Keep me signed in
                        </span>
                    </label>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full bg-[#008254] hover:bg-[#006642] text-white font-semibold py-2.5 text-sm rounded-xs shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                        disabled={processing}
                    >
                        <Lock className="h-3.5 w-3.5" />
                        <span>{processing ? 'Signing in...' : 'Sign in'}</span>
                        {!processing && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
