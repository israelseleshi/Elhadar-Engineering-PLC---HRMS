import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PasswordInput from '@/Components/PasswordInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { Head, useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { FormEventHandler } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';

export default function FirstPasswordChange({
    status,
}: {
    status?: string;
}) {
    const {
        data,
        setData,
        put,
        processing,
        errors,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.first-change.update'), {
            onSuccess: () => {},
            onError: (serverErrors) => {
                if (serverErrors.current_password) {
                    setData('current_password', '');
                }
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Change Your Password - Elhadar Engineering HRMS" />

            <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-[#008254]" />
                    <h2 className="text-xl font-bold text-black tracking-tight">
                        Change Your Password
                    </h2>
                </div>
                <p className="text-xs text-[#595959] mt-1 font-light">
                    This is your first login. Please set a new password to secure your account.
                </p>
            </div>

            {status && (
                <div className="mb-4 text-xs font-semibold text-[#008254] bg-[#effcf8] p-3 border border-[#b7ecda] rounded-xs">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Current Password"
                        className="text-xs font-semibold text-black"
                    />

                    <div className="mt-1 flex rounded-xs shadow-xs border border-[#d8d9da] focus-within:border-[#008254] focus-within:ring-1 focus-within:ring-[#008254] bg-white overflow-hidden">
                        <PasswordInput
                            id="current_password"
                            name="current_password"
                            value={data.current_password}
                            placeholder="Enter your temporary password"
                            autoComplete="current-password"
                            onChange={(e) => setData('current_password', e.target.value)}
                        />
                    </div>

                    <InputError
                        message={errors.current_password}
                        className="mt-1.5 text-xs text-[#de2828]"
                    />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password"
                        value="New Password"
                        className="text-xs font-semibold text-black"
                    />

                    <div className="mt-1 flex rounded-xs shadow-xs border border-[#d8d9da] focus-within:border-[#008254] focus-within:ring-1 focus-within:ring-[#008254] bg-white overflow-hidden">
                        <PasswordInput
                            id="password"
                            name="password"
                            value={data.password}
                            placeholder="Enter your new password"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                    </div>

                    <InputError message={errors.password} className="mt-1.5 text-xs text-[#de2828]" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm New Password"
                        className="text-xs font-semibold text-black"
                    />

                    <div className="mt-1 flex rounded-xs shadow-xs border border-[#d8d9da] focus-within:border-[#008254] focus-within:ring-1 focus-within:ring-[#008254] bg-white overflow-hidden">
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            placeholder="Confirm your new password"
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                        />
                    </div>

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-1.5 text-xs text-[#de2828]"
                    />
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full bg-[#008254] hover:bg-[#006642] text-white font-semibold py-2.5 text-sm rounded-xs shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                        disabled={processing}
                    >
                        <Lock className="h-3.5 w-3.5" />
                        <span>
                            {processing ? 'Updating...' : 'Change Password'}
                        </span>
                    </Button>
                </div>

                <div className="mt-4">
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs text-[#008254] text-center font-medium">
                            Password changed successfully. Redirecting to your profile...
                        </p>
                    </Transition>
                </div>
            </form>
        </GuestLayout>
    );
}
