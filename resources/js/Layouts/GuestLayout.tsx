import { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/Components/ThemeToggle';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-background flex flex-col justify-between text-[#1d1d1f] dark:text-foreground selection:bg-[#0066cc] selection:text-white">
            <div className="bg-[#1d1d1f] text-white py-2 px-3 sm:px-8 text-[11px] sm:text-xs font-medium flex items-center justify-between gap-2 border-b border-black/20">
                <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#2997ff] shrink-0" />
                    <span className="truncate">El-Hadar Engineering PLC</span>
                    <span className="text-white/50 hidden sm:inline">| Employee Portal</span>
                </div>
                <ThemeToggle className="scale-[0.92] origin-right border-white/10 bg-white/10" appearance="dark" />
            </div>

            <div className="flex-1 flex flex-col justify-center items-center px-4 py-10 sm:py-16">
                <div className="mb-6 text-center">
                    <Link href="/" className="inline-flex items-center space-x-3.5 group">
                        <ApplicationLogo className="h-12 w-12 shrink-0" />
                        <div className="text-left">
                            <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f] dark:text-foreground leading-tight">El-Hadar Engineering PLC</h1>
                            <span className="text-xs text-[#0066cc] dark:text-[#2997ff] font-medium">HRMS Enterprise Portal</span>
                        </div>
                    </Link>
                </div>
                <div className="w-full sm:max-w-md bg-white dark:bg-card border border-[#d2d2d7] dark:border-border rounded-2xl p-6 sm:p-8 shadow-apple">
                    {children}
                </div>
            </div>

            <div className="border-t border-[#e8e8ed] dark:border-border bg-white/70 dark:bg-card/50 py-4 px-6 text-center text-xs text-[#86868b] dark:text-muted-foreground">
                &copy; {new Date().getFullYear()} El-Hadar Engineering PLC &middot; HR &amp; Payroll System &middot; Addis Ababa, Ethiopia
            </div>
        </div>
    );
}
