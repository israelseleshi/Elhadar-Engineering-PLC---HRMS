import { Link } from '@inertiajs/react';
import { ChevronRight, LogOut } from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { NavCategoryConfig, NavItemConfig } from './navConfig';

interface Props {
    user: { name: string; email?: string; role?: string };
    displayPhone?: string;
    isCurrent: (name: string) => boolean;
    sidebarCollapsed: boolean;
    items: NavItemConfig[];
    categories: NavCategoryConfig[];
    brandHref?: string;
    brandSubtitle?: string;
}

export default function SystemSettingsSidebar({
    user,
    displayPhone,
    isCurrent,
    sidebarCollapsed,
    items,
    categories,
    brandHref,
    brandSubtitle,
}: Props) {
    const isEmployee = user.role === 'Employee';
    const resolvedBrandHref = brandHref || (isEmployee ? route('portal.profile') : route('dashboard'));
    const resolvedBrandSubtitle = brandSubtitle || (isEmployee ? 'Employee Self-Service' : 'HR & Payroll Pro');

    return (
        <aside
            className={`hidden lg:flex flex-col bg-muted/20 dark:bg-sidebar border-r border-border shrink-0 transition-all duration-300 select-none ${
                sidebarCollapsed ? 'w-20' : 'w-72'
            }`}
        >
            {/* Header Brand */}
            <div
                className={`border-b border-border/70 flex items-center transition-all ${
                    sidebarCollapsed ? 'p-3.5 justify-center' : 'p-4 justify-between'
                }`}
            >
                <Link href={resolvedBrandHref} className="flex items-center gap-2.5 group overflow-hidden">
                    <ApplicationLogo className="w-8 h-8 shrink-0" />
                    {!sidebarCollapsed && (
                        <div className="overflow-hidden min-w-0">
                            <h2 className="text-sm font-bold text-foreground tracking-tight leading-tight truncate">
                                El-Hadar Engineering
                            </h2>
                            <p className="text-[11px] font-medium text-primary mt-0.5 truncate">
                                {resolvedBrandSubtitle}
                            </p>
                        </div>
                    )}
                </Link>
            </div>

            {/* Apple Settings Inset Grouped Navigation */}
            <nav className="flex-1 p-3 space-y-4 overflow-y-auto no-scrollbar">
                {categories.map((cat) => {
                    const catItems = items.filter((i) => i.category === cat.id);
                    if (catItems.length === 0) return null;

                    return (
                        <div key={cat.id} className="space-y-1.5">
                            {/* Section Title (enlarged for clearer prominence) */}
                            {!sidebarCollapsed && (
                                <div className="px-2.5 pb-0.5 pt-1 text-[13px] font-semibold text-foreground/80 dark:text-muted-foreground tracking-tight select-none">
                                    {cat.label}
                                </div>
                            )}

                            {/* Inset Grouped Card */}
                            <div
                                className={`bg-card/85 dark:bg-card backdrop-blur-md rounded-2xl border border-border/70 divide-y divide-border/50 overflow-hidden shadow-xs ${
                                    sidebarCollapsed ? 'p-1' : 'p-0.5'
                                }`}
                            >
                                {catItems.map((item) => {
                                    const active = isCurrent(item.routeName);
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            title={sidebarCollapsed ? `${item.name}: ${item.description}` : undefined}
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
                                            {/* Apple Squircle Icon Container */}
                                            <div
                                                className={`relative w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 ${
                                                    active
                                                        ? 'bg-white/20 text-white ring-1 ring-white/30'
                                                        : item.squircleColor.bg
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
                    );
                })}
            </nav>

            {/* Profile Footer */}
            <div className="p-3 border-t border-border/70 bg-card/50">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold uppercase shrink-0">
                            {user.name.charAt(0)}
                        </div>
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
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </aside>
    );
}
