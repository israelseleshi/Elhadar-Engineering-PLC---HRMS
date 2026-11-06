import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="mb-4 text-sm text-muted-foreground">
                Forgot your password? No problem. Just let us know your email
                address and we will email you a password reset link that will
                allow you to choose a new one.
            </div>

            {status && (
                <div className="mb-4 text-sm font-semibold text-primary bg-primary/10 border border-primary/30 rounded-xl p-3">
                    {status}
                </div>
            )}

            <form onSubmit={submit} aria-busy={processing}>
                <div>
                    <InputLabel htmlFor="email" value="Email Address" />

                    <div className="mt-1">
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="block w-full rounded-xl border-input bg-background text-sm shadow-sm focus-visible:ring-ring/30 focus-visible:border-ring"
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                        />
                    </div>

                    <InputError message={errors.email} className="mt-2 text-xs" />
                </div>

                <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                    <Link
                        href={route('login')}
                        className="flex items-center justify-center sm:justify-start gap-1 text-xs text-primary hover:underline"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Sign In
                    </Link>

                    <Button
                        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold rounded-full normal-case tracking-normal disabled:pointer-events-none disabled:opacity-50"
                        disabled={processing}
                    >
                        Email Password Reset Link
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
