import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout
            title="Profile"
            subtitle="Manage your account information and password."
        >
            <Head title="Profile" />

            <div className="space-y-6">
                <div className="bg-white p-4 shadow-sm border border-[#ebebec] rounded-xs sm:p-6 lg:p-8">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl w-full"
                    />
                </div>

                <div className="bg-white p-4 shadow-sm border border-[#ebebec] rounded-xs sm:p-6 lg:p-8">
                    <UpdatePasswordForm className="max-w-xl w-full" />
                </div>

                <div className="bg-white p-4 shadow-sm border border-[#ebebec] rounded-xs sm:p-6 lg:p-8">
                    <DeleteUserForm className="max-w-xl w-full" />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
