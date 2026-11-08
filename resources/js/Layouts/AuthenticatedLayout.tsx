import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import {
    Menu,
    X,
    UserPlus,
    Compass,
    Megaphone,
    UserCheck,
    CalendarCheck,
    LogOut,
    Trash2,
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { ThemeToggle } from '@/Components/ThemeToggle';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { formatEthPhone } from '@/lib/utils';
import { Toaster } from '@/Components/ui/sonner';
import { toast } from 'sonner';
import NotificationBell from '@/Components/NotificationBell';
import WebPushBanner from '@/Components/WebPushBanner';
import { PageProps } from '@/types';
import { getNavItems, NAV_CATEGORIES, NavCategoryConfig, NavItemConfig } from '@/Components/Navigation/navConfig';
import SystemSettingsSidebar from '@/Components/Navigation/SystemSettingsSidebar';
import DarkThemeSelector from '@/Components/DarkThemeSelector';

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

    // Flash notifications handler: solid red + white text for deletions, single notification
    useEffect(() => {
        if (flash?.success) {
            const isDeletion =
                typeof flash.success === 'string' &&
                /delet|remov|destro/i.test(flash.success);

            if (isDeletion) {
                toast(flash.success, {
                    className:
                        '!bg-[#dc2626] !text-white !border-red-700 !opacity-100 shadow-xl font-medium',
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
    const isCurrent = (name: string) => {
        try {
            return route().current(name);
        } catch {
            return false;
        }
    };

    const navItems = getNavItems();

    const employeeCategories: NavCategoryConfig[] = [
        {
            id: 'personal',
            label: 'Self-Service Portal',
            shortLabel: 'Portal',
            subtitle: 'Personal employee records & notice board',
        },
    ];

    const employeeNavItems: NavItemConfig[] = [
        {
            id: 'portal',
            name: 'My Self-Service',
            shortName: 'Self-Service',
            href: route('portal.profile'),
            routeName: 'portal.profile',
            icon: UserCheck,
            category: 'personal',
            description: 'Personal leave balances, salary slips & profile',
            activeBg: 'bg-sky-600',
            squircleColor: {
                bg: 'bg-sky-600 text-white',
                text: 'text-sky-600',
            },
        },
        {
            id: 'portal-leave',
            name: 'Request Leave',
            shortName: 'Leave Request',
            href: route('portal.leave.index'),
            routeName: 'portal.leave.*',
            icon: CalendarCheck,
            category: 'personal',
            description: 'Apply for annual, sick or statutory leave and track status',
            activeBg: 'bg-emerald-600',
            squircleColor: {
                bg: 'bg-emerald-600 text-white',
                text: 'text-emerald-600',
            },
        },
        {
            id: 'announcements',
            name: 'Announcements',
            shortName: 'Notice Board',
            href: route('announcements.index'),
            routeName: 'announcements.*',
            icon: Megaphone,
            category: 'personal',
            description: 'Company notice board, circulars & directives',
            activeBg: 'bg-amber-500',
            squircleColor: {
                bg: 'bg-amber-500 text-white',
                text: 'text-amber-500',
            },
        },
    ];

    const currentCategories = isEmployee ? employeeCategories : NAV_CATEGORIES;
    const currentNavItems = isEmployee ? employeeNavItems : navItems;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
            <div className="flex flex-1">
                {/* Desktop macOS System Settings Sidebar for HR/Admin & Employee */}
                <SystemSettingsSidebar
                    user={user}
                    displayPhone={displayPhone}
                    isCurrent={isCurrent}
                    sidebarCollapsed={sidebarCollapsed}
                    items={currentNavItems}
                    categories={currentCategories}
                    brandHref={isEmployee ? route('portal.profile') : route('dashboard')}
                    brandSubtitle={isEmployee ? 'Employee Self-Service' : 'HR & Payroll Pro'}
                />

                {/* Main Content Viewport */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <header className="h-16 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between gap-3 px-3 sm:px-4 lg:px-8 shrink-0 sticky top-0 z-20">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 h-full">
                            <button
                                onClick={toggleSidebar}
                                className="p-2 -ml-1 sm:-ml-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer shrink-0"
                                aria-label="Toggle navigation menu"
                                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            {/* Page Title */}
                            {title && (
                                <div className="flex flex-col justify-center min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate leading-none">
                                        {title}
                                    </h1>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                            <NotificationBell />
                            <ThemeToggle className="mr-0.5" />
                            {!isEmployee ? (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            if (typeof window !== 'undefined') {
                                                const path = window.location.pathname;
                                                if (path.match(/\/employees\/\d+/))
                                                    window.dispatchEvent(
                                                        new CustomEvent('open-employee-detail-tour')
                                                    );
                                                else if (
                                                    path.includes('/employees') &&
                                                    !path.includes('/create')
                                                )
                                                    window.dispatchEvent(
                                                        new CustomEvent('open-staff-directory-tour')
                                                    );
                                                else if (path.includes('/leave'))
                                                    window.dispatchEvent(
                                                        new CustomEvent('open-leave-ledger-tour')
                                                    );
                                                else if (path.includes('/portal'))
                                                    window.dispatchEvent(
                                                        new CustomEvent('open-portal-tour')
                                                    );
                                                else if (
                                                    path.includes('/dashboard') ||
                                                    path === '/'
                                                )
                                                    window.dispatchEvent(
                                                        new CustomEvent('open-dashboard-tour')
                                                    );
                                                else
                                                    toast.info(
                                                        'A guided tour is not available for this page yet.'
                                                    );
                                            }
                                        }}
                                        className="hidden md:inline-flex gap-1.5 text-xs font-medium rounded-full border-border"
                                    >
                                        <Compass className="w-3.5 h-3.5 text-primary" />
                                        <span>Tour</span>
                                    </Button>
                                    <Link href={route('employees.create')}>
                                        <Button
                                            size="sm"
                                            className="hidden md:inline-flex gap-1.5 text-xs font-medium rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            <span>Onboard Staff</span>
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <span className="text-xs text-muted-foreground hidden md:inline max-w-[160px] truncate">
                                        Welcome, {user.name}
                                    </span>
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent border border-border rounded-full transition-colors"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Sign Out</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Mobile Slideout Drawer */}
                    {sidebarOpen && (
                        <div className="lg:hidden fixed inset-0 z-50 flex">
                            <div
                                className="fixed inset-0 bg-foreground/20 backdrop-blur-[2px]"
                                onClick={() => setSidebarOpen(false)}
                            />
                            <div className="relative w-[300px] bg-background backdrop-blur-xl flex flex-col h-full border-r border-border z-10 p-4 shadow-apple">
                                <div className="flex items-center justify-between pb-4 border-b border-border">
                                    <Link
                                        href={isEmployee ? route('portal.profile') : route('dashboard')}
                                        className="flex items-center gap-2.5"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <ApplicationLogo className="w-8 h-8 shrink-0" />
                                        <div>
                                            <span className="font-semibold text-foreground text-sm block leading-tight">
                                                El-Hadar Engineering
                                            </span>
                                            <span className="text-[10px] font-medium text-primary block mt-0.5">
                                                {isEmployee ? 'Employee Self-Service' : 'HR & Payroll Pro'}
                                            </span>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <nav className="mt-4 space-y-4 flex-1 overflow-y-auto no-scrollbar">
                                    {currentCategories.map((cat) => {
                                        const catItems = currentNavItems.filter(
                                            (i) => i.category === cat.id
                                        );
                                        return (
                                            <div key={cat.id} className="space-y-1">
                                                <div className="px-2 text-xs font-semibold text-foreground/80 dark:text-muted-foreground tracking-tight">
                                                    {cat.label}
                                                </div>
                                                {catItems.map((item) => {
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
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </nav>

                                <div className="pt-4 border-t border-border">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold uppercase shrink-0">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-semibold text-foreground truncate leading-none">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                {displayPhone}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-destructive bg-accent rounded-xl"
                                    >
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Slim Toolbar only if custom header element is provided */}
                    {header && (
                        <div className="bg-background border-b border-border px-4 sm:px-6 lg:px-8 py-3">
                            <div className="max-w-7xl mx-auto min-w-0">{header}</div>
                        </div>
                    )}

                    {/* Main Children */}
                    <main className="flex-1 px-3 py-4 lg:px-6 lg:py-6 w-full max-w-7xl mx-auto">
                        <WebPushBanner />
                        {children}
                    </main>

                    {/* Footer */}
                    <footer className="bg-background/50 border-t border-border py-4 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
                        <div className="min-w-0">
                            &copy; {new Date().getFullYear()} El-Hadar Engineering PLC. All rights
                            reserved.
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-medium text-muted-foreground">
                                Employee Records, Leave &amp; Payroll Pro
                            </span>
                        </div>
                    </footer>
                </div>
            </div>

            {/* Floating Dark Theme Color Tone Selector (Bottom Right) */}
            <DarkThemeSelector />

            {/* Toaster: closeButton removed, deletion styled with full opacity solid red + white text */}
            <Toaster position="top-right" offset={16} />
        </div>
    );
}
