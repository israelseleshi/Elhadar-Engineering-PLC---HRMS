import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import { 
    User, 
    ShieldCheck, 
    LogOut, 
    Menu, 
    X, 
    UserCheck, 
    LayoutDashboard, 
    ArrowLeft 
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { formatEthPhone } from '@/lib/utils';
import { Toaster } from '@/Components/ui/sonner';
import { toast } from 'sonner';
import { PageProps } from '@/types';

interface Props {
    title?: string;
    subtitle?: string;
}

export default function PortalLayout({
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
            return localStorage.getItem('hrms_portal_sidebar_collapsed') === 'true';
        }
        return false;
    });

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
                    localStorage.setItem('hrms_portal_sidebar_collapsed', String(next));
                }
                return next;
            });
        }
    };

    const isCurrent = (name: string) => {
        try {
            return route().current(name);
        } catch {
            return false;
        }
    };

    const navItems = [
        { 
            name: 'My Profile & Records', 
            href: route('portal.profile'), 
            routeName: 'portal.*', 
            icon: UserCheck 
        },
        ...(user.role !== 'Employee' ? [
            { 
                name: 'HR Admin Console', 
                href: route('dashboard'), 
                routeName: 'dashboard', 
                icon: LayoutDashboard 
            }
        ] : []),
    ];

    return (
        <div className="min-h-screen bg-[#f7f7f7] text-[#3d4045] font-sans flex flex-col">
            {/* Top Operational Ribbon */}
            <header className="bg-[#00482f] text-white px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs flex flex-wrap justify-between items-center gap-x-3 gap-y-1 border-b border-[#003824]">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#ddfa88] truncate">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">El-Hadar Engineering PLC</span>
                    </span>
                    <span className="hidden md:inline text-white/60">|</span>
                    <span className="hidden md:inline text-white/80">Employee Self-Service (ESS) Portal</span>
                </div>
                <div className="flex items-center min-w-0">
                    <span className="text-white/80 hidden sm:inline truncate max-w-[220px]">Active Session: {user.name}</span>
                </div>
            </header>

            <div className="flex flex-1">
                {/* Desktop Collapsible Sidebar */}
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
                        <Link href={route('portal.profile')} className="flex items-center gap-2.5 group overflow-hidden">
                            <ApplicationLogo className="w-9 h-9 shrink-0" />
                            {!sidebarCollapsed && (
                                <div className="whitespace-nowrap transition-opacity duration-300">
                                    <h1 className="text-sm font-bold text-black tracking-tight leading-tight">
                                        El-Hadar Engineering PLC
                                    </h1>
                                    <p className="text-[11px] font-semibold text-[#008254]">
                                        Employee Portal
                                    </p>
                                </div>
                            )}
                        </Link>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
                        {!sidebarCollapsed && (
                            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#64666a] whitespace-nowrap">
                                Self-Service Menu
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

                    {/* User Profile & Sign Out Button at Bottom of Sidebar */}
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
                                    className="w-10 h-10 flex items-center justify-center text-[#64666a] hover:text-[#de2828] hover:bg-white rounded-md border border-[#d8d9da] transition-colors cursor-pointer"
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
                                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#64666a] hover:text-[#de2828] hover:bg-white rounded-xs border border-[#d8d9da] transition-colors cursor-pointer shadow-xs"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Sign Out
                                </Link>
                            </>
                        )}
                    </div>
                </aside>

                {/* Mobile Drawer Overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden flex">
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <div className="relative flex flex-col w-72 max-w-xs bg-white h-full shadow-2xl z-10">
                            {/* Mobile Sidebar Header */}
                            <div className="p-4 border-b border-[#ebebec] flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <ApplicationLogo className="w-8 h-8 shrink-0" />
                                    <div>
                                        <h2 className="text-sm font-bold text-black leading-tight">
                                            El-Hadar Engineering PLC
                                        </h2>
                                        <p className="text-[10px] font-semibold text-[#008254]">
                                            Employee Portal
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-1.5 text-[#64666a] hover:text-black rounded-md cursor-pointer"
                                    aria-label="Close menu"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Mobile Nav Links */}
                            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                                <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#64666a]">
                                    Self-Service Menu
                                </div>
                                {navItems.map((item) => {
                                    const active = isCurrent(item.routeName);
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xs text-sm font-medium transition-colors ${
                                                active
                                                    ? 'bg-[#effcf8] text-[#008254] font-bold border-l-4 border-[#008254]'
                                                    : 'text-[#3d4045] hover:bg-[#f7f7f7] hover:text-black'
                                            }`}
                                        >
                                            <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#008254]' : 'text-[#64666a]'}`} />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Mobile User Profile & Sign Out */}
                            <div className="p-4 border-t border-[#ebebec] bg-[#f7f7f7]/60">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-full bg-[#008254] text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
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
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#64666a] hover:text-[#de2828] hover:bg-white rounded-xs border border-[#d8d9da] transition-colors cursor-pointer"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Sign Out
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Top Bar with Hamburger */}
                    <header className="min-h-16 bg-white border-b border-[#d8d9da] flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-8 py-2 shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <button
                                onClick={toggleSidebar}
                                className="p-2 -ml-1 sm:-ml-2 text-[#64666a] hover:text-black hover:bg-[#f7f7f7] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#008254]/30 cursor-pointer shrink-0"
                                aria-label="Toggle navigation menu"
                                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            >
                                <Menu className="w-5 h-5 transition-transform duration-200" />
                            </button>
                            <Link href={route('portal.profile')} className={`${!sidebarCollapsed ? 'lg:hidden' : ''} flex items-center gap-2 transition-opacity duration-300 min-w-0`}>
                                <ApplicationLogo className="w-8 h-8 shrink-0" />
                                <div className="min-w-0">
                                    <span className="font-bold text-black text-sm block leading-none truncate">El-Hadar Engineering PLC</span>
                                    <span className="text-[10px] font-semibold text-[#008254] block mt-0.5 truncate">Employee Portal</span>
                                </div>
                            </Link>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {user.role !== 'Employee' && (
                                <Link href={route('dashboard')}>
                                    <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5 bg-[#effcf8] hover:bg-[#d5f7ed] text-[#008254] border-[#008254]/30 rounded-xs">
                                        <LayoutDashboard className="w-3.5 h-3.5" />
                                        <span className="hidden md:inline">HR Admin Console</span>
                                    </Button>
                                </Link>
                            )}
                            <span className="text-xs text-[#64666a] hidden lg:inline truncate max-w-[180px]">Signed in as <strong className="text-black font-semibold">{user.name}</strong></span>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#64666a] hover:text-[#de2828] hover:bg-[#effcf8] border border-[#d8d9da] rounded-xs transition-colors cursor-pointer"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Link>
                        </div>
                    </header>

                    {/* Page Sub-Header / Hero banner (if title provided) */}
                    {title && (
                        <div className="bg-[#008254] text-white px-4 sm:px-6 py-5 sm:py-6 shadow-xs">
                            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
                                <div className="min-w-0">
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white break-words">
                                        {title}
                                    </h2>
                                    {subtitle && (
                                        <p className="mt-1 text-xs sm:text-sm text-[#e3faf2] font-light max-w-2xl">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Content Body */}
                    <main className="flex-1 px-3 py-6 lg:px-4 lg:py-8 max-w-7xl mx-auto w-full">
                        {children}
                    </main>

                    {/* Footer */}
                    <footer className="bg-white border-t border-[#ebebec] py-4 px-4 sm:px-6 lg:px-8 text-xs text-[#64666a] flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
                        <div className="min-w-0">
                            &copy; {new Date().getFullYear()} El-Hadar Engineering PLC. All rights reserved.
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-medium">Employee Self-Service (ESS) Portal</span>
                        </div>
                    </footer>
                </div>
            </div>

            {/* Global ESS Toaster for Flash & Notifications */}
            <Toaster richColors position="top-right" closeButton />
        </div>
    );
}
