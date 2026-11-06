import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PasswordInput from '@/Components/PasswordInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';
import { Button } from '@/Components/ui/button';

export default function UpdatePasswordForm({ className = '' }: { className?: string }) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({ current_password: '', password: '', password_confirmation: '' });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) { reset('password', 'password_confirmation'); (passwordInput.current as any)?.focus?.(); }
                if (errors.current_password) { reset('current_password'); (currentPasswordInput.current as any)?.focus?.(); }
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">Update password</h2>
                <p className="mt-1 text-sm text-[#6e6e73]">Use a long, random password to keep your account secure.</p>
            </header>
            <form onSubmit={updatePassword} className="mt-6 space-y-5">
                <div>
                    <InputLabel htmlFor="current_password" value="Current password" className="text-xs font-semibold text-[#1d1d1f]" />
                    <div className="mt-1"><PasswordInput id="current_password" ref={currentPasswordInput as any} value={data.current_password} onChange={(e) => setData('current_password', e.target.value)} autoComplete="current-password" /></div>
                    <InputError message={errors.current_password} className="mt-1.5 text-xs text-[#ff3b30]" />
                </div>
                <div>
                    <InputLabel htmlFor="password" value="New password" className="text-xs font-semibold text-[#1d1d1f]" />
                    <div className="mt-1"><PasswordInput id="password" ref={passwordInput as any} value={data.password} onChange={(e) => setData('password', e.target.value)} autoComplete="new-password" /></div>
                    <InputError message={errors.password} className="mt-1.5 text-xs text-[#ff3b30]" />
                </div>
                <div>
                    <InputLabel htmlFor="password_confirmation" value="Confirm password" className="text-xs font-semibold text-[#1d1d1f]" />
                    <div className="mt-1"><PasswordInput id="password_confirmation" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} autoComplete="new-password" /></div>
                    <InputError message={errors.password_confirmation} className="mt-1.5 text-xs text-[#ff3b30]" />
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <Button type="submit" className="w-full sm:w-auto rounded-full" disabled={processing}>Save</Button>
                    <Transition show={recentlySuccessful} enter="transition ease-in-out" enterFrom="opacity-0" leave="transition ease-in-out" leaveTo="opacity-0"><p className="text-sm text-[#6e6e73]">Saved.</p></Transition>
                </div>
            </form>
        </section>
    );
}
