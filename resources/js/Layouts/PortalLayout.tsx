import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, useState, useEffect } from 'react';
import { ShieldCheck, LogOut, Menu, X, UserCheck, LayoutDashboard } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { ThemeToggle } from '@/Components/ThemeToggle';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { formatEthPhone } from '@/lib/utils';
import { Toaster } from '@/Components/ui/sonner';
import { toast } from 'sonner';
import { PageProps } from '@/types';

interface Props { title?: string; subtitle?: string; }

export default function PortalLayout({ title, subtitle, children }: PropsWithChildren<Props>) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth.user;
    const displayPhone = formatEthPhone(user?.phone) || user?.phone || user?.email;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('hrms_portal_sidebar_collapsed') === 'true';
        return false;
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (flash?.warning) toast.warning(flash.warning);
        if (flash?.info) toast.info(flash.info);
    }, [flash]);

    const toggleSidebar = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(!sidebarOpen);
        else setSidebarCollapsed((prev) => { const next = !prev; if (typeof window !== 'undefined') localStorage.setItem('hrms_portal_sidebar_collapsed', String(next)); return next; });
    };

    const isCurrent = (name: string) => { try { return route().current(name); } catch { return false; } };
    const navItems = [
        { name: 'My Profile & Records', href: route('portal.profile'), routeName: 'portal.*', icon: UserCheck },
        ...(user.role !== 'Employee' ? [{ name: 'HR Admin Console', href: route('dashboard'), routeName: 'dashboard', icon: LayoutDashboard }] : []),
    ];

    const linkClass = (active: boolean, collapsed: boolean) => `flex items-center text-[13px] font-medium transition-all ${collapsed ? `justify-center w-11 h-10 mx-auto rounded-xl ${active ? 'bg-[#0066cc] text-white shadow-sm' : 'text-[#424245] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'}` : `gap-3 px-3 py-2.5 rounded-xl ${active ? 'bg-[#0066cc] text-white shadow-sm' : 'text-[#424245] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'}`}`;

    return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-background text-[#1d1d1f] dark:text-foreground font-sans flex flex-col">
            <header className="bg-[#1d1d1f] text-white px-3 sm:px-4 py-2 text-[11px] sm:text-xs flex flex-wrap justify-between items-center gap-x-3 gap-y-1 border-b border-black/20">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="inline-flex items-center gap-1.5 font-medium text-white/90 truncate"><ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#2997ff]" /> <span className="truncate">El-Hadar Engineering PLC</span></span>
                    <span className="hidden md:inline text-white/30">|</span>
                    <span className="hidden md:inline text-white/70">Employee Self-Service (ESS) Portal</span>
                </div>
                <span className="text-white/60 hidden sm:inline truncate max-w-[220px]">Active Session: {user.name}</span>
            </header>

            <div className="flex flex-1">
                <aside className={`hidden lg:flex flex-col bg-white/95 dark:bg-card/95 backdrop-blur border-r border-[#d2d2d7] dark:border-border shrink-0 transition-all duration-300 ease-in-out select-none ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
                    <div className={`border-b border-[#e8e8ed] flex items-center transition-all duration-300 ${sidebarCollapsed ? 'p-3.5 justify-center' : 'p-5 justify-between'}`}>
                        <Link href={route('portal.profile')} className="flex items-center gap-2.5 group overflow-hidden">
                            <ApplicationLogo className="w-9 h-9 shrink-0" />
                            {!sidebarCollapsed && (<div className="whitespace-nowrap"><h1 className="text-sm font-semibold text-[#1d1d1f] tracking-tight leading-tight">El-Hadar Engineering PLC</h1><p className="text-[11px] font-medium text-[#0066cc]">Employee Portal</p></div>)}
                        </Link>
                    </div>
                    <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
                        {!sidebarCollapsed && <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6e6e73] whitespace-nowrap">Self-Service Menu</div>}
                        {navItems.map((item) => { const active = isCurrent(item.routeName); const Icon = item.icon; return (
                            <Link key={item.name} href={item.href} title={sidebarCollapsed ? item.name : undefined} className={linkClass(active, sidebarCollapsed)}>
                                <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-[#86868b]'}`} />{!sidebarCollapsed && <span className="truncate whitespace-nowrap">{item.name}</span>}
                            </Link>); })}
                    </nav>
                    <div className={`border-t border-[#e8e8ed] bg-[#f5f5f7]/70 transition-all duration-300 ${sidebarCollapsed ? 'p-3 flex flex-col items-center gap-3' : 'p-4'}`}>
                        {sidebarCollapsed ? (<>
                            <div className="w-9 h-9 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-xs font-semibold uppercase shrink-0" title={`${user.name} (${displayPhone})`}>{user.name.charAt(0)}</div>
                            <Link href={route('logout')} method="post" as="button" title="Sign Out" className="w-10 h-10 flex items-center justify-center text-[#6e6e73] hover:text-[#ff3b30] hover:bg-white rounded-xl border border-[#d2d2d7] transition-colors cursor-pointer"><LogOut className="w-4 h-4" /></Link>
                        </>) : (<>
                            <div className="flex items-center gap-2.5 mb-3 overflow-hidden"><div className="w-8 h-8 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-xs font-semibold uppercase shrink-0">{user.name.charAt(0)}</div><div className="overflow-hidden"><p className="text-sm font-semibold text-[#1d1d1f] truncate leading-none">{user.name}</p><p className="text-xs text-[#6e6e73] truncate mt-0.5">{displayPhone}</p></div></div>
                            <Link href={route('logout')} method="post" as="button" className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#424245] hover:text-[#ff3b30] hover:bg-white rounded-xl border border-[#d2d2d7] transition-colors cursor-pointer"><LogOut className="w-3.5 h-3.5" /> Sign Out</Link>
                        </>)}
                    </div>
                </aside>

                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden flex">
                        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
                        <div className="relative flex flex-col w-[280px] max-w-xs bg-white/95 backdrop-blur-xl h-full shadow-apple z-10 border-r border-[#d2d2d7]">
                            <div className="p-4 border-b border-[#e8e8ed] flex items-center justify-between">
                                <div className="flex items-center gap-2.5"><ApplicationLogo className="w-8 h-8 shrink-0" /><div><h2 className="text-sm font-semibold text-[#1d1d1f] leading-tight">El-Hadar Engineering PLC</h2><p className="text-[10px] font-medium text-[#0066cc]">Employee Portal</p></div></div>
                                <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-[#6e6e73] hover:text-[#1d1d1f] rounded-lg cursor-pointer" aria-label="Close menu"><X className="w-5 h-5" /></button>
                            </div>
                            <nav className="flex-1 p-3 space-y-1 overflow-y-auto"><div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6e6e73]">Self-Service Menu</div>
                                {navItems.map((item) => { const active = isCurrent(item.routeName); const Icon = item.icon; return (
                                    <Link key={item.name} href={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${active ? 'bg-[#0066cc] text-white' : 'text-[#424245] hover:bg-[#f5f5f7]'}`}><Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-[#86868b]'}`} /><span>{item.name}</span></Link>); })}
                            </nav>
                            <div className="p-4 border-t border-[#e8e8ed] bg-[#f5f5f7]/60"><div className="flex items-center gap-3 mb-3"><div className="w-9 h-9 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-xs font-semibold uppercase shrink-0">{user.name.charAt(0)}</div><div className="overflow-hidden"><p className="text-sm font-semibold text-[#1d1d1f] truncate leading-none">{user.name}</p><p className="text-xs text-[#6e6e73] truncate mt-0.5">{displayPhone}</p></div></div><Link href={route('logout')} method="post" as="button" className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#424245] hover:text-[#ff3b30] hover:bg-white rounded-xl border border-[#d2d2d7] transition-colors cursor-pointer"><LogOut className="w-3.5 h-3.5" /> Sign Out</Link></div>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col min-w-0">
                    <header className="min-h-14 bg-white/80 dark:bg-card/75 backdrop-blur-xl border-b border-[#d2d2d7]/80 dark:border-border/80 flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-8 py-2 shrink-0 sticky top-0 z-20">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <button onClick={toggleSidebar} className="p-2 -ml-1 sm:-ml-2 text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 cursor-pointer shrink-0" aria-label="Toggle navigation menu"><Menu className="w-5 h-5" /></button>
                            <Link href={route('portal.profile')} className={`${!sidebarCollapsed ? 'lg:hidden' : ''} flex items-center gap-2 min-w-0`}><ApplicationLogo className="w-8 h-8 shrink-0" /><div className="min-w-0"><span className="font-semibold text-[#1d1d1f] text-sm block leading-none truncate">El-Hadar Engineering PLC</span><span className="text-[10px] font-medium text-[#0066cc] block mt-0.5 truncate">Employee Portal</span></div></Link>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <ThemeToggle className="mr-0.5" />
                            {user.role !== 'Employee' && <Link href={route('dashboard')}><Button size="sm" variant="outline" className="text-xs font-medium gap-1.5 rounded-full border-[#d2d2d7]"><LayoutDashboard className="w-3.5 h-3.5 text-[#0066cc]" /><span className="hidden md:inline">HR Admin Console</span></Button></Link>}
                            <span className="text-xs text-[#6e6e73] hidden lg:inline truncate max-w-[180px]">Signed in as <strong className="text-[#1d1d1f] font-semibold">{user.name}</strong></span>
                            <Link href={route('logout')} method="post" as="button" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#424245] hover:bg-[#f5f5f7] border border-[#d2d2d7] rounded-full transition-colors cursor-pointer"><LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sign Out</span></Link>
                        </div>
                    </header>

                    {title && (
                        <div className="bg-white dark:bg-card border-b border-[#e8e8ed] dark:border-border px-4 sm:px-6 py-6 sm:py-8"><div className="max-w-7xl mx-auto min-w-0"><h2 className="text-[28px] sm:text-[34px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-foreground break-words leading-[1.1]">{title}</h2>{subtitle && <p className="mt-2 text-[15px] text-[#6e6e73] dark:text-muted-foreground font-normal max-w-2xl leading-relaxed">{subtitle}</p>}</div></div>
                    )}
                    <main className="flex-1 px-3 py-6 lg:px-6 lg:py-8 max-w-7xl mx-auto w-full">{children}</main>
                    <footer className="bg-white/70 dark:bg-card/50 border-t border-[#e8e8ed] dark:border-border py-4 px-4 sm:px-6 lg:px-8 text-xs text-[#86868b] dark:text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left"><div className="min-w-0">&copy; {new Date().getFullYear()} El-Hadar Engineering PLC. All rights reserved.</div><span className="font-medium text-[#6e6e73]">Employee Self-Service (ESS) Portal</span></footer>
                </div>
            </div>
            <Toaster richColors position="top-right" closeButton />
        </div>
    );
}


