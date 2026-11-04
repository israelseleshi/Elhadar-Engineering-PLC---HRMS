import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    Users, 
    Briefcase, 
    CalendarClock, 
    CalendarDays,
    GraduationCap,
    UserCheck,
    Receipt, 
    LogOut, 
    Search, 
    Building2,
    ShieldCheck,
    Menu,
    X,
    Bell,
    TrendingUp,
    UserMinus,
    UserPlus,
    FileSpreadsheet,
    Sliders,
    Activity,
    Compass
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import SystemTour from '@/Components/SystemTour';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { formatEthPhone } from '@/lib/utils';
import { Toaster } from '@/Components/ui/sonner';
import { toast } from 'sonner';
import { PageProps } from '@/types';

interface Props {
    header?: ReactNode;
    title?: string;
    subtitle?: string;
}

export default function AuthenticatedLayout({
    header,
    title,
    subtitle,
    children,
}: PropsWithChildren<Props>) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth.user;
    const displayPhone = formatEthPhone(user?.phone) || user?.phone || user?.email;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('hrms_sidebar_collapsed') === 'true';
        }
        return false;
    });
    const [tourOpen, setTourOpen] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.warning) {
            toast.warning(flash.warning);
        }
        if (flash?.info) {
            toast.info(flash.info);
        }
    }, [flash]);

    const toggleSidebar = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setSidebarOpen(!sidebarOpen);
        } else {
            setSidebarCollapsed((prev) => {
                const next = !prev;
                if (typeof window !== 'undefined') {
                    localStorage.setItem('hrms_sidebar_collapsed', String(next));
                }
                return next;
            });
        }
    };

    const isEmployee = user.role === 'Employee';

    const navItems = isEmployee
        ? [
            { name: 'My Self-Service', href: route('portal.profile'), routeName: 'portal.*', icon: UserCheck },
        ]
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

    const isCurrent = (name: string) => {
        try {
            return route().current(name);
        } catch {
            return false;
        }
    };

    return (
        <div className="min-h-screen bg-[#f7f7f7] text-[#3d4045] font-sans flex flex-col">
            {/* Top Operational Ribbon (NerdWallet Style) */}
            <div className="bg-[#00482f] text-white px-4 py-1.5 text-xs flex justify-between items-center border-b border-[#003824]">
                <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#ddfa88]">
                        <ShieldCheck className="w-3.5 h-3.5" /> El-Hadar Engineering PLC
                    </span>
                    <span className="hidden md:inline text-white/60">|</span>
                    <span className="hidden md:inline text-white/80">Employee Records, Leave &amp; Payroll</span>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-white/80 hidden sm:inline">Active Fiscal Period: 2017/2018 E.C.</span>
                </div>
            </div>

            <div className="flex flex-1">
                {/* Desktop Sidebar */}
                {!isEmployee && (
                    <aside
                        className={`hidden lg:flex flex-col bg-white border-r border-[#d8d9da] shrink-0 transition-all duration-300 ease-in-out select-none ${
                            sidebarCollapsed ? 'w-20' : 'w-64'
                        }`}
                    >
                        {/* Brand Header */}
                        <div
                            className={`border-b border-[#ebebec] flex items-center transition-all duration-300 ${
                                sidebarCollapsed ? 'p-3.5 justify-center' : 'p-5 justify-between'
                            }`}
                        >
                            <Link href={route('dashboard')} className="flex items-center gap-2.5 group overflow-hidden">
                                <ApplicationLogo className="w-9 h-9 shrink-0" />
                                {!sidebarCollapsed && (
                                    <div className="whitespace-nowrap transition-opacity duration-300">
                                        <h1 className="text-sm font-bold text-black tracking-tight leading-tight">
                                            El-Hadar Engineering PLC
                                        </h1>
                                        <p className="text-[11px] font-semibold text-[#008254]">
                                            HR &amp; Payroll System
                                        </p>
                                    </div>
                                )}
                            </Link>
                        </div>

                        {/* Navigation Items */}
                        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
                            {!sidebarCollapsed && (
                                <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#64666a] whitespace-nowrap">
                                    Core Operations
                                </div>
                            )}
                            {navItems.map((item) => {
                                const active = isCurrent(item.routeName);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        title={sidebarCollapsed ? item.name : undefined}
                                        className={`flex items-center text-sm font-medium transition-colors ${
                                            sidebarCollapsed
                                                ? `justify-center w-12 h-10 mx-auto rounded-md ${
                                                    active
                                                        ? 'bg-[#effcf8] text-[#008254] font-bold ring-1 ring-[#008254]/30'
                                                        : 'text-[#3d4045] hover:bg-[#f7f7f7] hover:text-black'
                                                  }`
                                                : `gap-3 px-3.5 py-2.5 ${
                                                    active
                                                        ? 'bg-[#effcf8] text-[#008254] font-bold border-l-4 border-[#008254] -ml-3 pl-6'
                                                        : 'text-[#3d4045] hover:bg-[#f7f7f7] hover:text-black rounded-xs'
                                                  }`
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#008254]' : 'text-[#64666a]'}`} />
                                        {!sidebarCollapsed && (
                                            <span className="truncate whitespace-nowrap">{item.name}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User & System Status Card at Bottom of Sidebar */}
                        <div
                            className={`border-t border-[#ebebec] bg-[#f7f7f7]/60 transition-all duration-300 ${
                                sidebarCollapsed ? 'p-3 flex flex-col items-center gap-3' : 'p-4'
                            }`}
                        >
                            {sidebarCollapsed ? (
                                <>
                                    <div
                                        className="w-9 h-9 rounded-full bg-[#008254] text-white flex items-center justify-center text-xs font-bold uppercase shrink-0"
                                        title={`${user.name} (${displayPhone})`}
                                    >
                                        {user.name.charAt(0)}
                                    </div>
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        title="Sign Out"
                                        className="w-10 h-10 flex items-center justify-center text-[#64666a] hover:text-[#de2828] hover:bg-white rounded-md border border-[#d8d9da] transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2.5 overflow-hidden">
                                            <div className="w-8 h-8 rounded-full bg-[#008254] text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-bold text-black truncate leading-none">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-[#64666a] truncate mt-0.5">
                                                    {displayPhone}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-[#64666a] hover:text-[#de2828] hover:bg-white rounded-xs border border-[#d8d9da] transition-colors"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        Sign Out
                                    </Link>
                                </>
                            )}
                        </div>
                    </aside>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Top Bar */}
                    <header className="h-16 bg-white border-b border-[#d8d9da] flex items-center justify-between px-4 lg:px-8 shrink-0">
                        <div className="flex items-center gap-3">
                            {!isEmployee ? (
                                <button
                                    onClick={toggleSidebar}
                                    className="p-2 -ml-2 text-[#64666a] hover:text-black hover:bg-[#f7f7f7] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#008254]/30 cursor-pointer"
                                    aria-label="Toggle navigation menu"
                                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                                >
                                    <Menu className="w-5 h-5 transition-transform duration-200" />
                                </button>
                            ) : null}
                            <Link href={isEmployee ? route('portal.profile') : route('dashboard')} className={`${!isEmployee && !sidebarCollapsed ? 'lg:hidden' : ''} flex items-center gap-2 transition-opacity duration-300`}>
                                <ApplicationLogo className="w-8 h-8 shrink-0" />
                                <div>
                                    <span className="font-bold text-black text-sm block leading-none">El-Hadar Engineering PLC</span>
                                    <span className="text-[10px] font-semibold text-[#008254] block mt-0.5">HR &amp; Payroll System</span>
                                </div>
                            </Link>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {!isEmployee ? (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            if (typeof window !== 'undefined') {
                                                if (window.location.pathname.includes('/employees') && !window.location.pathname.includes('/create')) {
                                                    window.dispatchEvent(new CustomEvent('open-staff-directory-tour'));
                                                } else if (window.location.pathname.includes('/leave')) {
                                                    window.dispatchEvent(new CustomEvent('open-leave-ledger-tour'));
                                                } else {
                                                    setTourOpen(true);
                                                }
                                            }
                                        }}
                                        className="hidden sm:inline-flex gap-1.5 text-xs font-semibold bg-[#effcf8] hover:bg-[#d5f7ed] text-[#008254] border-[#008254]/30 rounded-xs"
                                    >
                                        <Compass className="w-3.5 h-3.5" />
                                        <span>Interactive Tour</span>
                                    </Button>
                                    <Link href={route('employees.create')}>
                                        <Button size="sm" className="hidden sm:inline-flex gap-1.5 text-xs font-semibold bg-[#008254] hover:bg-[#006a44] text-white rounded-xs">
                                            <UserPlus className="w-3.5 h-3.5" />
                                            <span>Onboard Staff</span>
                                        </Button>
                                    </Link>
                                    <Link href={route('employees.index')}>
                                        <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-2 text-xs font-semibold">
                                            <Search className="w-3.5 h-3.5 text-[#008254]" />
                                            <span>Quick Search</span>
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-[#64666a]">Welcome, {user.name}</span>
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#008254] hover:bg-[#effcf8] border border-[#d8d9da] rounded-xs transition-colors"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>Sign Out</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Mobile Sidebar Overlay */}
                    {sidebarOpen && (
                        <div className="lg:hidden fixed inset-0 z-50 flex">
                            <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
                            <div className="relative w-64 bg-white flex flex-col h-full border-r border-[#d8d9da] z-10 p-4">
                                <div className="flex items-center justify-between pb-4 border-b border-[#ebebec]">
                                    <Link href={route('dashboard')} className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
                                        <ApplicationLogo className="w-8 h-8 shrink-0" />
                                        <div>
                                            <span className="font-bold text-black text-sm block leading-tight">El-Hadar Engineering PLC</span>
                                            <span className="text-[10px] font-semibold text-[#008254] block mt-0.5">HR &amp; Payroll System</span>
                                        </div>
                                    </Link>
                                    <button onClick={() => setSidebarOpen(false)} className="text-[#64666a] hover:text-black p-1">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <nav className="mt-4 space-y-1 flex-1">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#3d4045] hover:bg-[#effcf8] hover:text-[#008254] rounded-xs"
                                        >
                                            <item.icon className="w-4 h-4" />
                                            <span>{item.name}</span>
                                        </Link>
                                    ))}
                                </nav>
                                <div className="pt-4 border-t border-[#ebebec]">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-[#008254] text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-black truncate leading-none">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-[#64666a] truncate mt-0.5">
                                                {displayPhone}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#de2828] bg-[#f7f7f7] rounded-xs"
                                    >
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hero Band / Editorial Heading if provided */}
                    {(title || header) && (
                        <div className="bg-[#008254] text-white px-6 lg:px-8 py-7 shadow-sm">
                            <div className="max-w-7xl mx-auto">
                                {header ? (
                                    header
                                ) : (
                                    <div>
                                        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                                            {title}
                                        </h2>
                                        {subtitle && (
                                            <p className="mt-1 text-sm text-[#e3faf2] font-light max-w-2xl">
                                                {subtitle}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Main Content Body */}
                    <main className="flex-1 px-3 py-6 lg:px-4 lg:py-8 max-w-7xl mx-auto w-full">
                        {children}
                    </main>

                    {/* Footer */}
                    <footer className="bg-white border-t border-[#ebebec] py-4 px-6 lg:px-8 text-xs text-[#64666a] flex flex-col sm:flex-row justify-between items-center gap-2">
                        <div>
                            &copy; {new Date().getFullYear()} El-Hadar Engineering PLC. All rights reserved.
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-medium">Employee Records, Leave &amp; Payroll</span>
                        </div>
                    </footer>
                </div>
            </div>

            {/* Guided System Tour Modal */}
            <SystemTour open={tourOpen} onClose={() => setTourOpen(false)} />

            {/* Global Toaster for Flash and Client Notifications */}
            <Toaster richColors position="top-right" closeButton />
        </div>
    );
}
