import { useState, useEffect } from 'react';
import { motion, useSpring, type Variants } from 'framer-motion';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import {
    Users,
    Building2,
    MapPin,
    AlertTriangle,
    CalendarClock,
    CreditCard,
    ArrowUpRight,
    Eye,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    FileEdit,
    Check,
    X,
    Clock,
    Briefcase,
    Shield,
    Layers,
    Map,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Cell,
    LabelList,
    PieChart,
    Pie,
} from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/Components/ui/chart';

interface Props {
    metrics: {
        total_active: number;
        permanent_count: number;
        project_count?: number;
        head_office_count?: number;
        probation_count: number;
        contract_count: number;
        separated_count: number;
        male_count?: number;
        female_count?: number;
        male_percentage?: number;
        female_percentage?: number;
        turnover?: {
            period_start: string;
            period_end: string;
            opening_headcount: number;
            closing_headcount: number;
            average_headcount: number;
            separations_count: number;
            turnover_rate: number;
        };
        ytd_turnover?: {
            period_start: string;
            period_end: string;
            opening_headcount: number;
            closing_headcount: number;
            average_headcount: number;
            separations_count: number;
            turnover_rate: number;
        };
        total_monthly_payroll: number;
        total_basic_payroll: number;
        total_allowances: number;
        total_pension_company: number;
    };
    alerts: {
        probation: {
            id: number;
            file_no: string;
            full_name: string;
            position: string;
            department?: string;
            probation_end_date?: string;
            days_remaining: number | null;
            is_urgent: boolean;
        }[];
        retirement: {
            id: number;
            file_no: string;
            full_name: string;
            position: string;
            department?: string;
            retirement_date: string;
            days_remaining: number;
        }[];
        discrepancies?: {
            id: number;
            employee_id: number;
            file_no?: string;
            full_name?: string;
            department?: string;
            field_name: string;
            current_value?: string;
            proposed_value?: string;
            explanation?: string;
            created_at: string;
        }[];
    };
    departmentBreakdown: { id: number; name: string; employees_count: number }[];
    siteBreakdown?: { name: string; count: number; is_head_office: boolean }[];
    employmentTenureBreakdown?: { status: string; label: string; count: number; percentage: number; fill: string }[];
    recentStaff?: {
        id: number;
        file_no: string;
        full_name: string;
        position: string;
        work_place: string;
        employment_date_ec: string;
        department?: { name: string };
        current_salary?: { total_salary: number; basic_salary: number };
    }[];
}

function AnimatedNumber({
    value,
    precision = 0,
    suffix = '',
    delay = 0,
}: {
    value: number;
    precision?: number;
    suffix?: string;
    delay?: number;
}) {
    const [displayVal, setDisplayVal] = useState(
        '0' + (precision > 0 ? '.' + '0'.repeat(precision) : '') + suffix
    );
    const spring = useSpring(0, {
        mass: 0.8,
        stiffness: 60,
        damping: 18,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            spring.set(value);
        }, delay * 1000);

        const unsubscribe = spring.on('change', (latest) => {
            setDisplayVal(
                precision > 0
                    ? `${latest.toFixed(precision)}${suffix}`
                    : `${Math.round(latest)}${suffix}`
            );
        });

        return () => {
            clearTimeout(timer);
            unsubscribe();
        };
    }, [spring, value, precision, suffix, delay]);

    return <span>{displayVal}</span>;
}

const luxuryEase = [0.16, 1, 0.3, 1] as const;

const topSectionVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.05,
        },
    },
};

const topCardVariants: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.7,
            ease: luxuryEase,
        },
    },
};

export default function Dashboard({
    metrics,
    alerts,
    departmentBreakdown,
    siteBreakdown = [],
    employmentTenureBreakdown = [],
    recentStaff = [],
}: Props) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            maximumFractionDigits: 0,
        }).format(val);
    };

    const maleCount = metrics.male_count ?? 0;
    const femaleCount = metrics.female_count ?? 0;
    const totalGender = maleCount + femaleCount > 0 ? maleCount + femaleCount : metrics.total_active;
    const malePct = totalGender > 0 ? Math.round((maleCount / totalGender) * 100) : 0;
    const femalePct = totalGender > 0 ? Math.round((femaleCount / totalGender) * 100) : 0;

    // SVG Donut calculations (circumference = 2 * pi * 38 ≈ 238.761)
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const maleDash = totalGender > 0 ? (maleCount / totalGender) * circumference : 0;
    const femaleDash = totalGender > 0 ? (femaleCount / totalGender) * circumference : 0;

    // Turnover stats
    const mtdRate = metrics.turnover?.turnover_rate ?? 0;
    const ytdRate = metrics.ytd_turnover?.turnover_rate ?? 0;
    const mtdSeparations = metrics.turnover?.separations_count ?? 0;
    const ytdSeparations = metrics.ytd_turnover?.separations_count ?? 0;
    const avgHeadcount = metrics.ytd_turnover?.average_headcount ?? metrics.total_active;

    const turnoverColor = ytdRate === 0 ? 'primary' : ytdRate <= 5 ? 'success-600' : ytdRate <= 10 ? 'warning-600' : 'destructive-600';
    const turnoverBg = ytdRate === 0 ? 'primary/10' : ytdRate <= 5 ? 'success-50' : ytdRate <= 10 ? 'warning-50' : 'destructive-50';
    const turnoverBorder = ytdRate === 0 ? 'primary/20' : ytdRate <= 5 ? 'success-100' : ytdRate <= 10 ? 'warning-100' : 'destructive-100';
    const turnoverText = ytdRate === 0 ? 'primary' : ytdRate <= 5 ? 'success-700' : ytdRate <= 10 ? 'warning-700' : 'destructive-700';

    const [reviewConfirm, setReviewConfirm] = useState<{ id: number; status: 'Approved' | 'Rejected' } | null>(null);

    const handleDiscrepancyReview = (id: number, status: 'Approved' | 'Rejected') => {
        setReviewConfirm({ id, status });
    };

    const executeDiscrepancyReview = () => {
        if (!reviewConfirm) return;
        const { id, status } = reviewConfirm;

        router.patch(route('portal.discrepancy.review', id), {
            status,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Discrepancy report ${status.toLowerCase()} successfully.`);
            },
            onError: () => {
                toast.error('Failed to update discrepancy report.');
            },
            onFinish: () => setReviewConfirm(null),
        });
    };

    // Chart 1: Workplace Deployment (Project Sites vs Head Office)
    const projectCount = metrics.project_count ?? 199;
    const headOfficeCount = metrics.head_office_count ?? 100;
    const totalActiveStaff = metrics.total_active || 299;
    const projectPct = totalActiveStaff > 0 ? Math.round((projectCount / totalActiveStaff) * 100) : 0;
    const headOfficePct = totalActiveStaff > 0 ? Math.round((headOfficeCount / totalActiveStaff) * 100) : 0;

    const workplaceChartData = [
        {
            name: 'Regional Project Sites',
            count: projectCount,
            percentage: projectPct,
            fill: '#0284c7',
        },
        {
            name: 'Head Office (Addis Ababa)',
            count: headOfficeCount,
            percentage: headOfficePct,
            fill: '#8b5cf6',
        },
    ];

    const workplaceChartConfig = {
        projects: {
            label: 'Regional Project Sites',
            color: '#0284c7',
        },
        headoffice: {
            label: 'Head Office (Addis Ababa)',
            color: '#8b5cf6',
        },
    } satisfies ChartConfig;

    // Chart 3: Employment Tenure & Statutory Stability
    const permCount = metrics.permanent_count ?? 244;
    const probCount = metrics.probation_count ?? 54;
    const contCount = metrics.contract_count ?? 1;
    const permPct = totalActiveStaff > 0 ? ((permCount / totalActiveStaff) * 100).toFixed(1) : '0';
    const probPct = totalActiveStaff > 0 ? ((probCount / totalActiveStaff) * 100).toFixed(1) : '0';
    const contPct = totalActiveStaff > 0 ? ((contCount / totalActiveStaff) * 100).toFixed(1) : '0';

    // All Departments Palette & Data for Shadcn Bar Chart
    const departmentPalette = [
        { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' }, // Construction & Engineering
        { color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' }, // P&ED
        { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' }, // GSFAD
        { color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' }, // HC Directorate
        { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' }, // PAD
        { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' }, // Finance Dept
        { color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' }, // PSCD
        { color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8' }, // SHED
        { color: '#f97316', bg: '#fff7ed', border: '#fed7aa' }, // CEO Office
        { color: '#14b8a6', bg: '#f0fdf4', border: '#bbf7d0' }, // PMO Office
        { color: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc' }, // IT
    ];

    const departmentChartData = departmentBreakdown.map((dept, idx) => {
        const palette = departmentPalette[idx % departmentPalette.length];
        const pct = metrics.total_active > 0
            ? Math.round((dept.employees_count / metrics.total_active) * 100)
            : 0;
        return {
            id: dept.id,
            name: dept.name,
            employees_count: dept.employees_count,
            percentage: pct,
            fill: palette.color,
            bg: palette.bg,
            border: palette.border,
        };
    });

    const allDeptsTotalEmployees = departmentBreakdown.reduce((acc, d) => acc + d.employees_count, 0);

    const top2Depts = [...departmentChartData].sort((a, b) => b.employees_count - a.employees_count).slice(0, 2);
    const top2Total = top2Depts.reduce((acc, d) => acc + d.employees_count, 0);
    const top2Pct = metrics.total_active > 0 ? ((top2Total / metrics.total_active) * 100).toFixed(1) : '0';

    const departmentChartConfig = {
        employees_count: {
            label: 'Active Staff',
            color: 'primary',
        },
    } satisfies ChartConfig;

    return (
        <AuthenticatedLayout
            title="Dashboard"
            subtitle="Overview of your staff, payroll and upcoming deadlines."
        >
            <Head title="Dashboard - Elhadar Engineering HRMS" />

            {/* Top Stat Section: 2 Stacked Cards on Left, Tall Gender Donut on Right */}
            <motion.div
                variants={topSectionVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8 items-stretch"
            >
                {/* Left Column: 2 Stacked Cards (lg:col-span-5) */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                    {/* 1. Active Headcount */}
                    <motion.div
                        variants={topCardVariants}
                        whileHover={{ y: -3, transition: { duration: 0.25, ease: 'easeOut' } }}
                        className="flex flex-col flex-1"
                    >
                        <Card className="border-border bg-card shadow-xs hover:shadow-md transition-shadow duration-300 rounded-xl p-5 sm:p-6 flex flex-col justify-between h-full">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Active headcount</p>
                                    <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mt-2">
                                        <AnimatedNumber value={metrics.total_active} delay={0.15} />
                                    </p>
                                </div>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2, ease: luxuryEase }}
                                    className="w-10 h-10 rounded-lg bg-muted border border-border/50 flex items-center justify-center text-muted-foreground shrink-0"
                                >
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                </motion.div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                Total active workforce across all operational units
                            </p>
                        </Card>
                    </motion.div>

                    {/* 2. Employee Turnover Rate */}
                    <motion.div
                        variants={topCardVariants}
                        whileHover={{ y: -3, transition: { duration: 0.25, ease: 'easeOut' } }}
                        className="flex flex-col flex-1"
                    >
                        <Card className="border-border bg-card shadow-xs hover:shadow-md transition-shadow duration-300 rounded-xl p-5 sm:p-6 flex flex-col justify-between h-full">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-medium text-muted-foreground">Employee turnover rate</p>
                                    </div>
                                    <p className={`text-3xl sm:text-4xl font-semibold tracking-tight mt-2 ${turnoverColor === 'primary' ? 'text-primary' : turnoverColor === 'success-600' ? 'text-success-600' : turnoverColor === 'warning-600' ? 'text-warning-600' : 'text-destructive-600'}`}>
                                        <AnimatedNumber value={ytdRate} precision={2} suffix="%" delay={0.25} />
                                    </p>
                                </div>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.3, ease: luxuryEase }}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-${turnoverBg.split('/')[0]}${turnoverBg.includes('/') ? `/${turnoverBg.split('/')[1]}` : ''} border-${turnoverBorder} shrink-0`}
                                >
                                    <TrendingDown className={`w-5 h-5 ${turnoverColor === 'primary' ? 'text-primary' : turnoverColor === 'success-600' ? 'text-success-600' : turnoverColor === 'warning-600' ? 'text-warning-600' : 'text-destructive-600'}`} />
                                </motion.div>
                            </div>
                            <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    Avg staff: <strong className="font-semibold text-foreground">{avgHeadcount}</strong> &middot; <strong className="font-semibold text-foreground">{ytdSeparations}</strong> {ytdSeparations === 1 ? 'exit' : 'exits'}
                                </span>
                                <span className="text-muted-foreground">
                                    {mtdRate.toFixed(2)}% this mo.
                                </span>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Right Column: Employees by Gender Donut Card (lg:col-span-7) */}
                <motion.div
                    variants={topCardVariants}
                    whileHover={{ y: -3, transition: { duration: 0.25, ease: 'easeOut' } }}
                    className="lg:col-span-7 flex flex-col"
                >
                    <Card className="border-border bg-card shadow-xs hover:shadow-md transition-shadow duration-300 rounded-xl p-5 sm:p-6 flex flex-col justify-between h-full">
                        <div>
                            <h3 className="text-base font-semibold text-foreground">Employees by gender</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Workforce diversity</p>
                        </div>

                        <div className="my-auto py-5 flex flex-col sm:flex-row items-center justify-center gap-8 lg:gap-12">
                            {/* SVG Donut Chart with Framer Motion Arcs */}
                            <div className="relative w-36 h-36 shrink-0">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="38"
                                        fill="transparent"
                                        className="stroke-muted/80 dark:stroke-muted/40"
                                        strokeWidth="11"
                                    />
                                    {totalGender > 0 && (
                                        <>
                                            {maleCount > 0 && (
                                                <motion.circle
                                                    cx="50"
                                                    cy="50"
                                                    r="38"
                                                    fill="transparent"
                                                    className="stroke-blue-600 dark:stroke-blue-500"
                                                    strokeWidth="11"
                                                    strokeDasharray={`${maleDash} ${circumference}`}
                                                    initial={{ strokeDashoffset: maleDash }}
                                                    animate={{ strokeDashoffset: 0 }}
                                                    transition={{ duration: 1.4, delay: 0.25, ease: luxuryEase }}
                                                />
                                            )}
                                            {femaleCount > 0 && (
                                                <motion.circle
                                                    cx="50"
                                                    cy="50"
                                                    r="38"
                                                    fill="transparent"
                                                    className="stroke-rose-500 dark:stroke-rose-400"
                                                    strokeWidth="11"
                                                    strokeDasharray={`${femaleDash} ${circumference}`}
                                                    initial={{ strokeDashoffset: femaleDash }}
                                                    animate={{ strokeDashoffset: -maleDash }}
                                                    transition={{ duration: 1.4, delay: 0.45, ease: luxuryEase }}
                                                />
                                            )}
                                        </>
                                    )}
                                </svg>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.7, delay: 0.3, ease: luxuryEase }}
                                    className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
                                >
                                    <span className="text-2xl font-bold tracking-tight text-foreground leading-none">
                                        <AnimatedNumber value={totalGender} delay={0.25} />
                                    </span>
                                    <span className="text-[11px] text-muted-foreground font-medium mt-1">
                                        Total staff
                                    </span>
                                </motion.div>
                            </div>

                            {/* Legend & Breakdown with Framer Motion */}
                            <div className="flex flex-col gap-3 w-full sm:w-auto sm:min-w-[200px]">
                                <motion.div
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.35, ease: luxuryEase }}
                                    whileHover={{ scale: 1.015, x: 2, transition: { duration: 0.2 } }}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/60 border border-border/50 hover:border-border transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-500 shadow-xs" />
                                        <span className="text-sm font-medium text-foreground">Male</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-semibold text-foreground">
                                            <AnimatedNumber value={maleCount} delay={0.4} />
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-1.5 font-medium">({malePct}%)</span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.45, ease: luxuryEase }}
                                    whileHover={{ scale: 1.015, x: 2, transition: { duration: 0.2 } }}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/60 border border-border/50 hover:border-border transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-3 h-3 rounded-full bg-rose-500 dark:bg-rose-400 shadow-xs" />
                                        <span className="text-sm font-medium text-foreground">Female</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-semibold text-foreground">
                                            <AnimatedNumber value={femaleCount} delay={0.5} />
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-1.5 font-medium">({femalePct}%)</span>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.55 }}
                            className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground"
                        >
                            <span>Active roster representation</span>
                            <span className="font-medium">
                                <span className="text-rose-600 dark:text-rose-400 font-semibold">{femaleCount} female</span>
                                {' '}&middot;{' '}
                                <span className="text-blue-600 dark:text-blue-400 font-semibold">{maleCount} male</span>
                            </span>
                        </motion.div>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Employee Data Correction Requests Card */}
            {alerts.discrepancies && alerts.discrepancies.length > 0 && (
                <Card className="border-border bg-muted/50 mb-6 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center shrink-0">
                                <FileEdit className="w-4 h-4 text-background" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-base text-foreground">
                                        Pending Employee Data Correction Requests
                                    </CardTitle>
                                    <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 font-semibold rounded-full">
                                        {alerts.discrepancies.length} Pending
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs text-foreground/80">
                                    Submitted by staff members through the Self-Service Portal awaiting HR review
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="rounded-xl border border-border bg-background overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead className="text-xs font-bold py-2">Staff member</TableHead>
                                        <TableHead className="text-xs font-bold py-2">Field</TableHead>
                                        <TableHead className="text-xs font-bold py-2">Current record</TableHead>
                                        <TableHead className="text-xs font-bold py-2">Requested value</TableHead>
                                        <TableHead className="text-xs font-bold py-2">Explanation</TableHead>
                                        <TableHead className="text-xs font-bold py-2 text-right"><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {alerts.discrepancies.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-accent/50">
                                            <TableCell className="py-2.5">
                                                <Link
                                                    href={route('employees.show', item.employee_id)}
                                                    className="font-semibold text-xs text-primary hover:underline"
                                                >
                                                    {item.full_name || 'Staff Member'}
                                                </Link>
                                                <div className="text-[11px] text-muted-foreground">
                                                    {item.file_no} &bull; {item.department || 'General'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2.5">
                                                <Badge variant="outline" className="text-[11px] uppercase tracking-wider font-mono bg-accent border-border">
                                                    {item.field_name.replace(/_/g, ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-2.5 text-xs text-muted-foreground font-mono">
                                                {item.current_value || <span className="italic text-muted-foreground">Empty</span>}
                                            </TableCell>
                                            <TableCell className="py-2.5 text-xs font-semibold text-foreground font-mono">
                                                {item.proposed_value}
                                            </TableCell>
                                            <TableCell className="py-2.5 text-xs text-muted-foreground max-w-[200px] truncate" title={item.explanation}>
                                                {item.explanation || '—'}
                                            </TableCell>
                                            <TableCell className="py-2.5 text-right space-x-1.5 whitespace-nowrap">
                                                <Button
                                                    size="sm"
                                                    className="h-8 text-xs rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-3 font-medium"
                                                    onClick={() => handleDiscrepancyReview(item.id, 'Approved')}
                                                >
                                                    <Check className="w-3.5 h-3.5 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-8 text-xs rounded-full px-3"
                                                    onClick={() => handleDiscrepancyReview(item.id, 'Rejected')}
                                                >
                                                    <X className="w-3.5 h-3.5 mr-1" />
                                                    Reject
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Mid Row: 2 Key Analytical Charts (Workplace Deployment & Employment Tenure) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Chart 1: Workplace Deployment (Project Sites vs. Head Office) */}
                <Card className="border-border bg-card shadow-xs flex flex-col justify-between">
                    <CardHeader className="pb-3 border-b border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-md bg-muted text-primary flex items-center justify-center shrink-0 border border-border">
                                    <MapPin className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base text-foreground font-bold">
                                            Workplace Deployment
                                        </CardTitle>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold bg-muted text-primary border-border">
                                            Field vs. H.O.
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        Regional project mobilization vs. centralized Head Office
                                    </CardDescription>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20 hidden sm:inline-block font-mono">
                                {projectPct}% Field Staff
                            </span>
                        </div>
                    </CardHeader>

                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                            {/* Interactive Donut Chart */}
                            <div className="relative h-[210px] w-full flex items-center justify-center">
                                <ChartContainer config={workplaceChartConfig} className="aspect-auto h-[210px] w-full">
                                    <PieChart>
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    nameKey="name"
                                                    formatter={(val, name) => (
                                                        <div className="flex items-center justify-between gap-4 w-full">
                                                            <span className="text-muted-foreground">{name}:</span>
                                                            <span className="font-bold text-foreground font-mono">
                                                                {val} ({Math.round(((val as number) / totalActiveStaff) * 100)}%)
                                                            </span>
                                                        </div>
                                                    )}
                                                />
                                            }
                                        />
                                        <Pie
                                            data={workplaceChartData}
                                            dataKey="count"
                                            nameKey="name"
                                            innerRadius={60}
                                            outerRadius={88}
                                            paddingAngle={3}
                                            stroke="hsl(var(--card))"
                                            strokeWidth={3}
                                        >
                                            {workplaceChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>
                                {/* Center Stats in Donut */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-bold text-foreground font-mono leading-none">
                                        {totalActiveStaff}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1">
                                        Mobilized
                                    </span>
                                </div>
                            </div>

                            {/* Split Breakdown Indicators */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                <div className="p-2.5 rounded-md bg-sky-500/10 border border-sky-500/20 flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-sky-600 dark:bg-sky-400 shrink-0" />
                                        <span className="text-xs font-bold text-foreground truncate">
                                            Regional Projects
                                        </span>
                                    </div>
                                    <div className="flex items-baseline justify-between mt-1.5">
                                        <span className="text-lg font-bold text-foreground font-mono">{projectCount}</span>
                                        <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">{projectPct}%</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-0.5">Bishoftu, GERD II, Gibe II</span>
                                </div>

                                <div className="p-2.5 rounded-md bg-purple-500/10 border border-purple-500/20 flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
                                        <span className="text-xs font-bold text-foreground truncate">
                                            Head Office
                                        </span>
                                    </div>
                                    <div className="flex items-baseline justify-between mt-1.5">
                                        <span className="text-lg font-bold text-foreground font-mono">{headOfficeCount}</span>
                                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">{headOfficePct}%</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-0.5">Addis Ababa Central H.O.</span>
                                </div>
                            </div>

                            {/* Top Project Locations Chips */}
                            <div className="mt-3.5 pt-3 border-t border-border">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                    Active Deployment Locations
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {siteBreakdown && siteBreakdown.length > 0 ? (
                                        siteBreakdown.slice(0, 6).map((site) => (
                                            <span
                                                key={site.name}
                                                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-xs bg-muted border border-border text-foreground"
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${site.is_head_office ? 'bg-purple-600 dark:bg-purple-400' : 'bg-sky-600 dark:bg-sky-400'}`} />
                                                <span className="font-semibold">{site.name}</span>
                                                <span className="text-muted-foreground font-mono">({site.count})</span>
                                            </span>
                                        ))
                                    ) : (
                                        <>
                                            <span className="text-[11px] px-2 py-0.5 rounded-xs bg-muted border border-border">Gilgel Gibe II (64)</span>
                                            <span className="text-[11px] px-2 py-0.5 rounded-xs bg-muted border border-border">GERD II (55)</span>
                                            <span className="text-[11px] px-2 py-0.5 rounded-xs bg-muted border border-border">Bishoftu Airport (42)</span>
                                            <span className="text-[11px] px-2 py-0.5 rounded-xs bg-muted border border-border">ICT Park (16)</span>
                                            <span className="text-[11px] px-2 py-0.5 rounded-xs bg-muted border border-border">Chaka (14)</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Executive Takeaway */}
                            <p className="mt-3 text-[11px] text-muted-foreground bg-muted p-2 rounded-xs border border-border leading-relaxed">
                                <strong>Management Rationale:</strong> As an engineering &amp; construction PLC, management has 24/7 visibility into operational mobilization — ensuring regional projects have adequate engineering manpower while monitoring Head Office administrative overhead and field allowance budgets.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Chart 3: Employment Tenure & Statutory Stability */}
                <Card className="border-border bg-card shadow-xs flex flex-col justify-between">
                    <CardHeader className="pb-3 border-b border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-md bg-muted text-primary flex items-center justify-center shrink-0 border border-border">
                                    <Shield className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base text-foreground font-bold">
                                            Employment Tenure &amp; Stability
                                        </CardTitle>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold bg-muted text-primary border-border">
                                            Proc. No. 1156/2019
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        Statutory tenure distribution, permanence ratio, and contract pipeline
                                    </CardDescription>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20 hidden sm:inline-block font-mono">
                                {permPct}% Permanent
                            </span>
                        </div>
                    </CardHeader>

                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                            {/* Multi-Segment Stacked Progress Gauge */}
                            <div className="mt-2 mb-4">
                                <div className="flex justify-between items-center text-xs mb-1.5">
                                    <span className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground">
                                        Statutory Roster Composition
                                    </span>
                                    <span className="font-mono text-xs text-muted-foreground">
                                        {permCount} Perm / {probCount} Prob / {contCount} Cont
                                    </span>
                                </div>

                                {/* Visual Stacked Bar */}
                                <div className="h-6 w-full rounded-md overflow-hidden flex bg-accent p-0.5 border border-border">
                                    <div
                                        style={{ width: `${permPct}%` }}
                                        className="bg-blue-600 dark:bg-blue-500 h-full rounded-xs transition-all duration-500 relative group cursor-pointer"
                                        title={`Permanent Roster: ${permCount} (${permPct}%)`}
                                    />
                                    <div
                                        style={{ width: `${probPct}%` }}
                                        className="bg-amber-500 dark:bg-amber-400 h-full rounded-xs ml-0.5 transition-all duration-500 relative group cursor-pointer"
                                        title={`Probationary Staff: ${probCount} (${probPct}%)`}
                                    />
                                    <div
                                        style={{ width: `${Math.max(Number(contPct), 1)}%` }}
                                        className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-xs ml-0.5 transition-all duration-500 relative group cursor-pointer"
                                        title={`Fixed-Term Contract: ${contCount} (${contPct}%)`}
                                    />
                                </div>
                            </div>

                            {/* 3 Statutory Status Blocks */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
                                {/* Permanent */}
                                <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/20 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-500 shrink-0" />
                                            <span className="text-xs font-bold text-foreground truncate">
                                                Permanent
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Statutory Core Roster</p>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-blue-500/20 flex items-baseline justify-between">
                                        <span className="text-lg font-bold text-foreground font-mono">{permCount}</span>
                                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{permPct}%</span>
                                    </div>
                                </div>

                                {/* Probation */}
                                <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0" />
                                            <span className="text-xs font-bold text-foreground truncate">
                                                Probation
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">60-Day Review Pipeline</p>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-baseline justify-between">
                                        <span className="text-lg font-bold text-foreground font-mono">{probCount}</span>
                                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{probPct}%</span>
                                    </div>
                                </div>

                                {/* Contract */}
                                <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500 shrink-0" />
                                            <span className="text-xs font-bold text-foreground truncate">
                                                Contract
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Fixed-Term Projects</p>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-baseline justify-between">
                                        <span className="text-lg font-bold text-foreground font-mono">{contCount}</span>
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{contPct}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Proclamation Compliance Status */}
                            <div className="mt-3.5 p-2.5 rounded-md bg-accent border border-border flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Statutory Compliance Status</span>
                                <span className="font-bold text-primary inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Fully Documented
                                </span>
                            </div>
                        </div>

                        {/* Executive Takeaway */}
                        <p className="mt-3 text-[11px] text-muted-foreground bg-muted p-2 rounded-xs border border-border leading-relaxed">
                            <strong>Legal Alignment:</strong> Under Ethiopian Labour Proclamation No. 1156/2019, tracking the ratio of permanent staff versus probation/contract hires is essential for statutory compliance, contract renewal forecasting, and measuring workforce stability.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Workforce Distribution by Department Card featuring Shadcn Bar Chart (All Operational Units) */}
            <Card className="border-border bg-card shadow-xs">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-muted text-primary flex items-center justify-center shrink-0 border border-border">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base text-foreground font-bold">
                                    Workforce by Department
                                </CardTitle>
                                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-xs border border-primary/20 shrink-0">
                                    All {departmentBreakdown.length} Operational Units
                                </span>
                            </div>
                            <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                Complete headcount concentration and personnel allocation across all active organizational units
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <span className="text-xs font-bold text-foreground font-mono block">
                                {allDeptsTotalEmployees} / {metrics.total_active} Staff
                            </span>
                            <span className="text-[11px] text-primary font-semibold block">
                                100% Active Workforce
                            </span>
                        </div>
                        <Link href={route('employees.index')}>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold text-primary border-border">
                                <span>Directory</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Shadcn Recharts Horizontal Bar Chart (All Operational Units) */}
                        <div className="lg:col-span-8 flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                                <span className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
                                    Headcount by Division ({departmentBreakdown.length} Operational Units)
                                </span>
                                <span className="text-[11px]">
                                    Hover bars for detailed percentage share
                                </span>
                            </div>

                            <ChartContainer config={departmentChartConfig} className="aspect-auto h-[480px] w-full">
                                <BarChart
                                    data={departmentChartData}
                                    layout="vertical"
                                    margin={{ top: 8, right: 80, left: 10, bottom: 8 }}
                                >
                                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
                                    <XAxis
                                        type="number"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', fontWeight: 600 }}
                                        width={185}
                                    />
                                    <ChartTooltip
                                        cursor={{ fill: 'rgba(100, 116, 139, 0.12)' }}
                                        content={
                                            <ChartTooltipContent
                                                indicator="dot"
                                                formatter={(value, name, item) => (
                                                    <div className="flex items-center justify-between gap-4 w-full">
                                                        <span className="text-muted-foreground">Active Staff:</span>
                                                        <span className="font-bold text-foreground font-mono">
                                                            {value} ({item.payload.percentage}%)
                                                        </span>
                                                    </div>
                                                )}
                                            />
                                        }
                                    />
                                    <Bar
                                        dataKey="employees_count"
                                        radius={[0, 6, 6, 0]}
                                        barSize={18}
                                    >
                                        {departmentChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                        <LabelList
                                            dataKey="employees_count"
                                            position="right"
                                            formatter={(val: any) => `${val} staff`}
                                            className="text-xs font-bold font-mono"
                                            fill="hsl(var(--muted-foreground))"
                                        />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </div>

                        {/* Breakdown Summary Side Panel (All Units) */}
                        <div className="lg:col-span-4 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-8 space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        All {departmentBreakdown.length} Unit Rankings
                                    </span>
                                    <span className="text-[11px] text-muted-foreground font-medium">
                                        Share of {metrics.total_active} Staff
                                    </span>
                                </div>
                                <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                                    {departmentChartData.map((dept, index) => (
                                        <div
                                            key={dept.id}
                                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-[10px] font-bold font-mono w-5 text-muted-foreground">
                                                    #{index + 1}
                                                </span>
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: dept.fill }}
                                                />
                                                <span className="text-xs font-bold text-foreground truncate" title={dept.name}>
                                                    {dept.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0 text-xs pl-2">
                                                <span className="font-bold text-foreground font-mono">{dept.employees_count}</span>
                                                <span className="text-muted-foreground text-[10px] font-medium">({dept.percentage}%)</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Key Takeaway Callout */}
                            <div className="p-3.5 rounded-md bg-muted border border-border text-xs">
                                <div className="flex items-center gap-1.5 text-primary font-bold text-[11px] uppercase tracking-wider mb-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Engineering Core Weighting</span>
                                </div>
                                <p className="text-foreground leading-relaxed">
                                    <strong>{top2Depts[0]?.name ?? 'Construction & Engineering'}</strong> ({top2Depts[0]?.employees_count ?? 0} staff) and <strong>{top2Depts[1]?.name ?? 'P&ED'}</strong> ({top2Depts[1]?.employees_count ?? 0} staff) form the operational engineering backbone, accounting for <strong>{top2Pct}%</strong> of all personnel across active infrastructure projects.
                                </p>
                            </div>

                            <div>
                                <Link href={route('employees.index')}>
                                    <Button variant="outline" className="w-full text-xs font-semibold text-primary border-border">
                                        View All Departments &amp; Units
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Discrepancy Action Confirmation Dialog */}
            <AlertDialog open={Boolean(reviewConfirm)} onOpenChange={(open) => !open && setReviewConfirm(null)}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                            {reviewConfirm?.status === 'Approved' ? (
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                            )}
                            {reviewConfirm?.status} Employee Discrepancy Report?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
                            <p>
                                Are you sure you want to mark this correction request as <strong className="text-foreground">{reviewConfirm?.status}</strong>?
                            </p>
                            {reviewConfirm?.status === 'Approved' ? (
                                <p className="bg-primary/10 border border-primary/20 p-2.5 rounded-sm text-primary font-medium text-[11px]">
                                    Approving will apply the requested modification directly to the employee's master record and notify the employee in their self-service portal.
                                </p>
                            ) : (
                                <p className="bg-destructive/10 border border-destructive/20 p-2.5 rounded-sm text-destructive font-medium text-[11px]">
                                    Rejecting will close the report without altering the employee's profile.
                                </p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="text-xs h-9 border-border hover:bg-accent">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDiscrepancyReview}
                            className={`text-xs h-9 text-white font-bold ${
                                reviewConfirm?.status === 'Approved'
                                    ? 'bg-primary hover:bg-primary/90'
                                    : 'bg-destructive hover:bg-destructive/90'
                            }`}
                        >
                            Confirm {reviewConfirm?.status}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthenticatedLayout>
    );
}
