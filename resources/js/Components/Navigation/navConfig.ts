import { ComponentType } from 'react';
import {
    LayoutDashboard,
    Megaphone,
    UserPlus,
    Users,
    CalendarDays,
    TrendingUp,
    GraduationCap,
    UserMinus,
    Sliders,
    Activity,
    UserCheck,
    CalendarCheck,
    MessageSquare,
    LucideProps,
} from 'lucide-react';

export type NavCategoryId = 'overview' | 'workforce' | 'governance' | 'personal';

export interface NavItemConfig {
    id: string;
    name: string;
    shortName: string;
    href: string;
    routeName: string;
    icon: ComponentType<LucideProps>;
    category: NavCategoryId;
    description: string;
    activeBg: string;
    squircleColor: {
        bg: string;
        text: string;
    };
    badge?: number;
}

export interface NavCategoryConfig {
    id: NavCategoryId;
    label: string;
    shortLabel: string;
    subtitle: string;
}

export const NAV_CATEGORIES: NavCategoryConfig[] = [
    {
        id: 'overview',
        label: 'Overview & Comms',
        shortLabel: 'Overview',
        subtitle: 'Executive pulse & company circulars',
    },
    {
        id: 'workforce',
        label: 'Workforce & Talent',
        shortLabel: 'Workforce',
        subtitle: 'End-to-end employee lifecycle',
    },
    {
        id: 'governance',
        label: 'Governance & Audit',
        shortLabel: 'Governance',
        subtitle: 'Statutory compliance & forensic logs',
    },
    {
        id: 'personal',
        label: 'Personal Workspace',
        shortLabel: 'My Space',
        subtitle: 'Self-service for administrator',
    },
];

export const getNavItems = (): NavItemConfig[] => {
    return [
        // Category 1: Executive Overview & Comms
        {
            id: 'dashboard',
            name: 'Dashboard',
            shortName: 'Dashboard',
            href: route('dashboard'),
            routeName: 'dashboard',
            icon: LayoutDashboard,
            category: 'overview',
            description: 'Workforce KPIs, headcount & turnover pulse',
            activeBg: 'bg-[#0066cc]',
            squircleColor: {
                bg: 'bg-[#0066cc] text-white',
                text: 'text-[#0066cc]',
            },
        },
        {
            id: 'announcements',
            name: 'Announcements',
            shortName: 'Notice Board',
            href: route('announcements.index'),
            routeName: 'announcements.*',
            icon: Megaphone,
            category: 'overview',
            description: 'Company notice board, circulars & directives',
            activeBg: 'bg-amber-500',
            squircleColor: {
                bg: 'bg-amber-500 text-white',
                text: 'text-amber-500',
            },
        },
        {
            id: 'chat',
            name: 'Department Chat',
            shortName: 'Team Chat',
            href: route('chat.index'),
            routeName: 'chat.*',
            icon: MessageSquare,
            category: 'overview',
            description: 'Intra-department workspace, secure file sharing & vault',
            activeBg: 'bg-[#0066cc]',
            squircleColor: {
                bg: 'bg-[#0066cc] text-white',
                text: 'text-[#0066cc]',
            },
        },

        // Category 2: Workforce Lifecycle (Natural chronological order: Onboard -> Roster -> Leave -> Grow -> Train -> Exit)
        {
            id: 'new-employees',
            name: 'New Employees',
            shortName: 'Onboarding',
            href: route('new-employees.index'),
            routeName: 'new-employees.*',
            icon: UserPlus,
            category: 'workforce',
            description: 'New recruits & pending documentation onboarding',
            activeBg: 'bg-emerald-600',
            squircleColor: {
                bg: 'bg-emerald-600 text-white',
                text: 'text-emerald-600',
            },
        },
        {
            id: 'employees',
            name: 'Staff Directory',
            shortName: 'Directory',
            href: route('employees.index'),
            routeName: 'employees.*',
            icon: Users,
            category: 'workforce',
            description: 'Active personnel directory & master files',
            activeBg: 'bg-[#0071e3]',
            squircleColor: {
                bg: 'bg-[#0071e3] text-white',
                text: 'text-[#0071e3]',
            },
        },
        {
            id: 'leave',
            name: 'Leave Ledger',
            shortName: 'Leave',
            href: route('leave.index'),
            routeName: 'leave.*',
            icon: CalendarDays,
            category: 'workforce',
            description: 'Annual, sick & maternity leave approvals',
            activeBg: 'bg-teal-600',
            squircleColor: {
                bg: 'bg-teal-600 text-white',
                text: 'text-teal-600',
            },
        },
        {
            id: 'promotions',
            name: 'Promotions Ledger',
            shortName: 'Promotions',
            href: route('promotions.index'),
            routeName: 'promotions.*',
            icon: TrendingUp,
            category: 'workforce',
            description: 'Career progression, step increments & grade changes',
            activeBg: 'bg-indigo-600',
            squircleColor: {
                bg: 'bg-indigo-600 text-white',
                text: 'text-indigo-600',
            },
        },
        {
            id: 'training',
            name: 'Training Registry',
            shortName: 'Training',
            href: route('training.index'),
            routeName: 'training.*',
            icon: GraduationCap,
            category: 'workforce',
            description: 'Professional development & competency certifications',
            activeBg: 'bg-purple-600',
            squircleColor: {
                bg: 'bg-purple-600 text-white',
                text: 'text-purple-600',
            },
        },
        {
            id: 'separations',
            name: 'Separations & Exits',
            shortName: 'Exits',
            href: route('separations.index'),
            routeName: 'separations.*',
            icon: UserMinus,
            category: 'workforce',
            description: 'Resignations, clearances & offboarding workflow',
            activeBg: 'bg-rose-500',
            squircleColor: {
                bg: 'bg-rose-500 text-white',
                text: 'text-rose-500',
            },
        },

        // Category 3: System Governance & Compliance
        {
            id: 'settings',
            name: 'Statutory Settings',
            shortName: 'Statutory',
            href: route('settings.index'),
            routeName: 'settings.*',
            icon: Sliders,
            category: 'governance',
            description: 'Tax brackets, pension rates & labor statutory rules',
            activeBg: 'bg-slate-700',
            squircleColor: {
                bg: 'bg-slate-700 dark:bg-slate-600 text-white',
                text: 'text-slate-700 dark:text-slate-300',
            },
        },
        {
            id: 'audit',
            name: 'Security Audit Log',
            shortName: 'Audit Trail',
            href: route('audit.index'),
            routeName: 'audit.*',
            icon: Activity,
            category: 'governance',
            description: 'Forensic tamper-evident security audit trail',
            activeBg: 'bg-violet-600',
            squircleColor: {
                bg: 'bg-violet-600 text-white',
                text: 'text-violet-600',
            },
        },

        // Category 4: Personal Workspace
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
            description: 'Submit personal leave request & track approval status',
            activeBg: 'bg-emerald-600',
            squircleColor: {
                bg: 'bg-emerald-600 text-white',
                text: 'text-emerald-600',
            },
        },
        {
            id: 'portal-leave-requests',
            name: 'Leave Requests',
            shortName: 'Approvals',
            href: route('portal.leave-requests.index'),
            routeName: 'portal.leave-requests.*',
            icon: CalendarCheck,
            category: 'personal',
            description: 'Review and approve/reject staff leave applications',
            activeBg: 'bg-[#0066cc]',
            squircleColor: {
                bg: 'bg-[#0066cc] text-white',
                text: 'text-[#0066cc]',
            },
        },
    ];
};
