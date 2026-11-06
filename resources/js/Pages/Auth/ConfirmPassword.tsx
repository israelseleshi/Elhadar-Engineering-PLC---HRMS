import { FormEventHandler } from 'react';
import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PasswordInput from '@/Components/PasswordInput';
import { Button } from '@/Components/ui/button';
import { ShieldCheck } from 'lucide-react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({ password: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />
            <div className="mb-5">
                <div className="flex items-center gap-2 mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">Confirm password</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">This is a secure area. Please confirm your password before continuing.</p>
            </div>
            <form onSubmit={submit} className="space-y-4" aria-busy={processing}>
                <div>
                    <InputLabel htmlFor="password" value="Password" className="text-xs font-semibold text-foreground" />
                    <div className="mt-1"><PasswordInput id="password" name="password" value={data.password} isFocused onChange={(e) => setData('password', e.target.value)} autoComplete="current-password" /></div>
                    <InputError message={errors.password} className="mt-1.5 text-xs" />
                </div>
                <Button type="submit" className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50" disabled={processing}>{processing ? 'Confirming...' : 'Confirm'}</Button>
            </form>
        </GuestLayout>
    );
}
