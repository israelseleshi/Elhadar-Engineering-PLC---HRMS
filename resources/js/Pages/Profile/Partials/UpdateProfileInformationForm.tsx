import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }: { mustVerifyEmail: boolean; status?: string; className?: string }) {
    const user = usePage().props.auth.user;
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({ name: user.name, email: user.email ?? '' });

    const submit: FormEventHandler = (e) => { e.preventDefault(); patch(route('profile.update')); };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">Profile information</h2>
                <p className="mt-1 text-sm text-[#6e6e73]">Update your account name and email address.</p>
            </header>
            <form onSubmit={submit} className="mt-6 space-y-5">
                <div>
                    <InputLabel htmlFor="name" value="Name" className="text-xs font-semibold text-[#1d1d1f]" />
                    <Input id="name" className="mt-1" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoComplete="name" />
                    <InputError className="mt-1.5 text-xs text-[#ff3b30]" message={errors.name} />
                </div>
                <div>
                    <InputLabel htmlFor="email" value="Email" className="text-xs font-semibold text-[#1d1d1f]" />
                    <Input id="email" type="email" className="mt-1" value={data.email} onChange={(e) => setData('email', e.target.value)} required autoComplete="username" />
                    <InputError className="mt-1.5 text-xs text-[#ff3b30]" message={errors.email} />
                </div>
                {mustVerifyEmail && (user as any).email_verified_at === null && (
                    <div className="rounded-xl border border-[#e8e8ed] bg-[#f5f5f7] p-3">
                        <p className="text-sm text-[#424245]">Your email address is unverified. <Link href={route('verification.send')} method="post" as="button" className="text-[#0066cc] underline underline-offset-2 hover:text-[#0071e3]">Resend verification email</Link></p>
                        {status === 'verification-link-sent' && <div className="mt-2 text-sm font-medium text-[#1f7a3d]">A new verification link has been sent.</div>}
                    </div>
                )}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <Button type="submit" className="w-full sm:w-auto rounded-full" disabled={processing}>Save</Button>
                    <Transition show={recentlySuccessful} enter="transition ease-in-out" enterFrom="opacity-0" leave="transition ease-in-out" leaveTo="opacity-0"><p className="text-sm text-[#6e6e73]">Saved.</p></Transition>
                </div>
            </form>
        </section>
    );
}
