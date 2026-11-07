import { PropsWithChildren, useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/Components/ThemeToggle';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { BackgroundCubesGrid } from '@/Components/ui/background-cubes-grid';
import { useTheme } from 'next-themes';

export interface GuestLayoutProps extends PropsWithChildren {
    showCubesBackground?: boolean;
}

export default function Guest({
    children,
    showCubesBackground = false,
}: GuestLayoutProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted ? resolvedTheme === 'dark' : false;

    return (
        <div className="relative min-h-screen bg-[#f5f5f7] dark:bg-[#0c0c0f] flex flex-col justify-between text-[#1d1d1f] dark:text-foreground selection:bg-[#0066cc] selection:text-white overflow-hidden transition-colors duration-300">
            {/* 3D Perspective Background Cubes Grid */}
            {showCubesBackground && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <BackgroundCubesGrid
                        key={isDark ? 'dark' : 'light'}
                        variant="perspective"
                        gridSize={44}
                        gap={0.08}
                        baseColor={isDark ? '#1c1c22' : '#e5e5eb'}
                        waveColor={isDark ? '#2997ff' : '#0066cc'}
                        backgroundColor={isDark ? '#0c0c0f' : '#f5f5f7'}
                        glow={isDark ? 0.95 : 0.85}
                        amplitude={0.5}
                        tilt={0.65}
                        idleRipples={true}
                    />
                </div>
            )}

            {/* Top Bar with Enterprise Badge and Theme Toggler */}
            <div className="relative z-20 bg-[#1d1d1f]/95 dark:bg-[#121215]/95 backdrop-blur-md text-white py-2 px-3 sm:px-8 text-[11px] sm:text-xs font-medium flex items-center justify-between gap-2 border-b border-black/20">
                <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#2997ff] shrink-0" />
                    <span className="truncate">El-Hadar Engineering PLC</span>
                    <span className="text-white/50 hidden sm:inline">| Employee Portal</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <ThemeToggle className="scale-[0.92] origin-right border-white/10 bg-white/10" appearance="dark" />
                </div>
            </div>

            {/* Central Auth Container */}
            <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 py-10 sm:py-16">
                <div className="mb-6 text-center">
                    <Link href="/" className="inline-flex items-center space-x-3.5 group">
                        <ApplicationLogo className="h-12 w-12 shrink-0 drop-shadow-sm" />
                        <div className="text-left">
                            <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f] dark:text-foreground leading-tight">El-Hadar Engineering PLC</h1>
                            <span className="text-xs text-[#0066cc] dark:text-[#2997ff] font-medium">HRMS Enterprise Portal</span>
                        </div>
                    </Link>
                </div>
                <div className="w-full sm:max-w-md bg-white/92 dark:bg-card/90 backdrop-blur-xl border border-[#d2d2d7]/80 dark:border-border/80 rounded-2xl p-6 sm:p-8 shadow-2xl transition-colors">
                    {children}
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-20 border-t border-[#e8e8ed]/80 dark:border-border/80 bg-white/80 dark:bg-card/80 backdrop-blur-md py-4 px-6 text-center text-xs text-[#86868b] dark:text-muted-foreground transition-colors">
                &copy; {new Date().getFullYear()} El-Hadar Engineering PLC &middot; HR &amp; Payroll System &middot; Addis Ababa, Ethiopia
            </div>
        </div>
    );
}
