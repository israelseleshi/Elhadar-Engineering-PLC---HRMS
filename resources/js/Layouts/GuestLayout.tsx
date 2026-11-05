import { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-[#faf9f5] flex flex-col justify-between text-[#0a0b0d] selection:bg-[#008254] selection:text-white">
            {/* Top Statutory Compliance Ribbon */}
            <div className="bg-[#008254] text-white py-1.5 px-3 sm:px-8 text-[11px] sm:text-xs font-semibold flex flex-wrap items-center justify-between gap-2 border-b border-[#006642]">
                <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#e8fdac] shrink-0" />
                    <span className="font-semibold truncate">El-Hadar Engineering PLC</span>
                    <span className="text-[#b7ecda] hidden sm:inline">| Employee Portal</span>
                </div>
            </div>

            {/* Central Box */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 py-10 sm:py-16">
                <div className="mb-6 text-center">
                    <Link href="/" className="inline-flex items-center space-x-3.5 group">
                        <ApplicationLogo className="h-12 w-12 shrink-0" />
                        <div className="text-left">
                            <h1 className="text-xl font-bold tracking-tight text-black leading-tight">
                                El-Hadar Engineering PLC
                            </h1>
                            <span className="text-xs text-[#008254] font-semibold">
                                HRMS Enterprise Portal
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="w-full sm:max-w-md bg-white border border-[#d8d9da] rounded-xs p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                    {children}
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#ebebec] bg-white py-4 px-6 text-center text-xs text-[#595959]">
                &copy; {new Date().getFullYear()} El-Hadar Engineering PLC &middot; HR &amp; Payroll System &middot; Addis Ababa, Ethiopia
            </div>
        </div>
    );
}
