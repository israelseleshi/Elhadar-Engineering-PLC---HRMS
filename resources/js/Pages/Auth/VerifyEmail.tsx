import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { MailCheck } from 'lucide-react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />
            <div className="mb-5">
                <div className="flex items-center gap-2 mb-1.5"><MailCheck className="w-4 h-4 text-primary" /><h2 className="text-xl font-semibold tracking-tight text-foreground">Verify your email</h2></div>
                <p className="text-sm text-muted-foreground leading-relaxed">Thanks for signing up. Please verify your email address by clicking the link we sent you. If you didn’t receive it, we can send another.</p>
            </div>
            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-success bg-success/10 border border-success/30 rounded-xl p-3">A new verification link has been sent to your email address.</div>
            )}
            <form onSubmit={submit} className="space-y-3" aria-busy={processing}>
                <Button type="submit" className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50" disabled={processing}>{processing ? 'Sending...' : 'Resend verification email'}</Button>
                <div className="text-center">
                    <Link href={route('logout')} method="post" as="button" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">Sign out</Link>
                </div>
            </form>
        </GuestLayout>
    );
}
