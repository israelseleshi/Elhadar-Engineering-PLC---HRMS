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

    const sanitizePhoneNumber = (raw: string): string => {
        let digits = raw.replace(/\D/g, '');

        if (digits.startsWith('251')) {
            digits = digits.slice(3);
        }

        digits = digits.replace(/^0+/, '');

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

            <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground tracking-tight">Sign in</h2>
                <p className="text-xs text-muted-foreground mt-1 font-light">
                    Access your employee records, leave and payroll tools.
                </p>
            </div>

            {status && (
                <div className="mb-4 text-xs font-semibold text-primary bg-primary/10 border border-primary/30 rounded-xl p-3">
                    {status}
                </div>
            )}

            {/* Credential Type Selector Tabs */}
            <div role="tablist" aria-label="Credential type" className="flex p-1 bg-muted border border-border rounded-xl mb-5 gap-1">
                <button
                    type="button"
                    role="tab"
                    aria-selected={authMethod === 'phone'}
                    onClick={() => switchMethod('phone')}
                    className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-2 text-[11px] sm:text-xs font-semibold rounded-xl transition-all cursor-pointer ${authMethod === 'phone'
                        ? 'bg-card text-primary border border-border shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Phone</span>
                    <span className="hidden sm:inline">number</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={authMethod === 'email'}
                    onClick={() => switchMethod('email')}
                    className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-2 text-[11px] sm:text-xs font-semibold rounded-xl transition-all cursor-pointer ${authMethod === 'email'
                        ? 'bg-card text-primary border border-border shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Email</span>
                    <span className="hidden sm:inline">address</span>
                </button>
            </div>

            <form onSubmit={submit} className="space-y-4" aria-busy={processing}>
                {authMethod === 'phone' ? (
                    <div>
                        <InputLabel
                            htmlFor="phone"
                            value="Mobile phone number"
                            className="text-xs font-semibold text-foreground"
                        />

                        <div className="relative mt-1 group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none select-none">
                                +251
                            </span>
                            <Input
                                id="phone"
                                type="tel"
                                name="phone"
                                inputMode="numeric"
                                value={phoneNumber}
                                placeholder="9XXXXXXXX"
                                className="pl-16 border-input bg-background text-sm text-foreground placeholder:text-muted-foreground font-medium tracking-wider"
                                autoComplete="tel-national"
                                autoFocus
                                onChange={handlePhoneChange}
                            />
                        </div>

                        <InputError message={errors.login} className="mt-1.5" />
                    </div>
                ) : (
                    <div>
                        <InputLabel
                            htmlFor="email"
                            value="Email address"
                            className="text-xs font-semibold text-foreground"
                        />

                        <div className="mt-1">
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={emailAddress}
                                placeholder="Enter your email"
                                className="border-input bg-background text-sm text-foreground placeholder:text-muted-foreground"
                                autoComplete="username"
                                autoFocus
                                onChange={handleEmailChange}
                            />
                        </div>

                        <InputError message={errors.login} className="mt-1.5" />
                    </div>
                )}

                <div>
                    <div className="flex items-center justify-between">
                        <InputLabel
                            htmlFor="password"
                            value="Password"
                            className="text-xs font-semibold text-foreground"
                        />
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs text-primary underline-offset-4 hover:underline font-medium"
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

                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                    <label className="flex items-center cursor-pointer min-w-0">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            className="rounded-sm text-primary border border-border shrink-0 focus-visible:ring-ring/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            onCheckedChange={(checked) => setData('remember', checked === true)}
                        />
                        <span className="ms-2 text-xs text-muted-foreground">
                            Keep me signed in
                        </span>
                    </label>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-2.5 text-sm rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50"
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
