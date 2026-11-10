import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, useState, useEffect } from 'react';
import { ShieldCheck, LogOut, Menu, X, UserCheck, LayoutDashboard, Megaphone, ChevronRight, Trash2, CalendarCheck, MessageSquare } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { ThemeToggle } from '@/Components/ThemeToggle';
import ApplicationLogo from '@/Components/ApplicationLogo';
import EmployeeAvatar from '@/Components/EmployeeAvatar';
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
        if (flash?.success) {
            const isDeletion = typeof flash.success === 'string' && /delet|remov/i.test(flash.success);
            if (isDeletion) {
                toast(flash.success, {
                    className: '!bg-[#dc2626] !text-white !border-red-700 !opacity-100 shadow-xl font-medium',
                    style: {
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        opacity: 1,
                        border: '1px solid #b91c1c',
                    },
                    icon: <Trash2 className="h-4 w-4 text-white shrink-0" strokeWidth={2.2} />,
                });
            } else {
                toast.success(flash.success);
            }
        }
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
        {
            id: 'portal',
            name: 'My Self-Service',
            href: route('portal.profile'),
            routeName: 'portal.profile',
            icon: UserCheck,
            activeBg: 'bg-sky-600',
            squircle: 'bg-sky-600 text-white',
        },
        {
            id: 'leave',
            name: 'Request Leave',
            href: route('portal.leave.index'),
            routeName: 'portal.leave.*',
            icon: CalendarCheck,
            activeBg: 'bg-emerald-600',
            squircle: 'bg-emerald-600 text-white',
        },
        ...(user.can_approve_leave
            ? [
                  {
                      id: 'leave-requests',
                      name: 'Leave Requests',
                      href: route('portal.leave-requests.index'),
                      routeName: 'portal.leave-requests.*',
                      icon: CalendarCheck,
                      activeBg: 'bg-[#0066cc]',
                      squircle: 'bg-[#0066cc] text-white',
                      badge: user.pending_leave_approvals_count,
                  },
              ]
            : []),
        {
            id: 'announcements',
            name: 'Announcements',
            href: route('announcements.index'),
            routeName: 'announcements.*',
            icon: Megaphone,
            activeBg: 'bg-amber-500',
            squircle: 'bg-amber-500 text-white',
        },
        {
            id: 'chat',
            name: 'Department Chat',
            href: route('chat.index'),
            routeName: 'chat.*',
            icon: MessageSquare,
            activeBg: 'bg-[#0066cc]',
            squircle: 'bg-[#0066cc] text-white',
        },
        ...(user.role !== 'Employee'
            ? [
                  {
                      id: 'dashboard',
                      name: 'HR Admin Console',
                      href: route('dashboard'),
                      routeName: 'dashboard',
                      icon: LayoutDashboard,
                      activeBg: 'bg-[#0066cc]',
                      squircle: 'bg-[#0066cc] text-white',
                  },
              ]
            : []),
    ];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
            <header className="bg-[#1d1d1f] text-white px-3 sm:px-4 py-2 text-[11px] sm:text-xs flex flex-wrap justify-between items-center gap-x-3 gap-y-1 border-b border-black/20">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="inline-flex items-center gap-1.5 font-medium text-white/90 truncate"><ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#2997ff]" /> <span className="truncate">El-Hadar Engineering PLC</span></span>
                    <span className="hidden md:inline text-white/30">|</span>
                    <span className="hidden md:inline text-white/70">Employee Self-Service (ESS) Portal</span>
                </div>
                <span className="text-white/60 hidden sm:inline truncate max-w-[220px]">Active Session: {user.name}</span>
            </header>

            <div className="flex flex-1">
                {/* Desktop macOS System Settings Sidebar for Employee */}
                <aside
                    className={`hidden lg:flex flex-col bg-muted/20 dark:bg-sidebar border-r border-border shrink-0 transition-all duration-300 select-none ${
                        sidebarCollapsed ? 'w-20' : 'w-72'
                    }`}
                >
                    <div
                        className={`border-b border-border/70 flex items-center transition-all ${
                            sidebarCollapsed ? 'p-3.5 justify-center' : 'p-4 justify-between'
                        }`}
                    >
                        <Link href={route('portal.profile')} className="flex items-center gap-2.5 group overflow-hidden">
                            <ApplicationLogo className="w-8 h-8 shrink-0" />
                            {!sidebarCollapsed && (
                                <div className="overflow-hidden min-w-0">
                                    <h2 className="text-sm font-bold text-foreground tracking-tight leading-tight truncate">
                                        El-Hadar Engineering
                                    </h2>
                                    <p className="text-[11px] font-medium text-primary mt-0.5 truncate">
                                        Employee Self-Service
                                    </p>
                                </div>
                            )}
                        </Link>
                    </div>

                    <nav className="flex-1 p-3 space-y-4 overflow-y-auto no-scrollbar">
                        <div className="space-y-1.5">
                            {!sidebarCollapsed && (
                                <div className="px-2.5 pb-0.5 pt-1 text-[13px] font-semibold text-foreground/80 dark:text-muted-foreground tracking-tight select-none">
                                    Self-Service Portal
                                </div>
                            )}

                            <div
                                className={`bg-card/85 dark:bg-card backdrop-blur-md rounded-2xl border border-border/70 divide-y divide-border/50 overflow-hidden shadow-xs ${
                                    sidebarCollapsed ? 'p-1' : 'p-0.5'
                                }`}
                            >
                                {navItems.map((item) => {
                                    const active = isCurrent(item.routeName);
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            title={sidebarCollapsed ? item.name : undefined}
                                            className={`group flex items-center transition-all duration-150 ${
                                                sidebarCollapsed
                                                    ? 'justify-center w-11 h-10 mx-auto rounded-xl my-0.5'
                                                    : 'px-2.5 py-2 rounded-xl'
                                            } ${
                                                active
                                                    ? `${item.activeBg} !text-white font-semibold shadow-xs`
                                                    : 'hover:bg-black/5 dark:hover:bg-white/5 text-foreground'
                                            }`}
                                        >
                                            <div
                                                className={`relative w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 ${
                                                    active
                                                        ? 'bg-white/20 text-white ring-1 ring-white/30'
                                                        : item.squircle
                                                }`}
                                            >
                                                <Icon className="w-4 h-4 text-white" strokeWidth={2.2} />
                                                {sidebarCollapsed && typeof item.badge === 'number' && item.badge > 0 && (
                                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#0066cc] ring-2 ring-background" />
                                                )}
                                            </div>

                                            {!sidebarCollapsed && (
                                                <div className="flex-1 flex items-center justify-between min-w-0 ml-2.5">
                                                    <span className={`text-[13px] truncate ${active ? '!text-white font-semibold' : 'text-foreground'}`}>
                                                        {item.name}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {typeof item.badge === 'number' && item.badge > 0 && (
                                                            <span
                                                                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full leading-none shadow-xs ${
                                                                    active
                                                                        ? 'bg-white text-[#0066cc]'
                                                                        : 'bg-[#0066cc] text-white'
                                                                }`}
                                                            >
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                        <ChevronRight
                                                            className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                                                                active
                                                                    ? '!text-white'
                                                                    : 'text-muted-foreground/40'
                                                            }`}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </nav>

                    <div className="p-3 border-t border-border/70 bg-card/50">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <EmployeeAvatar name={user.name} src={(user as any).profile_photo_url} size="sm" />
                                {!sidebarCollapsed && (
                                    <div className="overflow-hidden min-w-0">
                                        <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                                        <p className="text-[11px] text-muted-foreground truncate">{displayPhone}</p>
                                    </div>
                                )}
                            </div>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                title="Sign Out"
                                className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </aside>

                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden flex">
                        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
                        <div className="relative flex flex-col w-[280px] max-w-xs bg-background/95 backdrop-blur-xl h-full shadow-apple z-10 border-r border-border p-4">
                            <div className="pb-4 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <ApplicationLogo className="w-8 h-8 shrink-0" />
                                    <div>
                                        <h2 className="text-sm font-semibold text-foreground leading-tight">El-Hadar Engineering</h2>
                                        <p className="text-[10px] font-medium text-primary">Employee Self-Service</p>
                                    </div>
                                </div>
                                <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer" aria-label="Close menu"><X className="w-5 h-5" /></button>
                            </div>
                            <nav className="flex-1 mt-4 space-y-1 overflow-y-auto">
                                <div className="px-2 text-xs font-semibold text-foreground/80 dark:text-muted-foreground tracking-tight pb-1">Self-Service Portal</div>
                                {navItems.map((item) => {
                                    const active = isCurrent(item.routeName);
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl ${
                                                active
                                                    ? `${item.activeBg} !text-white font-semibold shadow-xs`
                                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className={`w-4 h-4 ${active ? '!text-white' : ''}`} />
                                                <span className={active ? '!text-white font-semibold' : ''}>{item.name}</span>
                                            </div>
                                            {typeof item.badge === 'number' && item.badge > 0 && (
                                                <span
                                                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full leading-none shadow-xs ${
                                                        active
                                                            ? 'bg-white text-[#0066cc]'
                                                            : 'bg-[#0066cc] text-white'
                                                    }`}
                                                >
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="pt-4 border-t border-border">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <EmployeeAvatar name={user.name} src={(user as any).profile_photo_url} size="sm" />
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-semibold text-foreground truncate leading-none">{user.name}</p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{displayPhone}</p>
                                    </div>
                                </div>
                                <Link href={route('logout')} method="post" as="button" className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-destructive bg-accent rounded-xl hover:bg-destructive/10 transition-colors cursor-pointer"><LogOut className="w-3.5 h-3.5" /> Sign Out</Link>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col min-w-0">
                    <header className="min-h-14 bg-background/80 backdrop-blur-xl border-b border-border/70 flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-8 py-2 shrink-0 sticky top-0 z-20">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <button onClick={toggleSidebar} className="p-2 -ml-1 sm:-ml-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer shrink-0" aria-label="Toggle navigation menu"><Menu className="w-5 h-5" /></button>
                            <Link href={route('portal.profile')} className={`${!sidebarCollapsed ? 'lg:hidden' : ''} flex items-center gap-2 min-w-0`}><ApplicationLogo className="w-8 h-8 shrink-0" /><div className="min-w-0"><span className="font-semibold text-foreground text-sm block leading-none truncate">El-Hadar Engineering</span><span className="text-[10px] font-medium text-primary block mt-0.5 truncate">Employee Portal</span></div></Link>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <ThemeToggle className="mr-0.5" />
                            {user.role !== 'Employee' && <Link href={route('dashboard')}><Button size="sm" variant="outline" className="text-xs font-medium gap-1.5 rounded-full border-border"><LayoutDashboard className="w-3.5 h-3.5 text-primary" /><span className="hidden md:inline">HR Admin Console</span></Button></Link>}
                            <span className="text-xs text-muted-foreground hidden lg:inline truncate max-w-[180px]">Signed in as <strong className="text-foreground font-semibold">{user.name}</strong></span>
                            <Link href={route('logout')} method="post" as="button" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent border border-border rounded-full transition-colors cursor-pointer"><LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sign Out</span></Link>
                        </div>
                    </header>

                    {title && (
                        <div className="bg-card border-b border-border px-4 sm:px-6 py-6 sm:py-8"><div className="max-w-7xl mx-auto min-w-0"><h2 className="text-[28px] sm:text-[34px] font-semibold tracking-[-0.02em] text-foreground break-words leading-[1.1]">{title}</h2></div></div>
                    )}
                    <main className="flex-1 px-3 py-6 lg:px-6 lg:py-8 max-w-7xl mx-auto w-full">{children}</main>
                    <footer className="bg-card/50 border-t border-border py-4 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left"><div className="min-w-0">&copy; {new Date().getFullYear()} El-Hadar Engineering PLC. All rights reserved.</div><span className="font-medium text-muted-foreground">Employee Self-Service (ESS) Portal</span></footer>
                </div>
            </div>

            <Toaster position="top-right" offset={16} />
        </div>
    );
}


