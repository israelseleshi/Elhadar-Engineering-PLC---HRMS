import { useRef, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';
import EmployeeAvatar from '@/Components/EmployeeAvatar';
import { formatEthPhone } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Input } from '@/Components/ui/input';
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
import { useForm } from '@inertiajs/react';
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
    Camera,
    Trash2,
    ChevronDown,
    ChevronUp,
    Send,
    ShieldAlert,
} from 'lucide-react';

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
}

export default function Profile({ employee, tenure, annualLeaveEntitlement, retirementInfo, discrepancyReports }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [deletePhotoOpen, setDeletePhotoOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [remarksExpanded, setRemarksExpanded] = useState(Boolean(employee?.remarks));
    usePage().props.auth.user; // ensure auth context
    const Layout = PortalLayout;

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !employee) return;
        const formData = new FormData();
        formData.append('photo', file);
        setIsUploadingPhoto(true);
        router.post(route('employees.photo.store', employee.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => { setIsUploadingPhoto(false); if (fileInputRef.current) fileInputRef.current.value = ''; },
        });
    };
    const handleDeletePhoto = () => { if (employee) setDeletePhotoOpen(true); };
    const confirmDeletePhoto = () => {
        if (!employee) return;
        router.delete(route('employees.photo.destroy', employee.id), { preserveScroll: true, onFinish: () => setDeletePhotoOpen(false) });
    };

    const { data, setData, post, processing, reset, errors } = useForm({
        field_name: 'Full Name', current_value: '', proposed_value: '', explanation: '',
    });
    const formatCurrency = (val?: number) => {
        if (!val || val <= 0) return '0.00 ETB';
        return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2 }).format(val);
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('portal.discrepancy.store'), { onSuccess: () => { reset(); setShowModal(false); } });
    };

    if (!employee) {
        return (
            <Layout title="Employee Self-Service">
                <Head title="Self-Service Portal - Elhadar Engineering HRMS" />
                <Card className="border-[#d8d9da] bg-white p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-[#64666a] mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-black">No Linked Employee Record Found</h3>
                    <p className="text-sm text-[#64666a] mt-1">Please contact HR Administration to link your user account to an employee profile.</p>
                </Card>
            </Layout>
        );
    }

    const salary = employee.current_salary;
    const displayCompanyExp = employee.company_experience && !employee.company_experience.startsWith('=') && !employee.company_experience.includes('DATEDIF') && !employee.company_experience.includes('Year,') ? employee.company_experience : (tenure?.formatted || '—');
    const displayTotalExp = employee.total_experience && !employee.total_experience.startsWith('=') && !employee.total_experience.includes('DATEDIF') && !employee.total_experience.includes('Year,') ? employee.total_experience : (employee.previous_experience ? `${employee.previous_experience} + ${displayCompanyExp}` : displayCompanyExp);

    return (
        <Layout
            title="Employee Self-Service Portal"
            subtitle="Review your verified personnel records, payroll allowances, and report data discrepancies."
        >
            <Head title={`Self-Service: ${employee.full_name} - Elhadar Engineering HRMS`} />

            {/* Header Profile Dossier Card */}
            <Card className="border-[#d8d9da] bg-white mb-6 overflow-hidden">
                <div className="p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="relative group shrink-0">
                            <EmployeeAvatar
                                name={employee.full_name}
                                src={employee.profile_photo_url}
                                size="xl"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingPhoto}
                                title="Upload new photo"
                                className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                            >
                                <Camera className="w-5 h-5" />
                                <span className="text-[9px] font-semibold mt-0.5">{isUploadingPhoto ? 'Saving...' : 'Change'}</span>
                            </button>
                            {employee.profile_photo_url && (
                                <button
                                    type="button"
                                    onClick={handleDeletePhoto}
                                    title="Remove photo"
                                    className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50 shadow-xs transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
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
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-xs bg-[#effcf8] text-[#008254] border border-[#b7ecda]">
                                    {employee.file_no}
                                </span>
                                <Badge variant={employee.status === 'Permanent' ? 'mint' : 'secondary'}>
                                    {employee.status}
                                </Badge>
                            </div>
                            <h1 className="text-2xl font-bold text-black tracking-tight">
                                {employee.full_name}
                            </h1>
                            <div className="flex flex-col gap-1.5 text-xs text-[#3d4045] mt-1.5 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-[#008254] shrink-0" />
                                    {employee.department?.name || 'General Engineering'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-[#008254] shrink-0" />
                                    {employee.work_place}
                                </span>
                                <span>{employee.position}</span>
                                {employee.phone && (
                                    <span className="flex items-center gap-1.5 font-semibold text-[#008254]">
                                        <Phone className="w-3.5 h-3.5 shrink-0" />
                                        {formatEthPhone(employee.phone)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2.5 w-full md:w-auto">
                        <div className="flex flex-col items-start sm:items-end w-full md:w-auto p-4 rounded-lg bg-[#f7f7f7] border border-[#ebebec]">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">
                                Total Monthly Compensation
                            </span>
                            <span className="text-xl sm:text-2xl font-bold text-[#008254] mt-0.5 break-words">
                                {formatCurrency(salary?.total_salary || salary?.basic_salary)}
                            </span>
                            <span className="text-[11px] text-[#64666a]">
                                Basic: {formatCurrency(salary?.basic_salary)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Statutory Fast-Facts Ribbon (NerdWallet Comparison Spec) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border-t border-[#ebebec] bg-[#effcf8]/40 divide-y sm:divide-y-0 sm:divide-x divide-[#ebebec]">
                    <div className="p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64666a] block">
                            Tenure of Service
                        </span>
                        <span className="text-base font-bold text-black mt-1 block">
                            {tenure.formatted}
                        </span>
                        <span className="text-[11px] text-[#008254] font-medium block">
                            Since {employee.employment_date_ec} E.C.
                        </span>
                    </div>

                    <div className="p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64666a] block">
                            Annual Leave Entitlement
                        </span>
                        <span className="text-base font-bold text-black mt-1 block">
                            {annualLeaveEntitlement} Working Days
                        </span>
                        <span className="text-[11px] text-[#64666a] block" title="Annual leave set by the Ethiopian Labour Proclamation No. 1156/2019 (Articles 77–78)">
                            16 days + 1 day per 2 years of service
                        </span>
                    </div>

                    <div className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64666a] block">
                                Retirement Status
                            </span>
                            {retirementInfo && (
                                <Badge 
                                    variant={retirementInfo.is_retired ? 'destructive' : (retirementInfo.is_near ? 'lime' : 'mint')}
                                    className="text-[10px] py-0 px-1.5 font-bold"
                                >
                                    {retirementInfo.status_label || (retirementInfo.is_retired ? 'Retired' : 'Not Retired')}
                                </Badge>
                            )}
                        </div>
                        <span className="text-base font-bold text-black mt-1 block">
                            {retirementInfo ? retirementInfo.retirement_date : 'Not recorded'}
                        </span>
                        <span className="text-[11px] text-[#64666a] block">
                            {retirementInfo 
                                ? (retirementInfo.is_retired 
                                    ? 'Statutory age reached (60 yrs)' 
                                    : `${Math.round(retirementInfo.days_remaining / 365)} years remaining`)
                                : 'Birthdate required'}
                        </span>
                    </div>

                    <div className="p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64666a] block">
                            Banking & Payroll
                        </span>
                        <span className="text-base font-bold text-black mt-1 block break-words">
                            {employee.bank_account_no || 'No account logged'}
                        </span>
                        <span className="text-[11px] text-[#008254] font-medium block">
                            {employee.bank_name || 'CBE'}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Section 1 to 7 Master List Tabs */}
            <Tabs defaultValue="section1" className="w-full">
                <TabsList className="w-full overflow-x-auto flex-nowrap justify-start gap-2 sm:gap-4 border-b border-[#ebebec] scrollbar-thin mb-4 pb-0">
                    <TabsTrigger value="section1" className="shrink-0 text-xs font-semibold px-2 sm:px-3 py-2.5">
                        1. Personal Identification
                    </TabsTrigger>
                    <TabsTrigger value="section2" className="shrink-0 text-xs font-semibold px-2 sm:px-3 py-2.5">
                        2. Employment Details
                    </TabsTrigger>
                    <TabsTrigger value="section3" className="shrink-0 text-xs font-semibold px-2 sm:px-3 py-2.5">
                        3. Education &amp; Qualifications
                    </TabsTrigger>
                    <TabsTrigger value="section4" className="shrink-0 text-xs font-semibold px-2 sm:px-3 py-2.5">
                        4. Compensation &amp; Payroll
                    </TabsTrigger>
                    <TabsTrigger value="section5" className="shrink-0 text-xs font-semibold px-2 sm:px-3 py-2.5">
                        5. Experience &amp; Performance
                    </TabsTrigger>
                    <TabsTrigger value="section6" className="shrink-0 text-xs font-semibold px-2 sm:px-3 py-2.5">
                        6. Financial &amp; Legal IDs
                    </TabsTrigger>
                    <TabsTrigger value="section7" className="shrink-0 text-xs font-semibold px-2 sm:px-3 py-2.5">
                        7. Contact Information
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: SECTION 1 - PERSONAL IDENTIFICATION */}
                <TabsContent value="section1" className="space-y-6">
                    {/* Identity & Age Banner */}
                    <div className="p-4 rounded-lg bg-[#effcf8] border border-[#b7ecda] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white border-2 border-[#008254] flex flex-col items-center justify-center shadow-xs shrink-0">
                                <span className="text-2xl font-extrabold text-[#008254] leading-none">
                                    {employee.age ?? (employee.birth_date ? new Date().getFullYear() - new Date(employee.birth_date).getFullYear() : '—')}
                                </span>
                                <span className="text-[9px] font-bold text-[#64666a] uppercase">Years</span>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#008254] block">
                                    Section 1: Date of Birth &amp; Age
                                </span>
                                <div className="flex flex-wrap items-center gap-3 text-sm mt-0.5 font-bold text-black">
                                    <span>{employee.birth_date_ec ? `${employee.birth_date_ec} E.C.` : 'No E.C. DOB'}</span>
                                    <span className="text-[#64666a] font-normal">|</span>
                                    <span className="text-[#3d4045] font-semibold">{employee.birth_date ? `${employee.birth_date} G.C.` : 'No G.C. DOB'}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-[#64666a]">Marital Status:</span>
                                    <span className="text-xs font-bold text-[#008254] px-2 py-0.5 rounded-xs bg-white border border-[#b7ecda]">
                                        {employee.marital_status || 'Single'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-start sm:items-end">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">Retirement Status</span>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                    variant={retirementInfo?.is_retired ? 'destructive' : (retirementInfo?.is_near ? 'lime' : 'mint')}
                                    className="text-xs font-bold px-2 py-0.5"
                                >
                                    {retirementInfo?.status_label || (retirementInfo?.is_retired ? 'Retired' : 'Active (Not Retired)')}
                                </Badge>
                            </div>
                            <span className="text-xs text-[#64666a] mt-0.5">
                                {retirementInfo ? `${retirementInfo.retirement_date} (${Math.round(retirementInfo.days_remaining / 365)} yrs remaining)` : 'DOB required'}
                            </span>
                        </div>
                    </div>

                    {/* Section 1 Master Attributes Grid */}
                    <Card className="border-[#d8d9da] bg-white">
                        <CardHeader>
                            <CardTitle>Section 1: Personal Identification Attributes</CardTitle>
                            <CardDescription>Verified personal identification and demographic records</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                                <div className="p-3.5 rounded-xs bg-[#f7f7f7] border border-[#ebebec]">
                                    <span className="text-[#64666a] block text-[11px] font-medium">Personnel File No:</span>
                                    <span className="font-bold text-black text-sm mt-0.5 block">{employee.file_no}</span>
                                </div>
                                <div className="p-3.5 rounded-xs bg-[#f7f7f7] border border-[#ebebec]">
                                    <span className="text-[#64666a] block text-[11px] font-medium">Full Name with Grand Father:</span>
                                    <span className="font-bold text-black text-sm mt-0.5 block">{employee.full_name}</span>
                                </div>
                                <div className="p-3.5 rounded-xs bg-[#f7f7f7] border border-[#ebebec]">
                                    <span className="text-[#64666a] block text-[11px] font-medium">Gender:</span>
                                    <span className="font-semibold text-black text-sm mt-0.5 block">{employee.gender}</span>
                                </div>
                                <div className="p-3.5 rounded-xs bg-[#f7f7f7] border border-[#ebebec]">
                                    <span className="text-[#64666a] block text-[11px] font-medium">Marital Status:</span>
                                    <span className="font-semibold text-black text-sm mt-0.5 block">{employee.marital_status || 'Single'}</span>
                                </div>
                                <div className="p-3.5 rounded-xs bg-[#f7f7f7] border border-[#ebebec]">
                                    <span className="text-[#64666a] block text-[11px] font-medium">Date of Birth E.C.:</span>
                                    <span className="font-bold text-[#008254] text-sm mt-0.5 block">{employee.birth_date_ec ? `${employee.birth_date_ec} E.C.` : '—'}</span>
                                </div>
                                <div className="p-3.5 rounded-xs bg-[#f7f7f7] border border-[#ebebec]">
                                    <span className="text-[#64666a] block text-[11px] font-medium">Date of Birth G.C.:</span>
                                    <span className="font-semibold text-black text-sm mt-0.5 block">{employee.birth_date ? `${employee.birth_date} G.C.` : '—'}</span>
                                </div>
                                <div className="p-3.5 rounded-xs bg-[#effcf8] border border-[#b7ecda]">
                                    <span className="text-[#008254] block text-[11px] font-semibold">Calculated Age:</span>
                                    <span className="font-bold text-[#008254] text-base mt-0.5 block">
                                        {employee.age ? `${employee.age} Years Old` : '—'}
                                    </span>
                                </div>
                                <div className="p-3.5 rounded-xs bg-[#effcf8] border border-[#b7ecda]">
                                    <span className="text-[#008254] block text-[11px] font-semibold">Retirement Status:</span>
                                    <span className="font-bold text-black text-sm mt-0.5 block">
                                        {retirementInfo?.status_label || (retirementInfo?.is_retired ? 'Retired' : 'Active (Not Retired)')}
                                    </span>
                                </div>
                                <div className="p-3.5 rounded-xs bg-[#f7f7f7] border border-[#ebebec]">
                                    <span className="text-[#64666a] block text-[11px] font-medium">Scheduled Retirement Date:</span>
                                    <span className="font-semibold text-black text-sm mt-0.5 block">
                                        {retirementInfo?.retirement_date || '—'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: SECTION 2 - EMPLOYMENT DETAILS */}
                <TabsContent value="section2" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-[#d8d9da] bg-white">
                            <CardHeader>
                                <CardTitle>Section 2: Employment Details &amp; Assignment</CardTitle>
                                <CardDescription>Contractual assignment, project site, job grade and dual start dates</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                <div className="p-3.5 rounded-xs bg-[#effcf8] border border-[#b7ecda]">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#008254]">Date of Employment</span>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-sm font-bold text-black">Ethiopian Calendar:</span>
                                        <span className="font-bold text-[#008254]">{employee.employment_date_ec} E.C.</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-0.5">
                                        <span className="text-xs text-[#64666a]">Gregorian Equivalent:</span>
                                        <span className="text-xs font-semibold text-black">{employee.employment_date} G.C.</span>
                                    </div>
                                </div>

                                {(employee.status === 'Separated' || employee.separation) && (
                                    <div className="p-3.5 rounded-xs bg-red-50 border border-red-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider text-red-700">Date of Termination</span>
                                            <Badge variant="destructive" className="text-[10px]">Separated</Badge>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-sm font-bold text-black">Ethiopian Calendar:</span>
                                            <span className="font-bold text-red-700">{employee.separation?.termination_date_ec || '—'} E.C.</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <span className="text-xs text-[#64666a]">Gregorian Equivalent:</span>
                                            <span className="text-xs font-semibold text-black">{employee.separation?.effective_date || '—'} G.C.</span>
                                        </div>
                                        {employee.separation?.separation_type && (
                                            <div className="flex justify-between items-center mt-1 pt-1 border-t border-red-200/60 text-xs">
                                                <span className="text-[#64666a]">Separation Type:</span>
                                                <span className="font-semibold text-black">{employee.separation.separation_type.replace(/_/g, ' ')}</span>
                                            </div>
                                        )}
                                        {employee.separation?.reason && (
                                            <div className="flex justify-between items-center mt-0.5 text-xs">
                                                <span className="text-[#64666a]">Reason:</span>
                                                <span className="font-medium text-black">{employee.separation.reason}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2 pt-2 text-xs">
                                    <div className="flex justify-between items-center py-1.5 border-b border-[#ebebec]">
                                        <span className="text-[#64666a]">Department:</span>
                                        <span className="font-semibold text-black">{employee.department?.name || '—'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-[#ebebec]">
                                        <span className="text-[#64666a]">Work Place / Project:</span>
                                        <span className="font-semibold text-black">{employee.work_place}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-[#ebebec]">
                                        <span className="text-[#64666a]">Job Title:</span>
                                        <span className="font-semibold text-black">{employee.position}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-[#ebebec]">
                                        <span className="text-[#64666a]">Job Grade:</span>
                                        <span className="font-bold text-[#008254]">
                                            {employee.grade ? `Grade ${employee.grade}` : '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-[#ebebec]">
                                        <span className="text-[#64666a]">Steps:</span>
                                        <span className="font-bold text-[#008254]">
                                            {employee.step ? `Step ${employee.step}` : '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-[#ebebec]">
                                        <span className="text-[#64666a]">Term of Employment:</span>
                                        <Badge variant={employee.status === 'Permanent' ? 'mint' : 'secondary'}>
                                            {employee.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-[#ebebec]">
                                        <span className="text-[#64666a]">Contract Classification:</span>
                                        <span className="font-semibold text-black">{employee.contract_type}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5">
                                        <span className="text-[#64666a]">Employment Type:</span>
                                        <span className="font-semibold text-black">{employee.employment_type}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-[#d8d9da] bg-white">
                            <CardHeader>
                                <CardTitle>Milestones, Tenure &amp; Leave</CardTitle>
                                <CardDescription>Accumulated longevity and statutory leave entitlements</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                <div className="p-4 rounded-xs bg-[#effcf8] border border-[#b7ecda]">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#008254] block">Accumulated Service Tenure</span>
                                    <span className="text-xl font-bold text-black block mt-1">{tenure.formatted}</span>
                                    <span className="text-xs text-[#64666a] block mt-0.5">Continuous service since {employee.employment_date_ec} E.C.</span>
                                </div>

                                <div className="p-4 rounded-xs bg-[#f7f7f7] border border-[#d8d9da] flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-[#64666a] font-medium block">Active Annual Entitlement</span>
                                        <span className="text-2xl font-bold text-[#008254] block mt-0.5">{annualLeaveEntitlement} Days</span>
                                        <span className="text-[11px] text-[#64666a] block mt-0.5">Proclamation 1156/2019 (16 days + 1 day / 2 yrs)</span>
                                    </div>
                                    <Award className="w-8 h-8 text-[#008254]/40" />
                                </div>

                                <div className="p-3.5 rounded-xs bg-[#f7f7f7] border border-[#ebebec]">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#64666a]">Probation Details</span>
                                    <div className="flex justify-between items-center mt-1 text-xs">
                                        <span className="text-[#3d4045]">Probation Status:</span>
                                        <Badge variant={employee.probation_status === 'Passed' ? 'mint' : 'lime'}>
                                            {employee.probation_status}
                                        </Badge>
                                    </div>
                                    {employee.probation_end_date && (
                                        <div className="flex justify-between items-center mt-1.5 text-xs">
                                            <span className="text-[#64666a]">Probation End Date:</span>
                                            <span className="font-bold text-black">{employee.probation_end_date}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 3: SECTION 3 - EDUCATION & QUALIFICATIONS */}
                <TabsContent value="section3" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-[#d8d9da] bg-white">
                            <CardHeader>
                                <CardTitle>Section 3: Education &amp; Qualifications</CardTitle>
                                <CardDescription>Academic degrees, certifying institution, and accreditation</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2 text-xs">
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Educational Qualification:</span>
                                    <span className="font-bold text-black text-sm">{employee.education_status || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Institution Graduated from:</span>
                                    <span className="font-semibold text-black text-sm">{employee.institution || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Year of Graduation E.C.:</span>
                                    <span className="font-semibold text-black text-sm">{employee.graduation_year_ec ? `${employee.graduation_year_ec} E.C.` : '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Cost Sharing Status:</span>
                                    <span className="font-semibold text-black text-sm">{employee.cost_sharing_status || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5">
                                    <span className="text-[#64666a]">Professional License:</span>
                                    <span className="font-bold text-[#008254] text-sm">{employee.professional_license || '—'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-[#d8d9da] bg-white">
                            <CardHeader>
                                <CardTitle>Trainings &amp; Professional Certifications</CardTitle>
                                <CardDescription>Institutional capacity development records</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                <div className="p-4 rounded-xs bg-[#effcf8] border border-[#b7ecda] text-xs">
                                    <span className="font-bold text-[#008254] block text-sm">Trainings Acquired</span>
                                    <p className="text-[#3d4045] mt-1.5 leading-relaxed">
                                        Specialized engineering workshops, statutory occupational safety courses, and certified vocational training programs.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xs bg-[#f7f7f7] border border-[#ebebec] text-xs flex justify-between items-center">
                                    <span className="text-[#64666a]">HRMS Training Registry Status:</span>
                                    <Badge variant="mint" className="text-xs font-semibold">Active &amp; Compliant</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 4: SECTION 4 - COMPENSATION & PAYROLL */}
                <TabsContent value="section4" className="max-w-3xl">
                    <Card className="border-[#d8d9da] bg-white shadow-xs">
                        <CardHeader>
                            <CardTitle>Section 4: Itemized Earnings, Allowances &amp; Deductions</CardTitle>
                            <CardDescription>Monthly contractual basic earnings, active allowances, statutory contributions, and net compensation</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            {/* Base and Active Allowances */}
                            <div className="space-y-2">
                                {Number(salary?.basic_salary) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-sm font-semibold text-black">Gross Basic Salary</span>
                                        <span className="font-bold text-black text-sm">{formatCurrency(salary?.basic_salary)}</span>
                                    </div>
                                )}
                                {Number(salary?.responsibility_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-xs text-[#3d4045]">Responsibility Allowance</span>
                                        <span className="font-semibold text-[#008254] text-xs">{formatCurrency(salary?.responsibility_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.project_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-xs text-[#3d4045]">Project Site Allowance</span>
                                        <span className="font-semibold text-[#008254] text-xs">{formatCurrency(salary?.project_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.position_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-xs text-[#3d4045]">Position / Title Allowance</span>
                                        <span className="font-semibold text-[#008254] text-xs">{formatCurrency(salary?.position_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.daily_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-xs text-[#3d4045]">Daily Allowance</span>
                                        <span className="font-semibold text-[#008254] text-xs">{formatCurrency(salary?.daily_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.desert_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-xs text-[#3d4045]">Desert Allowance</span>
                                        <span className="font-semibold text-[#008254] text-xs">{formatCurrency(salary?.desert_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.house_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-xs text-[#3d4045]">Housing Allowance</span>
                                        <span className="font-semibold text-[#008254] text-xs">{formatCurrency(salary?.house_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.transport_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-xs text-[#3d4045]">Transport Allowance</span>
                                        <span className="font-semibold text-[#008254] text-xs">{formatCurrency(salary?.transport_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.fuel_allowance_amount) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-xs text-[#3d4045]">
                                            Fuel Allowance {salary?.fuel_allowance_litres ? `(${salary.fuel_allowance_litres} L)` : ''}
                                        </span>
                                        <span className="font-semibold text-[#008254] text-xs">{formatCurrency(salary?.fuel_allowance_amount)}</span>
                                    </div>
                                )}
                                {Number(salary?.perdiem) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-xs text-[#3d4045]">Regular Perdiem</span>
                                        <span className="font-semibold text-[#008254] text-xs">{formatCurrency(salary?.perdiem)}</span>
                                    </div>
                                )}
                                {Number(salary?.monthly_perdiem) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-xs text-[#3d4045]">Monthly Regular Perdiem</span>
                                        <span className="font-semibold text-[#008254] text-xs">{formatCurrency(salary?.monthly_perdiem)}</span>
                                    </div>
                                )}
                                {Number(salary?.hardship_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-xs text-[#3d4045]">Hardship Allowance</span>
                                        <span className="font-semibold text-[#008254] text-xs">{formatCurrency(salary?.hardship_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.food_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-xs text-[#3d4045]">Food Allowance</span>
                                        <span className="font-semibold text-[#008254] text-xs">{formatCurrency(salary?.food_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.mobile_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-xs text-[#3d4045]">Mobile Allowance</span>
                                        <span className="font-semibold text-[#008254] text-xs">{formatCurrency(salary?.mobile_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.other_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                        <span className="text-xs text-[#3d4045]">Other Allowance</span>
                                        <span className="font-semibold text-[#008254] text-xs">{formatCurrency(salary?.other_allowance)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Total Gross Earning Banner */}
                            {Number(salary?.total_salary || salary?.basic_salary) > 0 && (
                                <div className="flex justify-between items-center bg-[#effcf8] p-3 rounded-xs border border-[#b7ecda]">
                                    <span className="text-sm font-bold text-black uppercase">Total Gross Earning</span>
                                    <span className="font-bold text-[#008254] text-lg">
                                        {formatCurrency(salary?.total_salary || salary?.basic_salary)}
                                    </span>
                                </div>
                            )}

                            {/* Statutory Deductions & Company Contributions (only if active) */}
                            {(Number(salary?.taxable_salary) > 0 || Number(salary?.income_tax) > 0 || Number(salary?.pension_employee) > 0 || Number(salary?.pension_company) > 0 || Number(salary?.total_deductions) > 0) && (
                                <div className="space-y-2 pt-2 border-t border-[#ebebec]">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#64666a] block mb-1">Statutory Deductions &amp; Pension Contributions</span>
                                    {Number(salary?.taxable_salary) > 0 && (
                                        <div className="flex justify-between items-center py-1.5 border-b border-[#ebebec]">
                                            <span className="text-xs text-[#3d4045]">Taxable Salary</span>
                                            <span className="font-medium text-black text-xs">{formatCurrency(salary?.taxable_salary)}</span>
                                        </div>
                                    )}
                                    {Number(salary?.income_tax) > 0 && (
                                        <div className="flex justify-between items-center py-1.5 border-b border-[#ebebec]">
                                            <span className="text-xs text-[#3d4045]">Employment Income Tax</span>
                                            <span className="font-medium text-[#de2828] text-xs">{formatCurrency(salary?.income_tax)}</span>
                                        </div>
                                    )}
                                    {Number(salary?.pension_employee) > 0 && (
                                        <div className="flex justify-between items-center py-1.5 border-b border-[#ebebec]">
                                            <span className="text-xs text-[#3d4045]">Pension - Employee Share (7%)</span>
                                            <span className="font-medium text-[#de2828] text-xs">{formatCurrency(salary?.pension_employee)}</span>
                                        </div>
                                    )}
                                    {Number(salary?.pension_company) > 0 && (
                                        <div className="flex justify-between items-center py-1.5 border-b border-[#ebebec]">
                                            <span className="text-xs text-[#3d4045]">Pension - Company Share (11%)</span>
                                            <span className="font-bold text-[#008254] text-xs">{formatCurrency(salary?.pension_company)}</span>
                                        </div>
                                    )}
                                    {Number(salary?.total_deductions) > 0 && (
                                        <div className="flex justify-between items-center py-1.5 border-b border-[#ebebec]">
                                            <span className="text-xs font-semibold text-black">Total Statutory Deductions</span>
                                            <span className="font-bold text-[#de2828] text-xs">{formatCurrency(salary?.total_deductions)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Net Take-Home Pay Banner */}
                            {((salary?.total_salary || 0) > 0) && (
                                <div className="flex justify-between items-center bg-[#f7f7f7] p-3 rounded-xs border border-[#ebebec]">
                                    <span className="text-xs font-bold text-black uppercase">Net Take-Home Pay</span>
                                    <span className="font-bold text-black text-base">
                                        {formatCurrency((salary?.total_salary || 0) - (salary?.total_deductions || 0))}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 5: SECTION 5 - EXPERIENCE & PERFORMANCE */}
                <TabsContent value="section5" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-[#d8d9da] bg-white">
                            <CardHeader>
                                <CardTitle>Section 5: Experience &amp; Service Longevity</CardTitle>
                                <CardDescription>Elhadar tenure, external experience, and machinery assignment</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2 text-xs">
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Elhadar Company Experience:</span>
                                    <span className="font-bold text-black text-sm">{displayCompanyExp}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Previous Outside Experience:</span>
                                    <span className="font-semibold text-black text-sm">{employee.previous_experience || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Total Accumulated Experience:</span>
                                    <span className="font-bold text-[#008254] text-sm">{displayTotalExp}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Job Grade &amp; Step:</span>
                                    <span className="font-semibold text-black text-sm">
                                        Grade {employee.grade || '—'} / Step {employee.step || '—'}
                                    </span>
                                </div>
                                {employee.plate_number && (
                                    <div className="flex justify-between items-center py-2.5">
                                        <span className="text-[#64666a]">Assigned Vehicle / Plate No:</span>
                                        <span className="font-bold text-[#008254] text-sm">{employee.plate_number}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-[#d8d9da] bg-white">
                            <CardHeader>
                                <CardTitle>Performance Reviews &amp; Disciplinary Record</CardTitle>
                                <CardDescription>Official appraisal scores and disciplinary standing</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2 text-xs">
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Performance Appraisal Round 1:</span>
                                    <span className="font-bold text-black text-sm">{employee.performance_score_round_1 || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Performance Appraisal Round 2:</span>
                                    <span className="font-bold text-black text-sm">{employee.performance_score_round_2 || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5">
                                    <span className="text-[#64666a]">Disciplinary Action:</span>
                                    <span className={`font-semibold text-sm ${employee.disciplinary_action ? 'text-[#de2828]' : 'text-[#008254]'}`}>
                                        {employee.disciplinary_action || 'Clean Record (None)'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 6: SECTION 6 - FINANCIAL & LEGAL IDS */}
                <TabsContent value="section6" className="space-y-6">
                    <Card className="border-[#d8d9da] bg-white">
                        <CardHeader>
                            <CardTitle>Section 6: Financial, Banking &amp; Pension Identifiers</CardTitle>
                            <CardDescription>Governmental pension registries, disbursement accounts, and TIN</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                                <div className="p-4 rounded-xs bg-[#f7f7f7] border border-[#ebebec]">
                                    <span className="text-[#64666a] block text-[11px] font-medium">Commercial Bank Name:</span>
                                    <span className="font-bold text-black text-sm mt-0.5 block">{employee.bank_name || 'Commercial Bank of Ethiopia'}</span>
                                </div>
                                <div className="p-4 rounded-xs bg-[#effcf8] border border-[#b7ecda]">
                                    <span className="text-[#008254] block text-[11px] font-semibold">Bank Account Number:</span>
                                    <span className="font-extrabold text-[#008254] text-base mt-0.5 block">{employee.bank_account_no || '—'}</span>
                                </div>
                                <div className="p-4 rounded-xs bg-[#f7f7f7] border border-[#ebebec]">
                                    <span className="text-[#64666a] block text-[11px] font-medium">Tax Identification Number (TIN):</span>
                                    <span className="font-bold text-black text-sm mt-0.5 block">{employee.tin_no || '—'}</span>
                                </div>
                                <div className="p-4 rounded-xs bg-[#effcf8] border border-[#b7ecda]">
                                    <span className="text-[#008254] block text-[11px] font-semibold">POESSA Pension No:</span>
                                    <span className="font-bold text-[#008254] text-sm mt-0.5 block">{employee.poessa_no || '—'}</span>
                                </div>
                                <div className="p-4 rounded-xs bg-[#effcf8] border border-[#b7ecda]">
                                    <span className="text-[#008254] block text-[11px] font-semibold">PSSSA Pension No:</span>
                                    <span className="font-bold text-[#008254] text-sm mt-0.5 block">{employee.psssa_no || '—'}</span>
                                </div>
                                <div className="p-4 rounded-xs bg-[#f7f7f7] border border-[#ebebec]">
                                    <span className="text-[#64666a] block text-[11px] font-medium">Social Security Number:</span>
                                    <span className="font-bold text-black text-sm mt-0.5 block">{employee.social_security_no || '—'}</span>
                                </div>
                                {employee.plate_number && (
                                    <div className="p-4 rounded-xs bg-[#f7f7f7] border border-[#ebebec] md:col-span-2 lg:col-span-1">
                                        <span className="text-[#64666a] block text-[11px] font-medium">Assigned Vehicle / Plate No:</span>
                                        <span className="font-bold text-black text-sm mt-0.5 block">{employee.plate_number}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 7: SECTION 7 - CONTACT INFORMATION & SECTION 8 REMARKS */}
                <TabsContent value="section7" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-[#d8d9da] bg-white">
                            <CardHeader>
                                <CardTitle>Section 7: Contact Information &amp; Emergency</CardTitle>
                                <CardDescription>Primary communications and next of kin contacts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2 text-xs">
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Primary Telephone No:</span>
                                    <span className="font-bold text-black text-sm">{formatEthPhone(employee.phone) || employee.phone || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">E-mail Address:</span>
                                    <span className="font-semibold text-black text-sm">{employee.email || 'None on file'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Emergency Contact Person:</span>
                                    <span className="font-bold text-black text-sm">{employee.emergency_contact_name || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Relationship:</span>
                                    <span className="font-bold text-[#008254] text-sm">{employee.emergency_contact_relationship || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5">
                                    <span className="text-[#64666a]">Emergency Contact Phone:</span>
                                    <span className="font-bold text-[#008254] text-sm">{employee.emergency_contact_phone || '—'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-[#d8d9da] bg-white">
                            <CardHeader>
                                <CardTitle>Residential Address Details</CardTitle>
                                <CardDescription>Official domicile recorded for statutory notification</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2 text-xs">
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Region:</span>
                                    <span className="font-semibold text-black text-sm">{employee.region || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">City:</span>
                                    <span className="font-semibold text-black text-sm">{employee.city || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#ebebec]">
                                    <span className="text-[#64666a]">Sub-City (Kifle Ketema):</span>
                                    <span className="font-semibold text-black text-sm">{employee.sub_city || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5">
                                    <span className="text-[#64666a]">Woreda / House Number:</span>
                                    <span className="font-semibold text-black text-sm">{employee.woreda || '—'} / {employee.house_no || '—'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Section 8: Expandable Remarks & Personnel Notes Card */}
                    <Card className="border-[#d8d9da] bg-white overflow-hidden">
                        <CardHeader 
                            className="py-3 px-6 border-b border-[#ebebec] bg-[#f7f7f7]/80 cursor-pointer select-none hover:bg-[#effcf8]/60 transition-colors"
                            onClick={() => setRemarksExpanded(!remarksExpanded)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#008254]" />
                                    <CardTitle className="text-sm font-bold text-black">
                                        Section 8: Remarks &amp; Personnel Notes
                                    </CardTitle>
                                    {employee.remarks ? (
                                        <Badge variant="mint" className="text-[10px] ml-2 font-semibold">Note Recorded</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-[10px] ml-2">No Remarks</Badge>
                                    )}
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64666a]">
                                    {remarksExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </Button>
                            </div>
                        </CardHeader>
                        {remarksExpanded && (
                            <CardContent className="p-6 text-xs text-[#3d4045] whitespace-pre-wrap leading-relaxed bg-white">
                                {employee.remarks || (
                                    <span className="text-[#64666a] italic">
                                        No official remarks or personnel notes logged for this employee.
                                    </span>
                                )}
                            </CardContent>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            

            {/* Discrepancy History Table */}
            <Card className="border-[#d8d9da] bg-white">
                <CardHeader>
                    <CardTitle className="text-base">Data Correction Requests History</CardTitle>
                    <CardDescription>Submitted discrepancies under review by HR Administration</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                    {discrepancyReports.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#64666a]">
                            No data discrepancy reports submitted yet. If you notice any error in your records, click "Report Discrepancy" above.
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[400px] custom-scrollbar">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-[#f7f7f7] sticky top-0 z-20 shadow-[0_1px_0_0_#ebebec]">
                                    <tr className="border-b border-[#ebebec] text-[#64666a] uppercase">
                                        <th className="py-2.5 px-3 font-bold bg-[#f7f7f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#ebebec]">Field name</th>
                                        <th className="py-2.5 px-3 font-bold bg-[#f7f7f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#ebebec]">Current record</th>
                                        <th className="py-2.5 px-3 font-bold bg-[#f7f7f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#ebebec]">Proposed correction</th>
                                        <th className="py-2.5 px-3 font-bold bg-[#f7f7f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#ebebec]">Explanation</th>
                                        <th className="py-2.5 px-3 font-bold text-right bg-[#f7f7f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#ebebec]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#ebebec]">
                                    {discrepancyReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-[#f7f7f7]">
                                            <td className="py-3 px-3 font-semibold text-black">{report.field_name}</td>
                                            <td className="py-3 px-3 text-[#64666a]">{report.current_value || 'â€”'}</td>
                                            <td className="py-3 px-3 font-bold text-[#008254]">{report.proposed_value}</td>
                                            <td className="py-3 px-3 text-[#3d4045] max-w-xs truncate">{report.explanation || 'â€”'}</td>
                                            <td className="py-3 px-3 text-right">
                                                <Badge 
                                                    variant={
                                                        report.status === 'Approved' ? 'mint' :
                                                        report.status === 'Rejected' ? 'destructive' : 'secondary'
                                                    }
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

            {/* Discrepancy Reporting Modal (Shadcn Dialog) */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-md bg-white border-[#d8d9da] p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-black flex items-center gap-2">
                            <Send className="w-4 h-4 text-[#008254]" />
                            Report Data Discrepancy
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#64666a]">
                            Submit an official correction request to HR Administration. Your submission will be audited and reviewed.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
                                Field with Discrepancy
                            </label>
                            <select
                                value={data.field_name}
                                onChange={(e) => setData('field_name', e.target.value)}
                                className="w-full h-10 rounded-xs border border-[#d8d9da] bg-[#f7f7f7] px-3 text-xs text-[#3d4045] focus:outline-none focus:ring-1 focus:ring-[#008254]"
                            >
                                <optgroup label="Personal & Identity">
                                    <option value="Full Name">Full Name</option>
                                    <option value="Gender">Gender</option>
                                    <option value="DOB (E.C)">Date of Birth (E.C)</option>
                                    <option value="DOB (G.C)">Date of Birth (G.C)</option>
                                    <option value="Marital Status">Marital Status</option>
                                    <option value="Phone Number">Phone Number</option>
                                    <option value="Email Address">Email Address</option>
                                </optgroup>
                                <optgroup label="Residence & Emergency">
                                    <option value="Region">Region</option>
                                    <option value="City">City / Town</option>
                                    <option value="Sub-City">Sub-City</option>
                                    <option value="Woreda">Woreda</option>
                                    <option value="House No">House Number</option>
                                    <option value="Emergency Contact Name">Emergency Contact Name</option>
                                    <option value="Emergency Contact Relationship">Emergency Contact Relationship</option>
                                    <option value="Emergency Contact Phone">Emergency Contact Phone</option>
                                </optgroup>
                                <optgroup label="Pension, Tax & Banking">
                                    <option value="POESSA Pension No">POESSA Pension No</option>
                                    <option value="PSSSA Pension No">PSSSA Pension No</option>
                                    <option value="Social Security Scheme No">Social Security Scheme No</option>
                                    <option value="Tax ID (TIN)">Tax ID (TIN)</option>
                                    <option value="Commercial Bank Name">Commercial Bank Name</option>
                                    <option value="Commercial Bank Account">Commercial Bank Account</option>
                                </optgroup>
                                <optgroup label="Education & Credentials">
                                    <option value="Education Attainment Level">Education Attainment Level</option>
                                    <option value="Institution / University">Institution / University</option>
                                    <option value="Graduation Year (E.C.)">Graduation Year (E.C.)</option>
                                    <option value="Professional License">Professional License / Certificate</option>
                                    <option value="Cost Sharing Obligation Status">Cost Sharing Obligation Status</option>
                                </optgroup>
                                <optgroup label="Operations & Deployment">
                                    <option value="Position Title">Position Title</option>
                                    <option value="Department">Department</option>
                                    <option value="Workplace / Deployment Site">Workplace / Deployment Site</option>
                                    <option value="Vehicle Plate Number">Vehicle Plate Number</option>
                                    <option value="Company Experience">Company Experience</option>
                                    <option value="Previous Experience">Previous Relevant Experience</option>
                                </optgroup>
                                <optgroup label="Compensation & Allowances">
                                    <option value="Basic Salary">Basic Salary</option>
                                    <option value="Responsibility Allowance">Responsibility Allowance</option>
                                    <option value="Hardship Allowance">Hardship Allowance</option>
                                    <option value="Desert Allowance">Desert Allowance</option>
                                    <option value="Daily / Per Diem Allowance">Daily / Per Diem Allowance</option>
                                    <option value="Transportation / Fuel Allowance">Transportation / Fuel Allowance</option>
                                    <option value="Housing Allowance">Housing Allowance</option>
                                </optgroup>
                                <optgroup label="General">
                                    <option value="Other">Other Information</option>
                                </optgroup>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
                                Current Value in System (Optional)
                            </label>
                            <Input
                                value={data.current_value}
                                onChange={(e) => setData('current_value', e.target.value)}
                                placeholder="Value shown right now..."
                                className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
                                Proposed Correct Value <span className="text-[#de2828]">*</span>
                            </label>
                            <Input
                                required
                                value={data.proposed_value}
                                onChange={(e) => setData('proposed_value', e.target.value)}
                                placeholder="Enter the correct information..."
                                className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                            />
                            {errors.proposed_value && (
                                <p className="text-xs text-[#de2828] mt-1">{errors.proposed_value}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
                                Explanation / Supporting Details
                            </label>
                            <textarea
                                value={data.explanation}
                                onChange={(e) => setData('explanation', e.target.value)}
                                rows={3}
                                placeholder="Provide context or document reference for HR verification..."
                                className="w-full rounded-xs border border-[#d8d9da] bg-[#f7f7f7] p-2.5 text-xs text-[#3d4045] focus:outline-none focus:ring-1 focus:ring-[#008254]"
                            />
                        </div>

                        <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-[#ebebec]">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowModal(false)}
                                className="text-xs border-[#d8d9da] rounded-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[#008254] hover:bg-[#006642] text-white text-xs font-bold uppercase rounded-xs"
                            >
                                {processing ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Remove Profile Photo Confirmation Dialog */}
            <AlertDialog open={deletePhotoOpen} onOpenChange={setDeletePhotoOpen}>
                <AlertDialogContent className="bg-white border-[#d8d9da]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-black">
                            Remove Profile Photo?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-[#64666a]">
                            Are you sure you want to delete your profile photo? Your avatar will revert to your name initials.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="text-xs h-9 border-[#d8d9da] hover:bg-[#f7f7f7]">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeletePhoto}
                            className="text-xs h-9 bg-red-600 hover:bg-red-700 text-white font-semibold"
                        >
                            Delete Photo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Layout>
    );
}
