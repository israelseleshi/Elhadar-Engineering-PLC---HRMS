import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, CalendarDays, GraduationCap, UserCheck, LogOut,
    Menu, X, TrendingUp, UserMinus, UserPlus, Sliders, Activity, Compass
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { ThemeToggle } from '@/Components/ThemeToggle';
import SystemTour from '@/Components/SystemTour';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { formatEthPhone } from '@/lib/utils';
import { Toaster } from '@/Components/ui/sonner';
import { toast } from 'sonner';
import { PageProps } from '@/types';

interface Props { header?: ReactNode; title?: string; subtitle?: string; }

export default function AuthenticatedLayout({ header, title, subtitle, children }: PropsWithChildren<Props>) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth.user;
    const displayPhone = formatEthPhone(user?.phone) || user?.phone || user?.email;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('hrms_sidebar_collapsed') === 'true';
        return false;
    });
    const [tourOpen, setTourOpen] = useState(false);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (flash?.warning) toast.warning(flash.warning);
        if (flash?.info) toast.info(flash.info);
    }, [flash]);

    const toggleSidebar = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(!sidebarOpen);
        else setSidebarCollapsed((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') localStorage.setItem('hrms_sidebar_collapsed', String(next));
            return next;
        });
    };

    const isEmployee = user.role === 'Employee';
    const navItems = isEmployee
        ? [{ name: 'My Self-Service', href: route('portal.profile'), routeName: 'portal.*', icon: UserCheck }]
        : [
            { name: 'Dashboard', href: route('dashboard'), routeName: 'dashboard', icon: LayoutDashboard },
            { name: 'Staff Directory', href: route('employees.index'), routeName: 'employees.*', icon: Users },
            { name: 'Leave Ledger', href: route('leave.index'), routeName: 'leave.*', icon: CalendarDays },
            { name: 'Training Registry', href: route('training.index'), routeName: 'training.*', icon: GraduationCap },
            { name: 'Promotions Ledger', href: route('promotions.index'), routeName: 'promotions.*', icon: TrendingUp },
            { name: 'New Employees', href: route('new-employees.index'), routeName: 'new-employees.*', icon: UserPlus },
            { name: 'Separations & Exits', href: route('separations.index'), routeName: 'separations.*', icon: UserMinus },
            { name: 'Statutory Settings', href: route('settings.index'), routeName: 'settings.*', icon: Sliders },
            { name: 'Security Audit Log', href: route('audit.index'), routeName: 'audit.*', icon: Activity },
            { name: 'My Self-Service', href: route('portal.profile'), routeName: 'portal.*', icon: UserCheck },
        ];

    const isCurrent = (name: string) => { try { return route().current(name); } catch { return false; } };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
            <div className="bg-background text-foreground px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs flex flex-wrap justify-between items-center gap-x-3 gap-y-1 border-b border-border/50">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground truncate">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-primary" /> <span className="truncate">El-Hadar Engineering PLC</span>
                    </span>
                    <span className="hidden md:inline text-muted-foreground">|</span>
                    <span className="hidden md:inline text-muted-foreground">Employee Records, Leave &amp; Payroll</span>
                </div>
                <span className="text-muted-foreground hidden sm:inline">Active Fiscal Period: 2017/2018 E.C.</span>
            </div>

            <div className="flex flex-1">
                {!isEmployee && (
                    <aside className={`hidden lg:flex flex-col bg-background/95 backdrop-blur border-r border-border shrink-0 transition-all duration-300 ease-in-out select-none ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
                        <div className={`border-b border-border flex items-center transition-all duration-300 ${sidebarCollapsed ? 'p-3.5 justify-center' : 'p-4 justify-between'}`}>
                            <Link href={route('dashboard')} className="flex items-center gap-2.5 group overflow-hidden">
                                <ApplicationLogo className="w-8 h-8 shrink-0" />
                                {!sidebarCollapsed && (
                                    <div className="whitespace-nowrap">
                                        <h1 className="text-sm font-semibold text-foreground tracking-tight leading-tight">El-Hadar Engineering PLC</h1>
                                        <p className="text-[11px] font-medium text-primary">HR &amp; Payroll System</p>
                                    </div>
                                )}
                            </Link>
                        </div>

                        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
                            {!sidebarCollapsed && <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground whitespace-nowrap">Core Operations</div>}
                            {navItems.map((item) => {
                                const active = isCurrent(item.routeName);
                                const Icon = item.icon;
                                return (
                                    <Link key={item.name} href={item.href} title={sidebarCollapsed ? item.name : undefined}
                                        className={`flex items-center text-[13px] font-medium transition-all ${sidebarCollapsed
                                            ? `justify-center w-11 h-10 mx-auto rounded-xl ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`
                                            : `gap-3 px-3 py-2.5 rounded-xl ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}`}>
                                        <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                        {!sidebarCollapsed && <span className="truncate whitespace-nowrap">{item.name}</span>}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className={`border-t border-border transition-all duration-300 ${sidebarCollapsed ? 'p-3 flex flex-col items-center gap-3' : 'p-4'}`}>
                            {sidebarCollapsed ? (
                                <>
                                    <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold uppercase shrink-0" title={`${user.name} (${displayPhone})`}>{user.name.charAt(0)}</div>
                                    <Link href={route('logout')} method="post" as="button" title="Sign Out" className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-background rounded-xl border border-border transition-colors"><LogOut className="w-4 h-4" /></Link>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2.5 mb-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold uppercase shrink-0">{user.name.charAt(0)}</div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-semibold text-foreground truncate leading-none">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">{displayPhone}</p>
                                        </div>
                                    </div>
                                    <Link href={route('logout')} method="post" as="button" className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-background rounded-xl border border-border transition-colors">
                                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                                    </Link>
                                </>
                            )}
                        </div>
                    </aside>
                )}

                <div className="flex-1 flex flex-col min-w-0">
                    <header className="min-h-14 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between gap-3 px-3 sm:px-4 lg:px-8 py-2 shrink-0 sticky top-0 z-20">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            {!isEmployee ? (
                                <button onClick={toggleSidebar} className="p-2 -ml-1 sm:-ml-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer shrink-0" aria-label="Toggle navigation menu" title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                                    <Menu className="w-5 h-5" />
                                </button>
                            ) : null}
                            <Link href={isEmployee ? route('portal.profile') : route('dashboard')} className={`${!isEmployee && !sidebarCollapsed ? 'lg:hidden' : ''} flex items-center gap-2 transition-opacity duration-300 shrink-0`}>
                                <ApplicationLogo className="w-8 h-8 shrink-0" />
                                <div className="min-w-0 hidden sm:block">
                                    <span className="font-semibold text-foreground text-sm block leading-none truncate">El-Hadar</span>
                                    <span className="text-[10px] font-medium text-primary block mt-0.5 truncate">HRMS</span>
                                </div>
                            </Link>

                            {/* Page Title & Subtitle Integrated in Header */}
                            {title && (
                                <div className="min-w-0 flex flex-col justify-center border-l border-border/60 pl-2.5 sm:pl-3 ml-0.5 sm:ml-1">
                                    <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight truncate">
                                        {title}
                                    </h1>
                                    {subtitle && (
                                        <p className="text-[11px] text-muted-foreground truncate hidden md:block max-w-md lg:max-w-xl">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                            <ThemeToggle className="mr-0.5" />
                            {!isEmployee ? (
                                <>
                                    <Button size="sm" variant="outline" onClick={() => {
                                        if (typeof window !== 'undefined') {
                                            if (window.location.pathname.includes('/employees') && !window.location.pathname.includes('/create')) window.dispatchEvent(new CustomEvent('open-staff-directory-tour'));
                                            else if (window.location.pathname.includes('/leave')) window.dispatchEvent(new CustomEvent('open-leave-ledger-tour'));
                                            else if (window.location.pathname.includes('/dashboard') || window.location.pathname === '/') window.dispatchEvent(new CustomEvent('open-dashboard-tour'));
                                            else setTourOpen(true);
                                        }
                                    }} className="hidden md:inline-flex gap-1.5 text-xs font-medium rounded-full border-border">
                                        <Compass className="w-3.5 h-3.5 text-primary" /><span>Tour</span>
                                    </Button>
                                    <Link href={route('employees.create')}><Button size="sm" className="hidden md:inline-flex gap-1.5 text-xs font-medium rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"><UserPlus className="w-3.5 h-3.5" /><span>Onboard Staff</span></Button></Link>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <span className="text-xs text-muted-foreground hidden md:inline max-w-[160px] truncate">Welcome, {user.name}</span>
                                    <Link href={route('logout')} method="post" as="button" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent border border-border rounded-full transition-colors"><LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sign Out</span></Link>
                                </div>
                            )}
                        </div>
                    </header>

                    {sidebarOpen && (
                        <div className="lg:hidden fixed inset-0 z-50 flex">
                            <div className="fixed inset-0 bg-foreground/20 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
                            <div className="relative w-[280px] bg-background backdrop-blur-xl flex flex-col h-full border-r border-border z-10 p-4 shadow-apple">
                                <div className="flex items-center justify-between pb-4 border-b border-border">
                                    <Link href={route('dashboard')} className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
                                        <ApplicationLogo className="w-8 h-8 shrink-0" />
                                        <div><span className="font-semibold text-foreground text-sm block leading-tight">El-Hadar Engineering PLC</span><span className="text-[10px] font-medium text-primary block mt-0.5">HR &amp; Payroll System</span></div>
                                    </Link>
                                    <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
                                </div>
                                <nav className="mt-4 space-y-1 flex-1">
                                    {navItems.map((item) => (
                                        <Link key={item.name} href={item.href} onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground rounded-xl">
                                            <item.icon className="w-4 h-4 text-muted-foreground" /><span>{item.name}</span>
                                        </Link>
                                    ))}
                                </nav>
                                <div className="pt-4 border-t border-border">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold uppercase shrink-0">{user.name.charAt(0)}</div>
                                        <div className="overflow-hidden"><p className="text-sm font-semibold text-foreground truncate leading-none">{user.name}</p><p className="text-xs text-muted-foreground truncate mt-0.5">{displayPhone}</p></div>
                                    </div>
                                    <Link href={route('logout')} method="post" as="button" className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-destructive bg-accent rounded-xl"><LogOut className="w-4 h-4" /> Sign Out</Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Slim Toolbar only if custom header element is provided */}
                    {header && (
                        <div className="bg-background border-b border-border px-4 sm:px-6 lg:px-8 py-3">
                            <div className="max-w-7xl mx-auto min-w-0">
                                {header}
                            </div>
                        </div>
                    )}

                    <main className="flex-1 px-3 py-4 lg:px-6 lg:py-6 max-w-7xl mx-auto w-full">{children}</main>

                    <footer className="bg-background/50 border-t border-border py-4 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
                        <div className="min-w-0">&copy; {new Date().getFullYear()} El-Hadar Engineering PLC. All rights reserved.</div>
                        <div className="flex items-center gap-4"><span className="font-medium text-muted-foreground">Employee Records, Leave &amp; Payroll</span></div>
                    </footer>
                </div>
            </div>

            <SystemTour open={tourOpen} onClose={() => setTourOpen(false)} />
            <Toaster richColors position="top-right" closeButton />
        </div>
    );
}
