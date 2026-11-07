import { useRef, useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InteractiveTour, { TourStep } from '@/Components/InteractiveTour';
import EmployeeAvatar from '@/Components/EmployeeAvatar';
import { formatEthPhone } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
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
    ArrowLeft, 
    Calendar, 
    Clock, 
    CreditCard, 
    Building2, 
    MapPin, 
    User, 
    Phone, 
    ShieldCheck, 
    AlertCircle, 
    FileText, 
    HeartHandshake,
    Landmark,
    Award,
    CheckCircle2,
    Edit,
    Camera,
    Trash2,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    Briefcase,
    GraduationCap,
    TrendingUp,
    Car,
    FileCheck,
    Receipt,
    ExternalLink
} from 'lucide-react';

interface Employee {
    id: number;
    file_no: string;
    employee_id_no?: string;
    full_name: string;
    profile_photo_url?: string | null;
    profile_photo_path?: string | null;
    gender: 'Male' | 'Female';
    education_status?: string;
    institution?: string;
    graduation_year_ec?: string;
    professional_license?: string;
    cost_sharing_status?: string;
    position: string;
    work_place: string;
    age?: number;
    company_experience?: string;
    previous_experience?: string;
    total_experience?: string;
    performance_score_round_1?: string;
    performance_score_round_2?: string;
    disciplinary_action?: string;
    employment_type: string;
    contract_type: string;
    employment_date_ec: string;
    employment_date: string;
    birth_date_ec?: string;
    birth_date?: string;
    probation_end_date?: string;
    probation_status: string;
    retirement_date?: string;
    status: 'Permanent' | 'Contract' | 'Probation' | 'Separated';
    grade?: string;
    step?: string;
    social_security_no?: string;
    poessa_no?: string;
    psssa_no?: string;
    plate_number?: string;
    marital_status?: string;
    phone?: string;
    email?: string;
    region?: string;
    city?: string;
    sub_city?: string;
    woreda?: string;
    house_no?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    tin_no?: string;
    bank_name?: string;
    bank_account_no?: string;
    remarks?: string;
    department?: { id: number; name: string };
    separation?: {
        id?: number;
        separation_type: string;
        effective_date: string;
        termination_date_ec?: string;
        reason?: string;
        completed_years_service?: number;
    };
    current_salary?: {
        basic_salary: number;
        responsibility_allowance: number;
        project_allowance: number;
        position_allowance: number;
        daily_allowance?: number;
        desert_allowance?: number;
        hardship_allowance: number;
        transport_allowance: number;
        house_allowance: number;
        food_allowance: number;
        mobile_allowance: number;
        fuel_allowance_litres?: number;
        fuel_allowance_amount?: number;
        perdiem?: number;
        monthly_perdiem?: number;
        other_allowance: number;
        total_salary: number;
        taxable_salary: number;
        income_tax: number;
        pension_employee: number;
        pension_company: number;
        total_deductions: number;
        net_salary?: number;
    };
    leave_balances?: {
        leave_year: number;
        annual_entitlement: number;
        remaining_days: number;
    }[];
}

interface Props {
    employee: Employee;
    tenure: {
        years: number;
        months: number;
        days: number;
        formatted: string;
    };
    annualLeaveEntitlement: number;
    retirementInfo?: {
        retirement_date: string;
        days_remaining: number;
        is_near: boolean;
        is_retired?: boolean;
        status_label?: string;
    };
}

const employeeDetailTourSteps: TourStep[] = [
    {
        target: '[data-tour="identity-card"]',
        title: 'Personnel identity',
        content: 'Profile photo, tripartite full name, copyable File No, official department, and workplace deployment.',
        placement: 'right',
    },
    {
        target: '[data-tour="quick-identifiers"]',
        title: 'Quick-copy identifiers',
        content: 'Direct 1-click clipboard copy for CBE bank account, TIN, POESSA pension number, phone, and emergency contact.',
        placement: 'right',
    },
    {
        target: '[data-tour="dossier-tabs"]',
        title: '3 unified workspaces',
        content: 'Access career progression, itemized payroll calculations & deductions, and statutory Proclamation 1156 leave and retirement records.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="dossier-actions"]',
        title: 'Dossier actions',
        content: 'Generate a clean 1-page A4 executive summary slip or modify employee records.',
        placement: 'bottom',
    },
];

export default function Show({ employee, tenure, annualLeaveEntitlement, retirementInfo }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [deletePhotoOpen, setDeletePhotoOpen] = useState(false);
    const [remarksExpanded, setRemarksExpanded] = useState(Boolean(employee.remarks));
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [isTourOpen, setIsTourOpen] = useState(false);

    useEffect(() => {
        const handleOpenTour = () => setIsTourOpen(true);
        window.addEventListener('open-employee-detail-tour', handleOpenTour);

        if (typeof window !== 'undefined' && window.location.search.includes('tour=true')) {
            setIsTourOpen(true);
        }

        return () => {
            window.removeEventListener('open-employee-detail-tour', handleOpenTour);
        };
    }, []);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        setIsUploading(true);
        router.post(route('employees.photo.store', employee.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const handleDeletePhoto = () => {
        setDeletePhotoOpen(true);
    };

    const confirmDeletePhoto = () => {
        router.delete(route('employees.photo.destroy', employee.id), {
            preserveScroll: true,
            onFinish: () => setDeletePhotoOpen(false),
        });
    };

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(label);
        toast.success(`Copied ${label} to clipboard`);
        setTimeout(() => setCopiedKey(null), 1800);
    };

    const formatCurrency = (val?: number) => {
        if (!val || val <= 0) return '0.00 ETB';
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2,
        }).format(val);
    };

    const salary = employee.current_salary;

    const displayCompanyExp = employee.company_experience && !employee.company_experience.startsWith('=') && !employee.company_experience.includes('DATEDIF') && !employee.company_experience.includes('Year,')
        ? employee.company_experience
        : (tenure?.formatted || '—');

    const displayTotalExp = employee.total_experience && !employee.total_experience.startsWith('=') && !employee.total_experience.includes('DATEDIF') && !employee.total_experience.includes('Year,')
        ? employee.total_experience
        : (employee.previous_experience ? `${employee.previous_experience} + ${displayCompanyExp}` : displayCompanyExp);

    const getStatusBadge = (empStatus: string) => {
        switch (empStatus) {
            case 'Permanent':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Permanent Staff
                    </span>
                );
            case 'Contract':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                        Fixed-Term Contract
                    </span>
                );
            case 'Probation':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        Under Probation
                    </span>
                );
            case 'Separated':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-muted text-muted-foreground border border-border">
                        Separated / Archived
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-muted text-foreground border border-border">
                        {empStatus}
                    </span>
                );
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`${employee.full_name} (${employee.file_no}) - Personnel Dossier`} />

            {/* Print Stylesheet */}
            <style>{`
                @media print {
                    header, nav, aside, .no-print, button { display: none !important; }
                    body { background: white !important; color: black !important; font-size: 11pt !important; }
                    .print-full { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
                }
            `}</style>

            {/* Top Navigation & Action Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 no-print">
                <div className="flex items-center gap-3">
                    <Link href={route('employees.index')}>
                        <Button variant="outline" size="sm" className="h-9 gap-2 text-sm font-medium text-muted-foreground hover:text-foreground border-border bg-card shadow-2xs">
                            <ArrowLeft className="w-4 h-4" /> Back to Directory
                        </Button>
                    </Link>
                    <span className="text-sm text-muted-foreground hidden sm:inline">/</span>
                    <span className="text-sm font-medium text-foreground truncate max-w-[240px] hidden sm:inline">
                        {employee.full_name}
                    </span>
                </div>

                <div data-tour="dossier-actions" className="flex items-center gap-2.5 self-end sm:self-auto">
                    <Link href={route('employees.edit', employee.id)}>
                        <Button size="sm" className="h-9 text-sm font-semibold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs">
                            <Edit className="w-4 h-4" />
                            <span>Edit Profile</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Master-Detail 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* =========================================================================
                    LEFT COLUMN (lg:col-span-4): Persistent Identity & Quick-Access Anchor
                   ========================================================================= */}
                <div className="lg:col-span-4 space-y-5">
                    {/* Primary Identity Card */}
                    <Card data-tour="identity-card" className="border-border bg-card shadow-xs rounded-xl p-6 relative overflow-hidden">
                        <div className="flex flex-col items-center text-center">
                            {/* Avatar with Photo Upload / Delete Overlay */}
                            <div className="relative group mb-4">
                                <EmployeeAvatar
                                    name={employee.full_name}
                                    src={employee.profile_photo_url}
                                    size="2xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    title="Upload new portrait photo"
                                    className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer no-print"
                                >
                                    <Camera className="w-5 h-5" />
                                    <span className="text-xs font-semibold mt-1">{isUploading ? 'Uploading...' : 'Change'}</span>
                                </button>
                                {employee.profile_photo_url && (
                                    <button
                                        type="button"
                                        onClick={handleDeletePhoto}
                                        title="Remove portrait photo"
                                        className="absolute -bottom-1 -right-1 bg-background p-1.5 rounded-full border border-border text-destructive hover:bg-destructive/10 shadow-xs transition-colors cursor-pointer no-print"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/png,image/jpeg,image/webp,image/jpg"
                                    onChange={handlePhotoChange}
                                />
                            </div>

                            {/* Full Name & File No Badge */}
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
                                {employee.full_name}
                            </h1>
                            <div className="flex items-center gap-2 mt-2 mb-3.5">
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(employee.file_no, 'File No')}
                                    title="Click to copy File No"
                                    className="font-mono text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 cursor-pointer"
                                >
                                    <span>{employee.file_no}</span>
                                    {copiedKey === 'File No' ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <Copy className="w-3 h-3 text-primary/70" />
                                    )}
                                </button>
                                <span className="text-sm text-muted-foreground">&bull;</span>
                                <span className="text-sm text-muted-foreground font-medium">{employee.gender}</span>
                            </div>

                            {/* Status Badge */}
                            <div className="mb-4">
                                {getStatusBadge(employee.status)}
                            </div>

                            {/* Department & Workplace Anchor */}
                            <div className="w-full pt-4 border-t border-border/70 space-y-3 text-sm text-left">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" /> Department
                                    </span>
                                    <span className="font-semibold text-foreground truncate max-w-[190px] text-right">
                                        {employee.department?.name || 'General Operations'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" /> Position
                                    </span>
                                    <span className="font-semibold text-foreground truncate max-w-[190px] text-right">
                                        {employee.position}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" /> Workplace
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                                        <span className={`w-2 h-2 rounded-full ${
                                            employee.work_place.toLowerCase().includes('head') || employee.work_place.includes('H.O') 
                                                ? 'bg-purple-600 dark:bg-purple-400' 
                                                : 'bg-sky-600 dark:bg-sky-400'
                                        }`} />
                                        {employee.work_place}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Quick-Copy Legal, Financial & Contact IDs Card */}
                    <Card data-tour="quick-identifiers" className="border-border bg-card shadow-xs rounded-xl p-5 space-y-4 text-sm">
                        <div className="flex items-center justify-between pb-2.5 border-b border-border/70">
                            <span className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
                                Direct Identifiers
                            </span>
                            <span className="text-xs text-muted-foreground">Click to copy</span>
                        </div>

                        {/* Telephone */}
                        {employee.phone ? (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-muted-foreground" /> Phone
                                </span>
                                <div className="flex items-center gap-2">
                                    <a href={`tel:${employee.phone}`} className="font-mono text-primary font-semibold hover:underline text-sm">
                                        {formatEthPhone(employee.phone)}
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(employee.phone || '', 'Phone')}
                                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                                        title="Copy phone"
                                    >
                                        {copiedKey === 'Phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between text-muted-foreground text-sm">
                                <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> Phone</span>
                                <span>No phone on file</span>
                            </div>
                        )}

                        {/* Bank Account */}
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2 text-sm">
                                <Landmark className="w-4 h-4 text-muted-foreground" /> Bank (CBE)
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-foreground text-sm">
                                    {employee.bank_account_no || '—'}
                                </span>
                                {employee.bank_account_no && (
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(employee.bank_account_no || '', 'Bank Account')}
                                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                                        title="Copy bank account"
                                    >
                                        {copiedKey === 'Bank Account' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Tax Identification (TIN) */}
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2 text-sm">
                                <Receipt className="w-4 h-4 text-muted-foreground" /> TIN Number
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-foreground text-sm">
                                    {employee.tin_no || '—'}
                                </span>
                                {employee.tin_no && (
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(employee.tin_no || '', 'TIN')}
                                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                                        title="Copy TIN"
                                    >
                                        {copiedKey === 'TIN' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* POESSA Pension No */}
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2 text-sm">
                                <ShieldCheck className="w-4 h-4 text-muted-foreground" /> POESSA ID
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-foreground text-sm">
                                    {employee.poessa_no || employee.psssa_no || '—'}
                                </span>
                                {(employee.poessa_no || employee.psssa_no) && (
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(employee.poessa_no || employee.psssa_no || '', 'Pension ID')}
                                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                                        title="Copy Pension ID"
                                    >
                                        {copiedKey === 'Pension ID' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Emergency Next-of-Kin Contact */}
                    <Card className="border-border bg-card shadow-xs rounded-xl p-5 space-y-3.5 text-sm">
                        <div className="flex items-center gap-2 pb-2.5 border-b border-border/70">
                            <HeartHandshake className="w-4.5 h-4.5 text-primary" />
                            <span className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
                                Emergency Contact
                            </span>
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-sm">Full Name:</span>
                                <span className="font-semibold text-foreground text-sm">{employee.emergency_contact_name || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-sm">Relationship:</span>
                                <span className="font-medium text-foreground text-sm">{employee.emergency_contact_relationship || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-sm">Emergency Phone:</span>
                                <span className="font-mono font-semibold text-primary text-sm">{employee.emergency_contact_phone || '—'}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* =========================================================================
                    RIGHT COLUMN (lg:col-span-8): 3 Rich Workspaces (Linear/Apple Quality)
                   ========================================================================= */}
                <div className="lg:col-span-8 space-y-6">
                    <Tabs defaultValue="career" className="w-full">
                        {/* 3 Unified Tabs (Table / Grid Segmented Navigation) */}
                        <TabsList data-tour="dossier-tabs" className="w-full grid grid-cols-1 sm:grid-cols-3 p-1.5 bg-muted/60 dark:bg-muted/30 border border-border/80 rounded-xl mb-6 gap-1.5 h-auto">
                            <TabsTrigger value="career" className="text-xs sm:text-sm font-medium py-2.5 px-3 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs transition-all">
                                <Briefcase className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                                <span>Career &amp; Assignment</span>
                            </TabsTrigger>
                            <TabsTrigger value="payroll" className="text-xs sm:text-sm font-medium py-2.5 px-3 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs transition-all">
                                <CreditCard className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                                <span>Compensation &amp; Payroll</span>
                            </TabsTrigger>
                            <TabsTrigger value="statutory" className="text-xs sm:text-sm font-medium py-2.5 px-3 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs transition-all">
                                <Award className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                                <span>Tenure, Leave &amp; Statutory</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* -------------------------------------------------------------
                            TAB 1: CAREER & ASSIGNMENT (Table / Grid Style)
                           ------------------------------------------------------------- */}
                        <TabsContent value="career" className="space-y-6 focus-visible:outline-none">
                            {/* Contract & Position Specs */}
                            <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
                                <CardHeader className="py-4 px-6 border-b border-border/70">
                                    <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                                        Contractual Assignment &amp; Hierarchy
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                        Employment classification, grade, start dates, and vehicle mobilization
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-5">
                                    {/* Dual-Calendar Dates Banner */}
                                    <div className="p-4 rounded-xl bg-muted/30 border border-border/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                                                Date of Employment
                                            </span>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="font-mono font-bold text-primary text-base sm:text-lg">
                                                    {employee.employment_date_ec} E.C.
                                                </span>
                                                <span className="text-muted-foreground">&bull;</span>
                                                <span className="font-mono text-muted-foreground text-sm font-medium">
                                                    {employee.employment_date} G.C.
                                                </span>
                                            </div>
                                        </div>
                                        <div className="sm:text-right">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                                                Continuous Tenure
                                            </span>
                                            <span className="font-bold text-foreground text-base sm:text-lg mt-1.5 block">
                                                {tenure.formatted}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Itemized Career Specification Table */}
                                    <div className="border border-border/70 rounded-xl overflow-x-auto bg-card">
                                        <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[500px]">
                                            <tbody className="divide-y divide-border/60">
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 w-1/4 whitespace-nowrap">Job Grade</th>
                                                    <td className="py-3 px-4 font-bold text-foreground w-1/4">{employee.grade ? `Grade ${employee.grade}` : '—'}</td>
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 w-1/4 whitespace-nowrap border-l border-border/60">Step Progression</th>
                                                    <td className="py-3 px-4 font-bold text-foreground w-1/4">{employee.step ? `Step ${employee.step}` : '—'}</td>
                                                </tr>
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 whitespace-nowrap">Contract Type</th>
                                                    <td className="py-3 px-4 font-semibold text-foreground">{employee.contract_type}</td>
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 whitespace-nowrap border-l border-border/60">Employment Terms</th>
                                                    <td className="py-3 px-4 font-semibold text-foreground">{employee.employment_type}</td>
                                                </tr>
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 whitespace-nowrap">Official Workplace</th>
                                                    <td className="py-3 px-4 font-semibold text-foreground">{employee.work_place}</td>
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 whitespace-nowrap border-l border-border/60">Assigned Vehicle</th>
                                                    <td className="py-3 px-4 font-mono font-semibold text-primary">{employee.plate_number || 'None on file'}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Academic & Professional Licensing */}
                            <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
                                <CardHeader className="py-4 px-6 border-b border-border/70">
                                    <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2.5">
                                        <GraduationCap className="w-5 h-5 text-primary" />
                                        <span>Education, Certification &amp; Licensing</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="border border-border/70 rounded-xl overflow-x-auto bg-card">
                                        <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[500px]">
                                            <tbody className="divide-y divide-border/60">
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 w-1/4 whitespace-nowrap">Highest Qualification</th>
                                                    <td className="py-3 px-4 font-bold text-foreground w-1/4">{employee.education_status || '—'}</td>
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 w-1/4 whitespace-nowrap border-l border-border/60">Graduating Institution</th>
                                                    <td className="py-3 px-4 font-medium text-foreground w-1/4">{employee.institution || '—'}</td>
                                                </tr>
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 whitespace-nowrap">Graduation Year</th>
                                                    <td className="py-3 px-4 font-mono font-bold text-foreground">{employee.graduation_year_ec ? `${employee.graduation_year_ec} E.C.` : '—'}</td>
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 whitespace-nowrap border-l border-border/60">Cost Sharing Status</th>
                                                    <td className="py-3 px-4 font-medium text-foreground">{employee.cost_sharing_status || '—'}</td>
                                                </tr>
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 whitespace-nowrap">Professional License</th>
                                                    <td colSpan={3} className="py-3 px-4 font-bold text-primary">{employee.professional_license || 'None on file'}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Experience & Appraisal Scores */}
                            <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
                                <CardHeader className="py-4 px-6 border-b border-border/70">
                                    <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2.5">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                        <span>Work Experience &amp; Performance Record</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                        <div className="p-4 rounded-xl bg-muted/30 border border-border/70">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Company Tenure</span>
                                            <span className="font-bold text-foreground text-base sm:text-lg mt-1 block">{displayCompanyExp}</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-muted/30 border border-border/70">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Previous Outside Exp</span>
                                            <span className="font-bold text-foreground text-base sm:text-lg mt-1 block">{employee.previous_experience || '—'}</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-primary block">Total Career Experience</span>
                                            <span className="font-extrabold text-primary text-base sm:text-lg mt-1 block">{displayTotalExp}</span>
                                        </div>
                                    </div>

                                    {/* Performance Appraisal & Standing Table */}
                                    <div className="border border-border/70 rounded-xl overflow-x-auto bg-card">
                                        <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[500px]">
                                            <tbody className="divide-y divide-border/60">
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 w-1/4 whitespace-nowrap">Appraisal Score (Round 1)</th>
                                                    <td className="py-3 px-4 font-mono font-bold text-foreground w-1/4">{employee.performance_score_round_1 || '—'}</td>
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 w-1/4 whitespace-nowrap border-l border-border/60">Appraisal Score (Round 2)</th>
                                                    <td className="py-3 px-4 font-mono font-bold text-foreground w-1/4">{employee.performance_score_round_2 || '—'}</td>
                                                </tr>
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 whitespace-nowrap">Disciplinary Standing</th>
                                                    <td colSpan={3} className={`py-3 px-4 font-bold ${employee.disciplinary_action ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                        {employee.disciplinary_action || 'Clean Standing (No disciplinary actions)'}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Remarks / Personnel Notes */}
                            <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
                                <CardHeader 
                                    className="py-4 px-6 border-b border-border/70 flex flex-row items-center justify-between cursor-pointer hover:bg-muted/20"
                                    onClick={() => setRemarksExpanded(!remarksExpanded)}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm font-bold text-foreground">Personnel Notes &amp; Remarks</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                                        {remarksExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </Button>
                                </CardHeader>
                                {remarksExpanded && (
                                    <CardContent className="p-6 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                        {employee.remarks || (
                                            <span className="text-muted-foreground italic">
                                                No special personnel remarks logged for this employee record.
                                            </span>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        </TabsContent>

                        {/* -------------------------------------------------------------
                            TAB 2: COMPENSATION & PAYROLL (Table / Grid Style)
                           ------------------------------------------------------------- */}
                        <TabsContent value="payroll" className="space-y-6 focus-visible:outline-none">
                            {/* Executive Wage KPI Header */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-5 rounded-xl bg-card border border-border shadow-xs">
                                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground block">
                                        Total Monthly Gross
                                    </span>
                                    <span className="text-2xl sm:text-3xl font-mono font-bold text-foreground mt-1.5 block tabular-nums">
                                        {formatCurrency(salary?.total_salary || salary?.basic_salary)}
                                    </span>
                                    <span className="text-xs sm:text-sm text-muted-foreground mt-1 block">
                                        Basic: {formatCurrency(salary?.basic_salary)}
                                    </span>
                                </div>

                                <div className="p-5 rounded-xl bg-card border border-border shadow-xs">
                                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground block">
                                        Total Statutory Deductions
                                    </span>
                                    <span className="text-2xl sm:text-3xl font-mono font-bold text-destructive mt-1.5 block tabular-nums">
                                        {formatCurrency(salary?.total_deductions || 0)}
                                    </span>
                                    <span className="text-xs sm:text-sm text-muted-foreground mt-1 block">
                                        Tax + 7% Pension
                                    </span>
                                </div>

                                <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 shadow-xs">
                                    <span className="text-xs sm:text-sm font-semibold text-primary block">
                                        Net Take-Home Pay
                                    </span>
                                    <span className="text-2xl sm:text-3xl font-mono font-bold text-primary mt-1.5 block tabular-nums">
                                        {formatCurrency((salary?.total_salary || 0) - (salary?.total_deductions || 0))}
                                    </span>
                                    <span className="text-xs sm:text-sm text-primary/80 mt-1 block">
                                        Direct bank disbursement
                                    </span>
                                </div>
                            </div>

                            {/* Itemized Allowances Breakdown Card - Data Table */}
                            <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
                                <CardHeader className="py-4 px-6 border-b border-border/70">
                                    <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                                        Earnings &amp; Contractual Allowances
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                        Itemized monthly compensation breakdown based on role and site policies
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="border border-border/70 rounded-xl overflow-x-auto bg-card">
                                        <table className="w-full text-xs sm:text-sm text-left border-collapse">
                                            <thead className="bg-muted/40 border-b border-border/70">
                                                <tr>
                                                    <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Earnings Component</th>
                                                    <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider hidden sm:table-cell">Classification / Policy</th>
                                                    <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Monthly Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <td className="py-2.5 px-4 font-bold text-foreground">Contractual Basic Salary</td>
                                                    <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">Standard Contract Baseline</td>
                                                    <td className="py-2.5 px-4 font-mono font-bold text-primary text-right tabular-nums">{formatCurrency(salary?.basic_salary)}</td>
                                                </tr>
                                                {Number(salary?.responsibility_allowance) > 0 && (
                                                    <tr className="hover:bg-muted/20 transition-colors">
                                                        <td className="py-2.5 px-4 font-medium text-foreground">Responsibility Allowance</td>
                                                        <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">Executive / Duty Allowance</td>
                                                        <td className="py-2.5 px-4 font-mono font-semibold text-foreground text-right tabular-nums">{formatCurrency(salary?.responsibility_allowance)}</td>
                                                    </tr>
                                                )}
                                                {Number(salary?.project_allowance) > 0 && (
                                                    <tr className="hover:bg-muted/20 transition-colors">
                                                        <td className="py-2.5 px-4 font-medium text-foreground">Project Site Allowance</td>
                                                        <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">Field Project Deployment</td>
                                                        <td className="py-2.5 px-4 font-mono font-semibold text-foreground text-right tabular-nums">{formatCurrency(salary?.project_allowance)}</td>
                                                    </tr>
                                                )}
                                                {Number(salary?.position_allowance) > 0 && (
                                                    <tr className="hover:bg-muted/20 transition-colors">
                                                        <td className="py-2.5 px-4 font-medium text-foreground">Position / Title Allowance</td>
                                                        <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">Specialized Position Scope</td>
                                                        <td className="py-2.5 px-4 font-mono font-semibold text-foreground text-right tabular-nums">{formatCurrency(salary?.position_allowance)}</td>
                                                    </tr>
                                                )}
                                                {Number(salary?.house_allowance) > 0 && (
                                                    <tr className="hover:bg-muted/20 transition-colors">
                                                        <td className="py-2.5 px-4 font-medium text-foreground">Housing Allowance</td>
                                                        <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">Residential Facility Subsidy</td>
                                                        <td className="py-2.5 px-4 font-mono font-semibold text-foreground text-right tabular-nums">{formatCurrency(salary?.house_allowance)}</td>
                                                    </tr>
                                                )}
                                                {Number(salary?.transport_allowance) > 0 && (
                                                    <tr className="hover:bg-muted/20 transition-colors">
                                                        <td className="py-2.5 px-4 font-medium text-foreground">Transport Allowance</td>
                                                        <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">Commute &amp; Travel Subsidy</td>
                                                        <td className="py-2.5 px-4 font-mono font-semibold text-foreground text-right tabular-nums">{formatCurrency(salary?.transport_allowance)}</td>
                                                    </tr>
                                                )}
                                                {Number(salary?.hardship_allowance) > 0 && (
                                                    <tr className="hover:bg-muted/20 transition-colors">
                                                        <td className="py-2.5 px-4 font-medium text-foreground">Hardship Allowance</td>
                                                        <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">Regional Hardship Factor</td>
                                                        <td className="py-2.5 px-4 font-mono font-semibold text-foreground text-right tabular-nums">{formatCurrency(salary?.hardship_allowance)}</td>
                                                    </tr>
                                                )}
                                                {Number(salary?.food_allowance) > 0 && (
                                                    <tr className="hover:bg-muted/20 transition-colors">
                                                        <td className="py-2.5 px-4 font-medium text-foreground">Food Allowance</td>
                                                        <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">Meal &amp; Subsistence Stipend</td>
                                                        <td className="py-2.5 px-4 font-mono font-semibold text-foreground text-right tabular-nums">{formatCurrency(salary?.food_allowance)}</td>
                                                    </tr>
                                                )}
                                                {Number(salary?.mobile_allowance) > 0 && (
                                                    <tr className="hover:bg-muted/20 transition-colors">
                                                        <td className="py-2.5 px-4 font-medium text-foreground">Mobile Allowance</td>
                                                        <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">Airtime &amp; Telecommunication</td>
                                                        <td className="py-2.5 px-4 font-mono font-semibold text-foreground text-right tabular-nums">{formatCurrency(salary?.mobile_allowance)}</td>
                                                    </tr>
                                                )}
                                                {Number(salary?.fuel_allowance_amount) > 0 && (
                                                    <tr className="hover:bg-muted/20 transition-colors">
                                                        <td className="py-2.5 px-4 font-medium text-foreground">Fuel Allowance</td>
                                                        <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">
                                                            Fuel Consumption {salary?.fuel_allowance_litres ? `(${salary.fuel_allowance_litres} Litres)` : ''}
                                                        </td>
                                                        <td className="py-2.5 px-4 font-mono font-semibold text-foreground text-right tabular-nums">{formatCurrency(salary?.fuel_allowance_amount)}</td>
                                                    </tr>
                                                )}
                                                {Number(salary?.perdiem) > 0 && (
                                                    <tr className="hover:bg-muted/20 transition-colors">
                                                        <td className="py-2.5 px-4 font-medium text-foreground">Field Perdiem</td>
                                                        <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">Project Site Field Duty</td>
                                                        <td className="py-2.5 px-4 font-mono font-semibold text-foreground text-right tabular-nums">{formatCurrency(salary?.perdiem)}</td>
                                                    </tr>
                                                )}
                                                {Number(salary?.other_allowance) > 0 && (
                                                    <tr className="hover:bg-muted/20 transition-colors">
                                                        <td className="py-2.5 px-4 font-medium text-foreground">Other Allowance</td>
                                                        <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">Miscellaneous Policy</td>
                                                        <td className="py-2.5 px-4 font-mono font-semibold text-foreground text-right tabular-nums">{formatCurrency(salary?.other_allowance)}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            <tfoot className="bg-muted/30 border-t border-border/70 font-semibold">
                                                <tr>
                                                    <td className="py-3 px-4 font-bold text-foreground text-xs uppercase" colSpan={2}>Total Monthly Gross Earnings</td>
                                                    <td className="py-3 px-4 font-mono font-extrabold text-foreground text-right text-base tabular-nums">
                                                        {formatCurrency(salary?.total_salary || salary?.basic_salary)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Statutory Deductions & Employer Contributions Card - Data Table */}
                            <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
                                <CardHeader className="py-4 px-6 border-b border-border/70">
                                    <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                                        Statutory Tax &amp; Pension Obligations
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                        Ethiopian progressive income tax bands and statutory pension schemes
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="border border-border/70 rounded-xl overflow-x-auto bg-card">
                                        <table className="w-full text-xs sm:text-sm text-left border-collapse">
                                            <thead className="bg-muted/40 border-b border-border/70">
                                                <tr>
                                                    <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Statutory Obligation</th>
                                                    <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider hidden sm:table-cell">Legal Mandate</th>
                                                    <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Amount (ETB)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <td className="py-2.5 px-4 font-medium text-foreground">Taxable Salary Base</td>
                                                    <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">Proclamation 979/2016 Tax Base</td>
                                                    <td className="py-2.5 px-4 font-mono font-semibold text-foreground text-right tabular-nums">{formatCurrency(salary?.taxable_salary)}</td>
                                                </tr>
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <td className="py-2.5 px-4 font-medium text-foreground">Employment Income Tax</td>
                                                    <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">Progressive Statutory Withholding</td>
                                                    <td className="py-2.5 px-4 font-mono font-bold text-destructive text-right tabular-nums">{formatCurrency(salary?.income_tax)}</td>
                                                </tr>
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <td className="py-2.5 px-4 font-medium text-foreground">Pension Contribution - Employee (7%)</td>
                                                    <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">POESSA / PSSSA Mandatory Deduction</td>
                                                    <td className="py-2.5 px-4 font-mono font-bold text-destructive text-right tabular-nums">{formatCurrency(salary?.pension_employee)}</td>
                                                </tr>
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <td className="py-2.5 px-4 font-medium text-foreground">Pension Contribution - Company (11%)</td>
                                                    <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell text-xs">Employer Statutory Contribution</td>
                                                    <td className="py-2.5 px-4 font-mono font-bold text-primary text-right tabular-nums">{formatCurrency(salary?.pension_company)}</td>
                                                </tr>
                                            </tbody>
                                            <tfoot className="bg-muted/30 border-t border-border/70 font-semibold">
                                                <tr>
                                                    <td className="py-3 px-4 font-bold text-foreground text-xs uppercase" colSpan={2}>Total Statutory Burden (Employee + Company)</td>
                                                    <td className="py-3 px-4 font-mono font-extrabold text-foreground text-right text-base tabular-nums">
                                                        {formatCurrency((salary?.pension_employee || 0) + (salary?.pension_company || 0) + (salary?.income_tax || 0))}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* -------------------------------------------------------------
                            TAB 3: TENURE, LEAVE & STATUTORY REST (Table / Grid Style)
                           ------------------------------------------------------------- */}
                        <TabsContent value="statutory" className="space-y-6 focus-visible:outline-none">
                            {/* Annual Leave Statutory Card - Table */}
                            <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
                                <CardHeader className="py-4 px-6 border-b border-border/70 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2.5">
                                            <Award className="w-5 h-5 text-primary" />
                                            <span>Annual Leave Entitlement (Labour Proc. 1156/2019)</span>
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                            Statutory formula: 16 working days for year 1 + 1 day per 2 additional years
                                        </CardDescription>
                                    </div>
                                    <Link href={route('leave.index')}>
                                        <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm border-border gap-1.5 font-medium text-primary">
                                            <span>Leave Ledger</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="border border-border/70 rounded-xl overflow-x-auto bg-card">
                                        <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[500px]">
                                            <tbody className="divide-y divide-border/60">
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 w-1/4 whitespace-nowrap">Baseline Entitlement</th>
                                                    <td className="py-3 px-4 font-mono font-bold text-foreground w-1/4">16.0 Working Days (Year 1)</td>
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 w-1/4 whitespace-nowrap border-l border-border/60">Tenure Bonus Days</th>
                                                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 w-1/4">+{Math.max(0, annualLeaveEntitlement - 16)} Days (1 day / 2 yrs)</td>
                                                </tr>
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 whitespace-nowrap">Verified Service Years</th>
                                                    <td className="py-3 px-4 font-semibold text-foreground">{tenure.years} full years completed</td>
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 whitespace-nowrap border-l border-border/60">Statutory Governing Law</th>
                                                    <td className="py-3 px-4 text-xs text-muted-foreground">Ethiopian Labour Proc. 1156/2019 (Arts. 77–78)</td>
                                                </tr>
                                                <tr className="bg-primary/5 hover:bg-primary/10 transition-colors">
                                                    <th scope="row" className="py-3.5 px-4 font-bold text-primary uppercase text-xs">Total Active Annual Leave</th>
                                                    <td colSpan={3} className="py-3.5 px-4 font-mono font-extrabold text-primary text-lg sm:text-xl">
                                                        {annualLeaveEntitlement} Working Days
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Statutory Retirement Status - Table */}
                            <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
                                <CardHeader className="py-4 px-6 border-b border-border/70">
                                    <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                                        Statutory Retirement Forecast
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                        Based on 60 years statutory retirement milestone under Ethiopian public/private pensions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="border border-border/70 rounded-xl overflow-x-auto bg-card">
                                        <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[500px]">
                                            <tbody className="divide-y divide-border/60">
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 w-1/4 whitespace-nowrap">Date of Birth (E.C.)</th>
                                                    <td className="py-3 px-4 font-mono font-bold text-foreground w-1/4">{employee.birth_date_ec ? `${employee.birth_date_ec} E.C.` : 'Not on file'}</td>
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 w-1/4 whitespace-nowrap border-l border-border/60">Calculated Age</th>
                                                    <td className="py-3 px-4 font-extrabold text-primary w-1/4">{employee.age ? `${employee.age} Years Old` : '—'}</td>
                                                </tr>
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 whitespace-nowrap">Retirement Target Date</th>
                                                    <td className="py-3 px-4 font-mono font-bold text-foreground">{retirementInfo?.retirement_date || 'Calculated on DOB'}</td>
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 whitespace-nowrap border-l border-border/60">Remaining Service Time</th>
                                                    <td className="py-3 px-4 font-semibold text-foreground">
                                                        {retirementInfo ? (retirementInfo.is_retired ? 'Statutory age reached (60 yrs)' : `${Math.round(retirementInfo.days_remaining / 365)} years (${retirementInfo.days_remaining} days)`) : '—'}
                                                    </td>
                                                </tr>
                                                <tr className="hover:bg-muted/20 transition-colors">
                                                    <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-muted/25 whitespace-nowrap">Current Standing</th>
                                                    <td colSpan={3} className="py-3 px-4">
                                                        <Badge className="text-xs px-3 py-1 font-semibold" variant={retirementInfo?.is_retired ? 'destructive' : (retirementInfo?.is_near ? 'outline' : 'secondary')}>
                                                            {retirementInfo?.status_label || (retirementInfo?.is_retired ? 'Retired' : 'Active (Not Retired)')}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Termination / Separation Record (If Separated) */}
                            {(employee.status === 'Separated' || employee.separation) && (
                                <Card className="border-destructive/30 bg-destructive/5 shadow-xs rounded-xl overflow-hidden">
                                    <CardHeader className="py-4 px-6 border-b border-destructive/20">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base sm:text-lg font-bold text-destructive flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5" />
                                                <span>Official Termination &amp; Separation Record</span>
                                            </CardTitle>
                                            <Badge variant="destructive" className="text-xs px-2.5 py-0.5">Archived</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="border border-destructive/25 rounded-xl overflow-x-auto bg-card">
                                            <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[500px]">
                                                <tbody className="divide-y divide-destructive/20">
                                                    <tr className="hover:bg-destructive/5 transition-colors">
                                                        <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-destructive/5 w-1/4 whitespace-nowrap">Termination Date (E.C.)</th>
                                                        <td className="py-3 px-4 font-mono font-bold text-destructive w-1/4">{employee.separation?.termination_date_ec || '—'} E.C.</td>
                                                        <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-destructive/5 w-1/4 whitespace-nowrap border-l border-destructive/20">Gregorian Equivalent</th>
                                                        <td className="py-3 px-4 font-mono font-medium text-foreground w-1/4">{employee.separation?.effective_date || '—'}</td>
                                                    </tr>
                                                    <tr className="hover:bg-destructive/5 transition-colors">
                                                        <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-destructive/5 whitespace-nowrap">Separation Classification</th>
                                                        <td className="py-3 px-4 font-semibold text-foreground">{employee.separation?.separation_type?.replace(/_/g, ' ') || 'Resigned'}</td>
                                                        <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-destructive/5 whitespace-nowrap border-l border-destructive/20">Completed Service</th>
                                                        <td className="py-3 px-4 font-semibold text-foreground">{employee.separation?.completed_years_service ? `${employee.separation.completed_years_service} Years` : '—'}</td>
                                                    </tr>
                                                    {employee.separation?.reason && (
                                                        <tr className="hover:bg-destructive/5 transition-colors">
                                                            <th scope="row" className="py-3 px-4 font-medium text-muted-foreground bg-destructive/5 whitespace-nowrap">Official Reason</th>
                                                            <td colSpan={3} className="py-3 px-4 text-foreground font-medium">{employee.separation.reason}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Delete Profile Portrait Confirmation Dialog */}
            <AlertDialog open={deletePhotoOpen} onOpenChange={setDeletePhotoOpen}>
                <AlertDialogContent className="border-border bg-card shadow-xs">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold text-foreground">
                            Remove Profile Photo?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground mt-1">
                            Are you sure you want to remove the profile photo for <strong className="text-foreground">{employee.full_name}</strong>? This will revert the dossier avatar to default initials.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-2">
                        <AlertDialogCancel className="text-sm h-10 px-4 border-border bg-card hover:bg-muted">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeletePhoto}
                            className="text-sm h-10 px-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
                        >
                            Delete Photo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Interactive Element-Spotlight Joyride Tour */}
            <InteractiveTour
                steps={employeeDetailTourSteps}
                isOpen={isTourOpen}
                onClose={() => setIsTourOpen(false)}
                tourTitle="Employee dossier tour"
            />
        </AuthenticatedLayout>
    );
}
