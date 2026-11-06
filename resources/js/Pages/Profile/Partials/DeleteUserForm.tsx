import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PasswordInput from '@/Components/PasswordInput';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';

export default function DeleteUserForm({ className = '' }: { className?: string }) {
    const [confirming, setConfirming] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);
    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({ password: '' });

    const close = () => { setConfirming(false); clearErrors(); reset(); };
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'), { preserveScroll: true, onSuccess: close, onError: () => (passwordInput.current as any)?.focus?.(), onFinish: () => reset() });
    };

    return (
        <section className={`space-y-5 ${className}`}>
            <header>
                <h2 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">Delete account</h2>
                <p className="mt-1 text-sm text-[#6e6e73]">Once deleted, your account and data are permanently removed. Download anything you need first.</p>
            </header>
            <Button variant="destructive" className="rounded-full" onClick={() => setConfirming(true)}>Delete account</Button>
            <Dialog open={confirming} onOpenChange={(o) => !o && close()}>
                <DialogContent className="bg-white border-[#d2d2d7] rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#1d1d1f]">Delete your account?</DialogTitle>
                        <DialogDescription className="text-[#6e6e73]">This action is permanent. Enter your password to confirm.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="delete_password" value="Password" className="text-xs font-semibold text-[#1d1d1f]" />
                            <div className="mt-1"><PasswordInput id="delete_password" name="password" ref={passwordInput as any} value={data.password} onChange={(e) => setData('password', e.target.value)} autoComplete="current-password" /></div>
                            <InputError message={errors.password} className="mt-1.5 text-xs text-[#ff3b30]" />
                        </div>
                        <DialogFooter className="gap-2 sm:gap-2">
                            <Button type="button" variant="outline" className="rounded-full" onClick={close}>Cancel</Button>
                            <Button type="submit" variant="destructive" className="rounded-full" disabled={processing}>{processing ? 'Deleting...' : 'Delete account'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </section>
    );
}
