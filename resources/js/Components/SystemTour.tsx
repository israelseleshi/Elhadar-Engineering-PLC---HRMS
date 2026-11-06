import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { 
    Compass, 
    ArrowRight, 
    ArrowLeft, 
    CheckCircle2, 
    X, 
    LayoutDashboard, 
    Users, 
    UserPlus, 
    Edit, 
    CalendarClock, 
    Briefcase, 
    CalendarDays, 
    GraduationCap, 
    TrendingUp, 
    UserMinus, 
    FileSpreadsheet, 
    Sliders, 
    Activity, 
    Calendar, 
    UserCheck, 
    ShieldCheck, 
    Rocket,
    ExternalLink
} from 'lucide-react';

export interface TourStep {
    id: number;
    title: string;
    category: string;
    icon: any;
    proclamation?: string;
    description: string;
    keyHighlights: string[];
    routeUrl?: string;
    routeLabel?: string;
}

export const TOUR_STEPS: TourStep[] = [
    {
        id: 1,
        title: 'Executive HR Command Dashboard',
        category: 'Phase 2: Core Command',
        icon: LayoutDashboard,
        proclamation: 'Enterprise Governance',
        description: 'Real-time operational cockpit providing high-level visibility across all personnel, construction project allocations, gender diversity ratios, quarterly turnover, and urgent compliance alerts.',
        keyHighlights: [
            'Project Site vs. Head Office headcount segmentation',
            'Real-time statutory countdown alerts (Probation & POESSA Retirement)',
            'Turnover percentage metrics calculated per standard formula'
        ],
        routeUrl: '/dashboard',
        routeLabel: 'Open Dashboard'
    },
    {
        id: 2,
        title: 'Master Staff Directory & Search',
        category: 'Phase 2: Master Records',
        icon: Users,
        proclamation: '106+ Excel Records Ingested',
        description: 'Comprehensive staff directory containing all 106+ permanent personnel, fixed-term contract staff, and probation candidates imported directly from Elhadar master spreadsheet.',
        keyHighlights: [
            'Multi-faceted search by name, unique file number (e.g. A-001), phone, or TIN',
            'Filtering by department, workplace site, and employment status',
            'Instant links to full 360-degree employee profiles'
        ],
        routeUrl: '/employees',
        routeLabel: 'Explore Directory'
    },
    {
        id: 3,
        title: '360Â° Employee Digital Profile',
        category: 'Phase 2: Complete Profile',
        icon: ShieldCheck,
        proclamation: 'Proclamation 1156/2019 & 1268/2022',
        description: 'Centralized individual personnel profile compiling personal credentials, continuous service tenure, itemized monthly compensation, statutory leave accruals, and retirement notices.',
        keyHighlights: [
            'Itemized gross wage breakdown across 8 statutory field allowances',
            'Continuous tenure calculated in exact years, months, and days',
            'Automatic POESSA 60-year statutory retirement alert countdown'
        ],
        routeUrl: '/employees',
        routeLabel: 'View Profiles'
    },
    {
        id: 4,
        title: 'Multi-Step Employee Onboarding Wizard',
        category: 'Phase 4: Personnel Acquisition',
        icon: UserPlus,
        proclamation: 'Labour Proclamation 1156/2019',
        description: 'Guided 4-step onboarding wizard capturing 33 identity, job allocation, dual-calendar dates, allowance packages, and banking parameters.',
        keyHighlights: [
            'Automatic computation of 60-working-day statutory probation end date',
            'Automatic POESSA retirement date generation (Age 60)',
            'Instant initialization of 16 base annual leave days and pension withholding'
        ],
        routeUrl: '/employees/create',
        routeLabel: 'Open Onboarding Wizard'
    },
    {
        id: 5,
        title: 'Personnel Profile Editor & Salary Increments',
        category: 'Phase 6: Record Maintenance',
        icon: Edit,
        proclamation: 'Full Audit Trail Enforcement',
        description: 'Comprehensive profile editing tool for updating personnel records with mandatory change tracking and historical salary increment logging.',
        keyHighlights: [
            'Preserves historical salary versions while establishing new current milestones',
            'Automates employee 7% and company 11% pension recalibration',
            'Logs all previous and new values to the immutable audit trail'
        ],
        routeUrl: '/employees',
        routeLabel: 'Manage Profiles'
    },
    {
        id: 6,
        title: 'Statutory Working-Day Probation Pipeline',
        category: 'Phase 3: Statutory Compliance',
        icon: CalendarClock,
        proclamation: 'Labour Proclamation 1156/2019, Art. 11',
        description: 'Automated 60-working-day probation countdown engine strictly excluding rest days (Sundays) and Ethiopian public holidays to prevent accidental permanent status conversion.',
        keyHighlights: [
            'Real-time remaining working-day countdown chips',
            '1-click permanent status confirmation with permanent_status_date timestamping',
            'Managerial 90-calendar-day track'
        ],
        routeUrl: '/probation',
        routeLabel: 'Open Probation Pipeline'
    },
    {
        id: 7,
        title: 'Project Contract Expiration Board',
        category: 'Phase 3: Site Contracts',
        icon: Briefcase,
        proclamation: 'Civil Construction Directives',
        description: 'Pipeline for fixed-term construction project contracts. Highlights contracts nearing expiration (<30 days, <15 days) and facilitates formal contract renewals.',
        keyHighlights: [
            'Urgency tabs for expired and expiring site contracts',
            'Contract renewal modal capturing new end dates and adjusted project wages',
            'Complete renewal history logged to database'
        ],
        routeUrl: '/contracts',
        routeLabel: 'Open Contract Board'
    },
    {
        id: 8,
        title: 'Statutory Annual Leave Ledger',
        category: 'Phase 3: Leave Administration',
        icon: CalendarDays,
        proclamation: 'Labour Proclamation 1156/2019, Art. 77',
        description: 'Statutory leave administration engine applying the legal formula: 16 working days for year 1, +1 working day for every additional 2 years of continuous service.',
        keyHighlights: [
            'Automatic calculation of earned entitlement based on hire date',
            'Tracking of carried over, taken, and remaining leave balances',
            'Leave deduction dialog with reason documentation'
        ],
        routeUrl: '/leave?tour=true',
        routeLabel: 'Tour Leave Ledger'
    },
    {
        id: 9,
        title: 'Training & Vocational Certification Registry',
        category: 'Phase 3: Capacity Building',
        icon: GraduationCap,
        proclamation: 'Technical Skill Development',
        description: 'Tracks certified vocational and technical engineering courses, accredited training institutions, certificate serial numbers, and 1â€“5 performance impact ratings.',
        keyHighlights: [
            'Logs courses, accredited institutions, and completion dates',
            '1 to 5 performance impact evaluation scoring',
            'Institution tags and historical employee training logs'
        ],
        routeUrl: '/training',
        routeLabel: 'Open Training Registry'
    },
    {
        id: 10,
        title: 'Internal Career Progression & Promotions Ledger',
        category: 'Phase 4: Career Development',
        icon: TrendingUp,
        proclamation: 'Merit Salary Advancements',
        description: 'Audit log documenting internal promotions, tracking previous position & salary vs. updated position, salary step level, and wage increase percentages.',
        keyHighlights: [
            'Career progression timeline with previous vs. new title badges',
            'Automatic wage hike and increment percentage calculations',
            'Records Ethiopian Calendar promotion dates'
        ],
        routeUrl: '/promotions',
        routeLabel: 'Open Promotions Ledger'
    },
    {
        id: 11,
        title: 'Separations & Statutory Severance Estimator',
        category: 'Phase 4: Exit Governance',
        icon: UserMinus,
        proclamation: 'Labour Proclamation 1156/2019, Arts. 39â€“41',
        description: 'Exit management suite with an interactive statutory severance calculator applying Ethiopian labor law formulas (30 days basic wage for year 1, +1/3 month per subsequent year, capped at 12 months).',
        keyHighlights: [
            'Live formula estimation modal based on employee hire date and basic salary',
            'Differentiates severance eligibility (Layoff vs. Resignation vs. Cause)',
            'Disbursement tracking with 1-click "Mark Paid" actions'
        ],
        routeUrl: '/separations',
        routeLabel: 'Open Separations Suite'
    },
    {
        id: 12,
        title: 'Bulk Excel Reconciliation & Roster Export',
        category: 'Phase 5: Data Integration',
        icon: FileSpreadsheet,
        proclamation: 'Excel Ingestion & Synchronization',
        description: 'Spreadsheet import center with a dry-run simulation mode that parses `.xlsx` and `.csv` files, detects new vs. existing records, reports errors, and executes transactional imports.',
        keyHighlights: [
            'Drag-and-drop upload with downloadable standard CSV template',
            'Dry-run reconciliation preview separating inserts, updates, and warnings',
            '1-click export of complete staff master list or filtered site rosters'
        ],
        routeUrl: '/import',
        routeLabel: 'Open Excel Sync Center'
    },
    {
        id: 13,
        title: 'Statutory Proclamation Parameter Registry',
        category: 'Phase 5: Legal Calibration',
        icon: Sliders,
        proclamation: 'Proclamations 1156/2019 & 1268/2022',
        description: 'System configuration registry housing legal constants (pension rates 7%/11%, 60-day probation limit, 60-year retirement age, base 16-day leave) with legal proclamation article citations.',
        keyHighlights: [
            'Live configuration of statutory constants',
            'Legal article citations attached to every parameter',
            'Changes saved directly to the immutable audit trail'
        ],
        routeUrl: '/settings',
        routeLabel: 'Open Statutory Settings'
    },
    {
        id: 14,
        title: 'Immutable Security Audit Log & Diff Inspector',
        category: 'Phase 5: Compliance & Security',
        icon: Activity,
        proclamation: 'Append-Only Audit Trail',
        description: 'Append-only audit trail logging all modifications to personnel profiles, salary records, and system settings with user IDs, IP addresses, timestamps, and an interactive state diff inspector.',
        keyHighlights: [
            'Full search and filtering by action type, operator, and date',
            'Side-by-side Before (red) vs. After (green) JSON state comparison modal',
            'Tamper-evident activity logging for corporate accountability'
        ],
        routeUrl: '/audit',
        routeLabel: 'Open Audit Log'
    },
    {
        id: 15,
        title: 'Dual Ethiopian / Gregorian Calendar Engine',
        category: 'Phase 6: Cultural Localization',
        icon: Calendar,
        proclamation: 'Ethiopian Calendar (E.C.) Engine',
        description: 'Built-in bidirectional date conversion engine supporting all 13 Ethiopian months (Meskerem to Pagume) with leap year calculations synchronized to SQL Gregorian date columns.',
        keyHighlights: [
            'Reusable interactive EthiopianDatePicker component',
            'Instant toggle between G.C. and E.C. date picking',
            'Maintains SQL indexability while presenting authentic Ethiopian dates'
        ],
        routeUrl: '/employees/create',
        routeLabel: 'Test Dual Calendar'
    },
    {
        id: 16,
        title: 'Employee Self-Service (ESS) Digital Portal',
        category: 'Phase 3: Staff Empowerment',
        icon: UserCheck,
        proclamation: 'Transparency & Error Rectification',
        description: 'Read-only self-service portal enabling field engineers and office staff to review their official employment profile, monthly allowances, tenure, and submit formal discrepancy correction requests.',
        keyHighlights: [
            'Dedicated mobile-friendly layout for site workers',
            'Clear display of CBE bank account, TIN, and gross salary breakdown',
            'Discrepancy reporting workflow with HR administrator review inbox'
        ],
        routeUrl: '/portal/profile',
        routeLabel: 'View ESS Portal'
    },
    {
        id: 17,
        title: 'Role-Based Access Control (RBAC) Security',
        category: 'Phase 6: Defense in Depth',
        icon: ShieldCheck,
        proclamation: 'Security & Segregation of Duties',
        description: 'Strict middleware enforcement restricting administrative features to SysAdmin and HRAdmin, providing site operational views to Managers, and confining general staff to read-only self-service.',
        keyHighlights: [
            'Automated redirection of Employee role to self-service portal',
            'Route-level protection on salary, separation, and parameter edits',
            'Verified through automated boundary and role enforcement tests'
        ],
        routeUrl: '/dashboard',
        routeLabel: 'Verify Protection'
    },
    {
        id: 18,
        title: 'Production Staging Ready (cPanel knltraoo & charismahand.com)',
        category: 'Phase 7: Cloud & Production',
        icon: Rocket,
        proclamation: 'High-Performance Production Stack',
        description: 'Architected for seamless deployment across production hosting: MySQL database hosted on cPanel (knltrading.com) and web application deployed on charismahand.com.',
        keyHighlights: [
            '85+ automated feature and unit tests passing with zero errors',
            'Zero-error Vite asset compilation and clean Laravel Pint styling',
            'Configured for daily automated Laravel scheduler cron execution'
        ],
        routeUrl: '/dashboard',
        routeLabel: 'Ready for Staging'
    }
];

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function SystemTour({ open, onClose }: Props) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const step = TOUR_STEPS[currentStepIndex];
    const Icon = step.icon;
    const progressPercent = Math.round(((currentStepIndex + 1) / TOUR_STEPS.length) * 100);

    const nextStep = () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            onClose();
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    };

    return (
        <Modal show={open} onClose={onClose} maxWidth="2xl">
            <div className="bg-white rounded-xs overflow-hidden">
                {/* Tour Header Banner */}
                <div className="bg-[#1d1d1f] text-white p-5 flex items-center justify-between border-b border-[#000000]">
                    <div className="flex items-center gap-2.5">
                        <ApplicationLogo className="w-8 h-8 shrink-0" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white tracking-tight">
                                    El-Hadar HRMS System Tour
                                </h3>
                                <Badge className="bg-[#2997ff] text-[#1d1d1f] text-[10px] font-bold border-none">
                                    18 Core Modules
                                </Badge>
                            </div>
                            <p className="text-xs text-white/70">
                                Step {step.id} of {TOUR_STEPS.length} â€¢ {step.category}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white p-1 rounded-xs transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#e8e8ed] h-1.5">
                    <div
                        className="bg-[#0066cc] h-1.5 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Main Step Content */}
                <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xs bg-[#f5f5f7] text-[#0066cc] flex items-center justify-center shrink-0 border border-[#0066cc]/20">
                            <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[10px] font-semibold border-[#d2d2d7]">
                                    {step.category}
                                </Badge>
                                {step.proclamation && (
                                    <Badge className="bg-[#f5f5f7] text-[#0066cc] border border-[#0066cc]/30 text-[10px] font-semibold">
                                        {step.proclamation}
                                    </Badge>
                                )}
                            </div>
                            <h4 className="text-lg font-bold text-black tracking-tight">
                                {step.title}
                            </h4>
                        </div>
                    </div>

                    <p className="text-xs text-[#424245] leading-relaxed mb-4">
                        {step.description}
                    </p>

                    {/* Key Highlights Spec Box (NerdWallet Style) */}
                    <div className="p-3.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xs mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6e6e73] mb-2">
                            Key Architectural Deliverables
                        </p>
                        <ul className="space-y-1.5">
                            {step.keyHighlights.map((hl, idx) => (
                                <li key={idx} className="text-xs text-[#424245] flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
                                    <span>{hl}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Jump Action */}
                    {step.routeUrl && (
                        <div className="flex items-center justify-between p-2.5 bg-[#f5f5f7]/50 border border-[#0066cc]/20 rounded-xs mb-2">
                            <span className="text-[11px] text-[#1d1d1f] font-medium">
                                Jump directly to this module in the app:
                            </span>
                            <Link href={step.routeUrl} onClick={onClose}>
                                <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5 h-7 bg-white border-[#0066cc]/30 text-[#0066cc] hover:bg-[#f5f5f7] rounded-xs">
                                    <span>{step.routeLabel || 'Open Page'}</span>
                                    <ExternalLink className="w-3 h-3" />
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-[#f5f5f7] border-t border-[#e8e8ed] flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-xs text-[#6e6e73] hover:text-black"
                    >
                        Skip Tour
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={prevStep}
                            disabled={currentStepIndex === 0}
                            className="text-xs font-semibold border-[#d2d2d7] rounded-xs gap-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Previous</span>
                        </Button>

                        <Button
                            size="sm"
                            onClick={nextStep}
                            className="bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold rounded-xs gap-1.5 px-4"
                        >
                            <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Module'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

