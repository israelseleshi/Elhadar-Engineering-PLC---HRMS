import { useRef, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmployeeAvatar from '@/Components/EmployeeAvatar';
import { formatEthPhone } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Textarea } from '@/Components/ui/textarea';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/Components/ui/dialog';
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
    CreditCard,
    Building2,
    MapPin,
    Phone,
    ShieldCheck,
    AlertCircle,
    FileText,
    HeartHandshake,
    Landmark,
    Award,
    CheckCircle2,
    Camera,
    Trash2,
    ChevronDown,
    ChevronUp,
    Send,
    ShieldAlert,
    Copy,
    Check,
    Briefcase,
    GraduationCap,
    TrendingUp,
    Receipt,
    ExternalLink,
    Clock,
    History,
    Calendar,
    CalendarCheck,
    CalendarDays,
    FileUp,
    Paperclip,
    UserCheck,
    XCircle,
    Info
} from 'lucide-react';
import { gcToEc } from '@/lib/ethiopianDate';

interface Colleague {
    id: number;
    full_name: string;
    file_no: string;
    position: string;
}

interface LeaveRequest {
    id: number;
    employee_id: number;
    user_id: number;
    leave_type: string;
    start_date: string;
    start_date_ec: string;
    end_date: string;
    end_date_ec: string;
    requested_days: number;
    reason: string;
    handover_employee_id?: number | null;
    contact_phone?: string | null;
    attachment_path?: string | null;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
    is_deducted: boolean;
    days_deducted: number;
    reviewed_by?: number | null;
    reviewed_at?: string | null;
    reviewer_notes?: string | null;
    created_at: string;
    handover_employee?: Colleague | null;
    reviewer?: { id: number; name: string } | null;
}

interface DiscrepancyReport {
    id: number;
    field_name: string;
    current_value?: string;
    proposed_value: string;
    explanation?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    reviewer_notes?: string;
    created_at: string;
}

interface Employee {
    id: number;
    file_no: string;
    employee_id_no?: string;
    full_name: string;
    profile_photo_url?: string | null;
    profile_photo_path?: string | null;
    gender: 'Male' | 'Female' | string;
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
    status: string;
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
    department?: { id?: number; name: string };
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
        responsibility_allowance?: number;
        project_allowance?: number;
        position_allowance?: number;
        daily_allowance?: number;
        desert_allowance?: number;
        hardship_allowance?: number;
        transport_allowance?: number;
        house_allowance?: number;
        food_allowance?: number;
        mobile_allowance?: number;
        fuel_allowance_litres?: number;
        fuel_allowance_amount?: number;
        perdiem?: number;
        monthly_perdiem?: number;
        other_allowance?: number;
        total_salary?: number;
        taxable_salary?: number;
        income_tax?: number;
        pension_employee?: number;
        pension_company?: number;
        total_deductions?: number;
        net_salary?: number;
    };
    leave_balances?: {
        leave_year: number;
        annual_entitlement?: number;
        remaining_days: number;
    }[];
}

interface Props {
    employee: Employee | null;
    tenure: { years: number; months: number; days: number; formatted: string };
    annualLeaveEntitlement: number;
    retirementInfo?: {
        retirement_date: string;
        days_remaining: number;
        is_near: boolean;
        is_retired?: boolean;
        status_label?: string;
    } | null;
    discrepancyReports: DiscrepancyReport[];
    leaveRequests?: LeaveRequest[];
    colleagues?: Colleague[];
}

export default function Profile({
    employee,
    tenure,
    annualLeaveEntitlement,
    retirementInfo,
    discrepancyReports = [],
    leaveRequests = [],
    colleagues = [],
}: Props) {
    const [showModal, setShowModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [requestToCancel, setRequestToCancel] = useState<LeaveRequest | null>(null);
    const [deletePhotoOpen, setDeletePhotoOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [remarksExpanded, setRemarksExpanded] = useState(Boolean(employee?.remarks));
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        field_name: 'Full Name',
        current_value: '',
        proposed_value: '',
        explanation: '',
    });

    const {
        data: leaveData,
        setData: setLeaveData,
        post: postLeave,
        processing: leaveProcessing,
        reset: resetLeave,
        errors: leaveErrors,
    } = useForm<{
        leave_type: string;
        start_date: string;
        start_date_ec: string;
        end_date: string;
        end_date_ec: string;
        requested_days: string;
        reason: string;
        handover_employee_id: string;
        contact_phone: string;
        attachment: File | null;
    }>({
        leave_type: 'Annual',
        start_date: '',
        start_date_ec: '',
        end_date: '',
        end_date_ec: '',
        requested_days: '1',
        reason: '',
        handover_employee_id: '',
        contact_phone: employee?.phone || '',
        attachment: null,
    });

    const handleStartDateChange = (val: string) => {
        const ec = gcToEc(val);
        const ecFormatted = ec ? `${ec.split('-')[2]}/${ec.split('-')[1]}/${ec.split('-')[0]} E.C.` : '';
        setLeaveData((prev) => ({
            ...prev,
            start_date: val,
            start_date_ec: ecFormatted || prev.start_date_ec,
        }));
    };

    const handleEndDateChange = (val: string) => {
        const ec = gcToEc(val);
        const ecFormatted = ec ? `${ec.split('-')[2]}/${ec.split('-')[1]}/${ec.split('-')[0]} E.C.` : '';
        setLeaveData((prev) => ({
            ...prev,
            end_date: val,
            end_date_ec: ecFormatted || prev.end_date_ec,
        }));
    };

    const handleLeaveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postLeave(route('portal.leave.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                resetLeave();
                setShowLeaveModal(false);
                toast.success('Leave request submitted successfully for HR review');
            },
        });
    };

    const handleCancelLeave = () => {
        if (!requestToCancel) return;
        router.patch(route('portal.leave.cancel', requestToCancel.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setCancelDialogOpen(false);
                setRequestToCancel(null);
                toast.success('Leave request cancelled');
            },
            onError: () => {
                toast.error('Could not cancel this leave request');
            },
        });
    };

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(label);
        toast.success(`Copied ${label} to clipboard`);
        setTimeout(() => setCopiedKey(null), 1800);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !employee) return;
        const formData = new FormData();
        formData.append('photo', file);
        setIsUploadingPhoto(true);
        router.post(route('employees.photo.store', employee.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setIsUploadingPhoto(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const handleDeletePhoto = () => {
        if (employee) setDeletePhotoOpen(true);
    };

    const confirmDeletePhoto = () => {
        if (!employee) return;
        router.delete(route('employees.photo.destroy', employee.id), {
            preserveScroll: true,
            onFinish: () => setDeletePhotoOpen(false),
        });
    };

    const formatCurrency = (val?: number) => {
        if (!val || val <= 0) return '0.00 ETB';
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2,
        }).format(val);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('portal.discrepancy.store'), {
            onSuccess: () => {
                reset();
                setShowModal(false);
                toast.success('Discrepancy report submitted successfully to HR');
            },
        });
    };

    const getStatusBadge = (empStatus: string) => {
        switch (empStatus) {
            case 'Permanent':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Permanent Staff
                    </span>
                );
            case 'Contract':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                        Fixed-Term Contract
                    </span>
                );
            case 'Probation':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        Under Probation
                    </span>
                );
            case 'Separated':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                        Separated / Archived
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
                        {empStatus}
                    </span>
                );
        }
    };

    if (!employee) {
        return (
            <AuthenticatedLayout>
                <Head title="Employee Self-Service - Elhadar Engineering HRMS" />
                <div className="max-w-2xl mx-auto py-12 px-4">
                    <Card className="border-border bg-card shadow-xs p-8 text-center rounded-2xl">
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                            <AlertCircle className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">No Linked Employee Record Found</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                            Your login account is not currently linked to an active employee dossier. Please contact HR Administration to connect your user account to your personnel file.
                        </p>
                    </Card>
                </div>
            </AuthenticatedLayout>
        );
    }

    const salary = employee.current_salary;
    const displayCompanyExp = employee.company_experience && !employee.company_experience.startsWith('=') && !employee.company_experience.includes('DATEDIF') && !employee.company_experience.includes('Year,')
        ? employee.company_experience
        : (tenure?.formatted || '—');

    const displayTotalExp = employee.total_experience && !employee.total_experience.startsWith('=') && !employee.total_experience.includes('DATEDIF') && !employee.total_experience.includes('Year,')
        ? employee.total_experience
        : (employee.previous_experience ? `${employee.previous_experience} + ${displayCompanyExp}` : displayCompanyExp);

    return (
        <AuthenticatedLayout>
            <Head title={`Self-Service Dossier: ${employee.full_name} (${employee.file_no})`} />

            {/* Print Stylesheet */}
            <style>{`
                @media print {
                    header, nav, aside, .no-print, button { display: none !important; }
                    body { background: white !important; color: black !important; font-size: 11pt !important; }
                }
            `}</style>

            {/* Top Navigation & Action Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 no-print">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-tight">
                        Employee Self-Service (ESS) Portal
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Review verified personnel records, payroll allowances, and report data discrepancies.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                    <Button
                        type="button"
                        onClick={() => setShowLeaveModal(true)}
                        className="h-9 px-4 text-xs font-semibold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-xs transition-all cursor-pointer"
                    >
                        <CalendarCheck className="w-4 h-4" />
                        <span>Request Leave</span>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowModal(true)}
                        className="h-9 px-4 text-xs font-semibold gap-2 border-border hover:bg-muted text-foreground rounded-full shadow-xs transition-all cursor-pointer"
                    >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Report Correction</span>
                    </Button>
                </div>
            </div>

            {/* Master-Detail 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* =========================================================================
                    LEFT COLUMN (lg:col-span-4): Persistent Identity & Quick Identifiers
                   ========================================================================= */}
                <div className="lg:col-span-4 space-y-5">
                    {/* Primary Identity Card */}
                    <Card className="border-border bg-card shadow-xs rounded-xl p-6 relative overflow-hidden">
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
                                    disabled={isUploadingPhoto}
                                    title="Upload portrait photo"
                                    className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer no-print"
                                >
                                    <Camera className="w-5 h-5" />
                                    <span className="text-xs font-semibold mt-1">{isUploadingPhoto ? 'Uploading...' : 'Change'}</span>
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
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
                                {employee.full_name}
                            </h2>
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

                    {/* Quick-Copy Direct Identifiers Card */}
                    <Card className="border-border bg-card shadow-xs rounded-xl p-5 space-y-4 text-sm">
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
                                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted cursor-pointer"
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
                                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted cursor-pointer"
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
                                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted cursor-pointer"
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
                                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted cursor-pointer"
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

                    {/* Discrepancy Action Card */}
                    <Card className="border-primary/20 bg-primary/5 shadow-xs rounded-xl p-5 space-y-3 text-sm">
                        <div className="flex items-center gap-2.5 text-primary">
                            <AlertCircle className="w-5 h-5" />
                            <h4 className="font-bold text-sm">Notice Inaccurate Records?</h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            If any personal identification, academic credential, or salary allowance requires adjustment, submit an official correction request to HR.
                        </p>
                        <Button
                            type="button"
                            onClick={() => setShowModal(true)}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs font-semibold gap-1.5 border-primary/30 hover:bg-primary/10 text-primary rounded-lg"
                        >
                            <Send className="w-3.5 h-3.5" />
                            <span>Report Data Discrepancy</span>
                        </Button>
                    </Card>
                </div>

                {/* =========================================================================
                    RIGHT COLUMN (lg:col-span-8): Unified Workspaces & Correction History
                   ========================================================================= */}
                <div className="lg:col-span-8 space-y-6">
                    <Tabs defaultValue="career" className="w-full">
                        {/* 4 Unified Tabs (Table / Grid Segmented Navigation) */}
                        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 p-1.5 bg-muted/60 dark:bg-muted/30 border border-border/80 rounded-xl mb-6 gap-1.5 h-auto">
                            <TabsTrigger value="career" className="text-xs sm:text-sm font-medium py-2.5 px-2 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs transition-all">
                                <Briefcase className="w-4 h-4 mr-1.5 text-muted-foreground shrink-0" />
                                <span className="truncate">Career &amp; Assignment</span>
                            </TabsTrigger>
                            <TabsTrigger value="payroll" className="text-xs sm:text-sm font-medium py-2.5 px-2 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs transition-all">
                                <CreditCard className="w-4 h-4 mr-1.5 text-muted-foreground shrink-0" />
                                <span className="truncate">Compensation &amp; Payroll</span>
                            </TabsTrigger>
                            <TabsTrigger value="statutory" className="text-xs sm:text-sm font-medium py-2.5 px-2 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs transition-all">
                                <Award className="w-4 h-4 mr-1.5 text-muted-foreground shrink-0" />
                                <span className="truncate">Tenure &amp; Leave</span>
                            </TabsTrigger>
                            <TabsTrigger value="corrections" className="text-xs sm:text-sm font-medium py-2.5 px-2 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs transition-all">
                                <History className="w-4 h-4 mr-1.5 text-muted-foreground shrink-0" />
                                <span className="truncate">Correction History</span>
                                {discrepancyReports.length > 0 && (
                                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-primary text-primary-foreground">
                                        {discrepancyReports.length}
                                    </span>
                                )}
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

                            {/* Annual Leave Remaining Balance Summary Card */}
                            {employee.leave_balances && employee.leave_balances.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Card className="border-border bg-card shadow-xs rounded-xl p-4">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Leave Year</p>
                                        <p className="text-xl font-bold text-foreground mt-1">{employee.leave_balances[0].leave_year} G.C.</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Active statutory cycle</p>
                                    </Card>
                                    <Card className="border-border bg-card shadow-xs rounded-xl p-4">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Annual Entitlement</p>
                                        <p className="text-xl font-bold text-foreground mt-1">
                                            {employee.leave_balances[0].annual_entitlement ?? annualLeaveEntitlement} Days
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Calculated by years of service</p>
                                    </Card>
                                    <Card className="border-primary/20 bg-primary/5 shadow-xs rounded-xl p-4">
                                        <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Remaining Balance</p>
                                        <p className="text-xl font-extrabold text-primary mt-1">
                                            {employee.leave_balances[0].remaining_days} Working Days
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Available for rest application</p>
                                    </Card>
                                </div>
                            )}

                            {/* Official Leave Applications & Ledger Card */}
                            <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
                                <CardHeader className="py-4 px-6 border-b border-border/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                                            <CalendarDays className="w-5 h-5 text-primary" />
                                            <span>Official Leave Applications &amp; History</span>
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                            Track pending, approved, and historic leave requests with balance impact
                                        </CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setShowLeaveModal(true)}
                                        className="h-8 px-3 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-xs cursor-pointer self-start sm:self-auto"
                                    >
                                        <CalendarCheck className="w-3.5 h-3.5" />
                                        <span>Apply for Leave</span>
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {leaveRequests.length === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-center">
                                            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                                                <Calendar className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <h4 className="text-sm font-semibold text-foreground">No Leave Applications on File</h4>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                                You have not submitted any leave requests yet. Click &ldquo;Apply for Leave&rdquo; whenever you need to schedule statutory rest or excused leave.
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowLeaveModal(true)}
                                                className="mt-4 text-xs font-medium border-border"
                                            >
                                                Apply for Leave
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="border border-border/70 rounded-xl overflow-x-auto bg-card">
                                            <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[750px]">
                                                <thead className="bg-muted/40 border-b border-border/70">
                                                    <tr>
                                                        <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Leave Type</th>
                                                        <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Duration &amp; Period</th>
                                                        <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Handover &amp; Contact</th>
                                                        <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Balance Impact</th>
                                                        <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                                                        <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    {leaveRequests.map((req) => (
                                                        <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                                                            <td className="py-3 px-4 font-bold text-foreground">
                                                                <div className="flex items-center gap-2">
                                                                    <span>{req.leave_type} Leave</span>
                                                                    {req.attachment_path && (
                                                                        <a
                                                                            href={`/storage/${req.attachment_path}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="text-primary hover:underline"
                                                                            title="View supporting attachment"
                                                                        >
                                                                            <Paperclip className="w-3.5 h-3.5" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px] text-muted-foreground font-normal line-clamp-1 max-w-xs mt-0.5" title={req.reason}>
                                                                    {req.reason}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="font-semibold text-foreground">
                                                                    {req.requested_days} Working Day{req.requested_days > 1 ? 's' : ''}
                                                                </div>
                                                                <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                                                                    {req.start_date_ec} – {req.end_date_ec}
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground">
                                                                    {req.start_date} to {req.end_date} (G.C.)
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="font-medium text-foreground">
                                                                    {req.handover_employee?.full_name || 'None designated'}
                                                                </div>
                                                                <div className="text-[11px] font-mono text-muted-foreground">
                                                                    {req.contact_phone || '—'}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                {req.status === 'Approved' ? (
                                                                    req.is_deducted ? (
                                                                        <Badge variant="outline" className="text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                                                                            -{req.days_deducted} days deducted
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                                                                            Excused (0 Deduction)
                                                                        </Badge>
                                                                    )
                                                                ) : req.status === 'Pending' ? (
                                                                    <span className="text-xs text-muted-foreground">Pending HR deduction</span>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">—</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 whitespace-nowrap">
                                                                <Badge
                                                                    variant={
                                                                        req.status === 'Approved'
                                                                            ? 'secondary'
                                                                            : req.status === 'Rejected'
                                                                            ? 'destructive'
                                                                            : 'outline'
                                                                    }
                                                                    className={`text-xs px-2.5 py-0.5 font-semibold ${
                                                                        req.status === 'Approved'
                                                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                                                            : req.status === 'Pending'
                                                                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                                                            : req.status === 'Cancelled'
                                                                            ? 'bg-muted text-muted-foreground border-border'
                                                                            : ''
                                                                    }`}
                                                                >
                                                                    {req.status}
                                                                </Badge>
                                                                {req.reviewer_notes && (
                                                                    <p className="text-[10px] text-muted-foreground mt-1 max-w-[180px] truncate" title={req.reviewer_notes}>
                                                                        Note: {req.reviewer_notes}
                                                                    </p>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                                {req.status === 'Pending' ? (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setRequestToCancel(req);
                                                                            setCancelDialogOpen(true);
                                                                        }}
                                                                        className="h-8 px-2.5 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    >
                                                                        <XCircle className="w-3.5 h-3.5 mr-1" />
                                                                        Cancel
                                                                    </Button>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
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

                        {/* -------------------------------------------------------------
                            TAB 4: CORRECTION REQUESTS HISTORY
                           ------------------------------------------------------------- */}
                        <TabsContent value="corrections" className="space-y-6 focus-visible:outline-none">
                            <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
                                <CardHeader className="py-4 px-6 border-b border-border/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                                            <History className="w-5 h-5 text-primary" />
                                            <span>Data Correction Requests History</span>
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                            Audit trail of submitted discrepancy requests and HR administrative review status
                                        </CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setShowModal(true)}
                                        className="h-8 px-3 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-xs cursor-pointer self-start sm:self-auto"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>New Correction Request</span>
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {discrepancyReports.length === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-center">
                                            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                                                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <h4 className="text-sm font-semibold text-foreground">No Discrepancy Reports Submitted</h4>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                                All your personnel records are up-to-date. If you spot any inaccuracy, click &ldquo;Report Correction&rdquo; to notify HR.
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowModal(true)}
                                                className="mt-4 text-xs font-medium border-border"
                                            >
                                                Report a Discrepancy
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="border border-border/70 rounded-xl overflow-x-auto bg-card">
                                            <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[650px]">
                                                <thead className="bg-muted/40 border-b border-border/70">
                                                    <tr>
                                                        <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Field Name</th>
                                                        <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Current Record</th>
                                                        <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Proposed Correction</th>
                                                        <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider hidden sm:table-cell">Explanation</th>
                                                        <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Date</th>
                                                        <th className="py-2.5 px-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    {discrepancyReports.map((report) => (
                                                        <tr key={report.id} className="hover:bg-muted/20 transition-colors">
                                                            <td className="py-3 px-4 font-bold text-foreground">{report.field_name}</td>
                                                            <td className="py-3 px-4 text-muted-foreground">{report.current_value || '—'}</td>
                                                            <td className="py-3 px-4 font-bold text-primary">{report.proposed_value}</td>
                                                            <td className="py-3 px-4 text-foreground/80 max-w-xs truncate hidden sm:table-cell" title={report.explanation}>
                                                                {report.explanation || '—'}
                                                            </td>
                                                            <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                                {report.created_at ? new Date(report.created_at).toLocaleDateString() : '—'}
                                                            </td>
                                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                                <Badge
                                                                    variant={
                                                                        report.status === 'Approved'
                                                                            ? 'secondary'
                                                                            : report.status === 'Rejected'
                                                                            ? 'destructive'
                                                                            : 'outline'
                                                                    }
                                                                    className={`text-xs px-2.5 py-0.5 font-semibold ${
                                                                        report.status === 'Approved'
                                                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                                                            : report.status === 'Pending'
                                                                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                                                            : ''
                                                                    }`}
                                                                >
                                                                    {report.status}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Discrepancy Reporting Modal (Shadcn UI Dialog) */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-md bg-card border-border text-foreground p-6 max-h-[90vh] overflow-y-auto rounded-2xl shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-primary" />
                            <span>Report Data Discrepancy</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Submit an official correction request to HR Administration. All adjustments will be reviewed and audited.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-3">
                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Field with Discrepancy <span className="text-destructive">*</span>
                            </label>
                            <Select value={data.field_name} onValueChange={(v) => setData('field_name', v)}>
                                <SelectTrigger className="w-full h-10 rounded-xl border-border bg-background text-foreground text-xs shadow-2xs">
                                    <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    <SelectGroup>
                                        <SelectLabel className="text-xs font-bold text-muted-foreground">Personal &amp; Identity</SelectLabel>
                                        <SelectItem value="Full Name">Full Name</SelectItem>
                                        <SelectItem value="Gender">Gender</SelectItem>
                                        <SelectItem value="DOB (E.C)">Date of Birth (E.C)</SelectItem>
                                        <SelectItem value="DOB (G.C)">Date of Birth (G.C)</SelectItem>
                                        <SelectItem value="Marital Status">Marital Status</SelectItem>
                                        <SelectItem value="Phone Number">Phone Number</SelectItem>
                                        <SelectItem value="Email Address">Email Address</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-xs font-bold text-muted-foreground">Residence &amp; Emergency</SelectLabel>
                                        <SelectItem value="Region / City">Region / City / Woreda</SelectItem>
                                        <SelectItem value="Emergency Contact Name">Emergency Contact Name</SelectItem>
                                        <SelectItem value="Emergency Contact Phone">Emergency Contact Phone</SelectItem>
                                        <SelectItem value="Emergency Relationship">Emergency Relationship</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-xs font-bold text-muted-foreground">Education &amp; Qualifications</SelectLabel>
                                        <SelectItem value="Education Attainment">Education Attainment</SelectItem>
                                        <SelectItem value="Institution">Institution</SelectItem>
                                        <SelectItem value="Graduation Year">Graduation Year (E.C)</SelectItem>
                                        <SelectItem value="Professional License">Professional License</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-xs font-bold text-muted-foreground">Employment &amp; Assignment</SelectLabel>
                                        <SelectItem value="Department">Department</SelectItem>
                                        <SelectItem value="Job Title">Job Title</SelectItem>
                                        <SelectItem value="Work Place">Work Place</SelectItem>
                                        <SelectItem value="Employment Date">Employment Date</SelectItem>
                                        <SelectItem value="Previous Experience">Previous Experience</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-xs font-bold text-muted-foreground">Financial &amp; Legal IDs</SelectLabel>
                                        <SelectItem value="TIN Number">TIN Number</SelectItem>
                                        <SelectItem value="Bank Name">Bank Name</SelectItem>
                                        <SelectItem value="Bank Account Number">Commercial Bank Account</SelectItem>
                                        <SelectItem value="Social Security No">Social Security No</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Current Value in System (Optional)
                            </label>
                            <Input
                                value={data.current_value}
                                onChange={(e) => setData('current_value', e.target.value)}
                                placeholder="Value currently shown..."
                                className="bg-background border-border text-foreground text-xs h-10 rounded-xl"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Proposed Correct Value <span className="text-destructive">*</span>
                            </label>
                            <Input
                                required
                                value={data.proposed_value}
                                onChange={(e) => setData('proposed_value', e.target.value)}
                                placeholder="Enter correct information..."
                                className="bg-background border-border text-foreground text-xs h-10 rounded-xl"
                            />
                            {errors.proposed_value && (
                                <p className="text-xs text-destructive mt-1 font-medium">{errors.proposed_value}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Explanation / Supporting Notes
                            </label>
                            <Textarea
                                value={data.explanation}
                                onChange={(e) => setData('explanation', e.target.value)}
                                rows={3}
                                placeholder="Provide supporting context or document reference for HR..."
                                className="w-full rounded-xl border border-border bg-background text-foreground p-3 text-xs leading-relaxed focus-visible:ring-1 focus-visible:ring-primary"
                            />
                        </div>

                        <DialogFooter className="flex justify-end gap-2 pt-3 border-t border-border/70">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowModal(false)}
                                className="text-xs border-border rounded-xl h-9"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl h-9 shadow-xs"
                            >
                                {processing ? 'Submitting...' : 'Submit Correction'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Remove Profile Photo Confirmation Dialog */}
            <AlertDialog open={deletePhotoOpen} onOpenChange={setDeletePhotoOpen}>
                <AlertDialogContent className="border-border bg-card shadow-xs rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-foreground">
                            Remove Profile Photo?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground mt-1">
                            Are you sure you want to delete your profile photo? Your avatar will revert to your name initials.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-2">
                        <AlertDialogCancel className="text-xs h-9 border-border bg-card hover:bg-muted rounded-xl">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeletePhoto}
                            className="text-xs h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-xl"
                        >
                            Delete Photo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Leave Request Application Modal (Shadcn UI Dialog) */}
            <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
                <DialogContent className="max-w-lg bg-card border-border text-foreground p-6 max-h-[90vh] overflow-y-auto rounded-2xl shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                            <CalendarCheck className="w-5 h-5 text-primary" />
                            <span>Submit Official Leave Request</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Formal leave request under Ethiopian Labour Proclamation 1156/2019 and company rest policy.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleLeaveSubmit} className="space-y-4 pt-3">
                        {employee.leave_balances && employee.leave_balances[0] && (
                            <div className="p-3 bg-muted/40 border border-border/80 rounded-xl flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Current Annual Balance:</span>
                                <span className="font-bold text-primary font-mono text-sm">
                                    {employee.leave_balances[0].remaining_days} Working Days
                                </span>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Leave Classification <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={leaveData.leave_type}
                                onValueChange={(v) => setLeaveData('leave_type', v)}
                            >
                                <SelectTrigger className="w-full h-10 rounded-xl border-border bg-background text-foreground text-xs shadow-2xs">
                                    <SelectValue placeholder="Select type of leave" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    <SelectItem value="Annual">Annual Statutory Rest (Art. 77)</SelectItem>
                                    <SelectItem value="Sick">Sick Leave (Medical Certificate Required)</SelectItem>
                                    <SelectItem value="Mourning">Mourning / Bereavement (Art. 81)</SelectItem>
                                    <SelectItem value="Marriage">Marriage Leave (Art. 81)</SelectItem>
                                    <SelectItem value="Paternity">Paternity Leave (Art. 81)</SelectItem>
                                    <SelectItem value="Maternity">Maternity Confinement (Art. 88)</SelectItem>
                                    <SelectItem value="Compassionate">Compassionate / Emergency Family</SelectItem>
                                    <SelectItem value="Unpaid">Authorized Unpaid Leave</SelectItem>
                                </SelectContent>
                            </Select>
                            {leaveErrors.leave_type && (
                                <p className="text-xs text-destructive mt-1 font-medium">{leaveErrors.leave_type}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                    Start Date (G.C.) <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    type="date"
                                    required
                                    value={leaveData.start_date}
                                    onChange={(e) => handleStartDateChange(e.target.value)}
                                    className="bg-background border-border text-foreground text-xs h-10 rounded-xl"
                                />
                                {leaveErrors.start_date && (
                                    <p className="text-xs text-destructive mt-1 font-medium">{leaveErrors.start_date}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                    Start Date (E.C.) <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    required
                                    value={leaveData.start_date_ec}
                                    onChange={(e) => setLeaveData('start_date_ec', e.target.value)}
                                    placeholder="e.g. 05/03/2019 E.C."
                                    className="bg-background border-border text-foreground text-xs h-10 rounded-xl font-mono"
                                />
                                {leaveErrors.start_date_ec && (
                                    <p className="text-xs text-destructive mt-1 font-medium">{leaveErrors.start_date_ec}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                    End Date (G.C.) <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    type="date"
                                    required
                                    value={leaveData.end_date}
                                    onChange={(e) => handleEndDateChange(e.target.value)}
                                    className="bg-background border-border text-foreground text-xs h-10 rounded-xl"
                                />
                                {leaveErrors.end_date && (
                                    <p className="text-xs text-destructive mt-1 font-medium">{leaveErrors.end_date}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                    End Date (E.C.) <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    required
                                    value={leaveData.end_date_ec}
                                    onChange={(e) => setLeaveData('end_date_ec', e.target.value)}
                                    placeholder="e.g. 10/03/2019 E.C."
                                    className="bg-background border-border text-foreground text-xs h-10 rounded-xl font-mono"
                                />
                                {leaveErrors.end_date_ec && (
                                    <p className="text-xs text-destructive mt-1 font-medium">{leaveErrors.end_date_ec}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                    Requested Working Days <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="120"
                                    required
                                    value={leaveData.requested_days}
                                    onChange={(e) => setLeaveData('requested_days', e.target.value)}
                                    className="bg-background border-border text-foreground text-xs h-10 rounded-xl font-mono"
                                />
                                {leaveErrors.requested_days && (
                                    <p className="text-xs text-destructive mt-1 font-medium">{leaveErrors.requested_days}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                    Contact Phone on Leave
                                </label>
                                <Input
                                    value={leaveData.contact_phone}
                                    onChange={(e) => setLeaveData('contact_phone', e.target.value)}
                                    placeholder="+251..."
                                    className="bg-background border-border text-foreground text-xs h-10 rounded-xl font-mono"
                                />
                                {leaveErrors.contact_phone && (
                                    <p className="text-xs text-destructive mt-1 font-medium">{leaveErrors.contact_phone}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Handover Colleague (Optional)
                            </label>
                            <Select
                                value={leaveData.handover_employee_id || 'none'}
                                onValueChange={(v) => setLeaveData('handover_employee_id', v === 'none' ? '' : v)}
                            >
                                <SelectTrigger className="w-full h-10 rounded-xl border-border bg-background text-foreground text-xs shadow-2xs">
                                    <SelectValue placeholder="Designate colleague during absence..." />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border max-h-56">
                                    <SelectItem value="none">None / No Handover Required</SelectItem>
                                    {colleagues.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.full_name} ({c.file_no}) — {c.position}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Supporting Document / Certificate (PDF or Image, max 5MB)
                            </label>
                            <Input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.webp"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setLeaveData('attachment', file);
                                }}
                                className="bg-background border-border text-foreground text-xs h-10 rounded-xl file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                            {leaveErrors.attachment && (
                                <p className="text-xs text-destructive mt-1 font-medium">{leaveErrors.attachment}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Reason &amp; Justification <span className="text-destructive">*</span>
                            </label>
                            <Textarea
                                required
                                rows={3}
                                value={leaveData.reason}
                                onChange={(e) => setLeaveData('reason', e.target.value)}
                                placeholder="Provide details regarding the nature of the request, travel, or medical circumstance..."
                                className="w-full rounded-xl border border-border bg-background text-foreground p-3 text-xs leading-relaxed focus-visible:ring-1 focus-visible:ring-primary"
                            />
                            {leaveErrors.reason && (
                                <p className="text-xs text-destructive mt-1 font-medium">{leaveErrors.reason}</p>
                            )}
                        </div>

                        <DialogFooter className="flex justify-end gap-2 pt-3 border-t border-border/70">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowLeaveModal(false)}
                                className="text-xs border-border rounded-xl h-9"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={leaveProcessing}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl h-9 shadow-xs"
                            >
                                {leaveProcessing ? 'Submitting...' : 'Submit Application'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Cancel Request Confirmation Dialog */}
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent className="border-border bg-card shadow-xs rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-foreground">
                            Cancel Leave Application?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground mt-1">
                            Are you sure you want to cancel your leave request for {requestToCancel?.requested_days} day(s) from {requestToCancel?.start_date_ec} to {requestToCancel?.end_date_ec}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-2">
                        <AlertDialogCancel className="text-xs h-9 border-border bg-card hover:bg-muted rounded-xl">
                            Keep Request
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelLeave}
                            className="text-xs h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-xl"
                        >
                            Yes, Cancel Leave
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthenticatedLayout>
    );
}
