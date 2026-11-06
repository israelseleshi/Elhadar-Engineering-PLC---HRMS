import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PasswordInput from '@/Components/PasswordInput';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { KeyRound } from 'lucide-react';

export default function ResetPassword({ token, email }: { token: string; email: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({ token, email, password: '', password_confirmation: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />
            <div className="mb-5">
                <div className="flex items-center gap-2 mb-1.5"><KeyRound className="w-4 h-4 text-primary" /><h2 className="text-xl font-semibold tracking-tight text-foreground">Reset password</h2></div>
                <p className="text-sm text-muted-foreground leading-relaxed">Choose a strong new password for your account.</p>
            </div>
            <form onSubmit={submit} className="space-y-4" aria-busy={processing}>
                <div>
                    <InputLabel htmlFor="email" value="Email" className="text-xs font-semibold text-foreground" />
                    <Input id="email" type="email" name="email" value={data.email} className="mt-1" autoComplete="username" onChange={(e) => setData('email', e.target.value)} />
                    <InputError message={errors.email} className="mt-1.5 text-xs" />
                </div>
                <div>
                    <InputLabel htmlFor="password" value="New password" className="text-xs font-semibold text-foreground" />
                    <div className="mt-1"><PasswordInput id="password" name="password" value={data.password} isFocused autoComplete="new-password" onChange={(e) => setData('password', e.target.value)} /></div>
                    <InputError message={errors.password} className="mt-1.5 text-xs" />
                </div>
                <div>
                    <InputLabel htmlFor="password_confirmation" value="Confirm new password" className="text-xs font-semibold text-foreground" />
                    <div className="mt-1"><PasswordInput id="password_confirmation" name="password_confirmation" value={data.password_confirmation} autoComplete="new-password" onChange={(e) => setData('password_confirmation', e.target.value)} /></div>
                    <InputError message={errors.password_confirmation} className="mt-1.5 text-xs" />
                </div>
                <Button type="submit" className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50" disabled={processing}>{processing ? 'Resetting...' : 'Reset password'}</Button>
                <div className="text-center"><Link href={route('login')} className="text-xs text-primary hover:underline">Back to sign in</Link></div>
            </form>
        </GuestLayout>
    );
}
