import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
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

            <div className="mb-4 text-sm text-[#595959]">
                Forgot your password? No problem. Just let us know your email
                address and we will email you a password reset link that will
                allow you to choose a new one.
            </div>

            {status && (
                <div className="mb-4 text-sm font-semibold text-[#008254] bg-[#effcf8] p-3 border border-[#b7ecda] rounded-xs">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Email Address" />

                    <div className="mt-1">
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="block w-full rounded-xs border border-[#d8d9da] bg-white text-sm shadow-sm focus:border-[#008254] focus:ring-[#008254] px-3 py-2"
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                        />
                    </div>

                    <InputError message={errors.email} className="mt-2 text-xs text-[#de2828]" />
                </div>

                <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                    <Link
                        href={route('login')}
                        className="flex items-center justify-center sm:justify-start gap-1 text-xs text-[#008254] hover:underline"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Sign In
                    </Link>

                    <Button
                        className="w-full sm:w-auto bg-[#008254] hover:bg-[#006642] text-white text-xs font-bold uppercase tracking-wider rounded-xs"
                        disabled={processing}
                    >
                        Email Password Reset Link
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
