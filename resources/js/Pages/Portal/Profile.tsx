import { useRef, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';
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
                <Card className="border-[#d2d2d7] bg-white p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-[#6e6e73] mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-black">No Linked Employee Record Found</h3>
                    <p className="text-sm text-[#6e6e73] mt-1">Please contact HR Administration to link your user account to an employee profile.</p>
                </Card>
            </Layout>
        );
    }

    const salary = employee.current_salary;
    const displayCompanyExp = employee.company_experience && !employee.company_experience.startsWith('=') && !employee.company_experience.includes('DATEDIF') && !employee.company_experience.includes('Year,') ? employee.company_experience : (tenure?.formatted || 'â€”');
    const displayTotalExp = employee.total_experience && !employee.total_experience.startsWith('=') && !employee.total_experience.includes('DATEDIF') && !employee.total_experience.includes('Year,') ? employee.total_experience : (employee.previous_experience ? `${employee.previous_experience} + ${displayCompanyExp}` : displayCompanyExp);

    return (
        <Layout
            title="Employee Self-Service Portal"
            subtitle="Review your verified personnel records, payroll allowances, and report data discrepancies."
        >
            <Head title={`Self-Service: ${employee.full_name} - Elhadar Engineering HRMS`} />

            {/* Header Profile Dossier Card */}
            <Card className="border-[#d2d2d7] bg-white mb-6 overflow-hidden">
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
                                    className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border border-[#ffd1cf] text-[#ff3b30] hover:bg-[#fff5f5] shadow-sm transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <Input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/png,image/jpeg,image/webp,image/jpg"
                                onChange={handlePhotoChange}
                            />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-xl bg-[#f5f5f7] text-[#0066cc] border border-[#d2d2d7]">
                                    {employee.file_no}
                                </span>
                                <Badge variant={employee.status === 'Permanent' ? 'secondary' : employee.status === 'Separated' ? 'destructive' : 'outline'}>
                                    {employee.status}
                                </Badge>
                            </div>
                            <h1 className="text-2xl font-bold text-black tracking-tight">
                                {employee.full_name}
                            </h1>
                            <div className="flex flex-col gap-1.5 text-xs text-[#424245] mt-1.5 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
                                    {employee.department?.name || 'General Engineering'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
                                    {employee.work_place}
                                </span>
                                <span>{employee.position}</span>
                                {employee.phone && (
                                    <span className="flex items-center gap-1.5 font-semibold text-[#0066cc]">
                                        <Phone className="w-3.5 h-3.5 shrink-0" />
                                        {formatEthPhone(employee.phone)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2.5 w-full md:w-auto">
                        <div className="flex flex-col items-start sm:items-end w-full md:w-auto p-4 rounded-lg bg-[#f5f5f7] border border-[#e8e8ed]">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e73]">
                                Total Monthly Compensation
                            </span>
                            <span className="text-xl sm:text-2xl font-bold text-[#0066cc] mt-0.5 break-words">
                                {formatCurrency(salary?.total_salary || salary?.basic_salary)}
                            </span>
                            <span className="text-[11px] text-[#6e6e73]">
                                Basic: {formatCurrency(salary?.basic_salary)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Statutory Fast-Facts Ribbon (NerdWallet Comparison Spec) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border-t border-[#e8e8ed] bg-[#f5f5f7]/40 divide-y sm:divide-y-0 sm:divide-x divide-[#e8e8ed]">
                    <div className="p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e73] block">
                            Tenure of Service
                        </span>
                        <span className="text-base font-bold text-black mt-1 block">
                            {tenure.formatted}
                        </span>
                        <span className="text-[11px] text-[#0066cc] font-medium block">
                            Since {employee.employment_date_ec} E.C.
                        </span>
                    </div>

                    <div className="p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e73] block">
                            Annual Leave Entitlement
                        </span>
                        <span className="text-base font-bold text-black mt-1 block">
                            {annualLeaveEntitlement} Working Days
                        </span>
                        <span className="text-[11px] text-[#6e6e73] block" title="Annual leave set by the Ethiopian Labour Proclamation No. 1156/2019 (Articles 77â€“78)">
                            16 days + 1 day per 2 years of service
                        </span>
                    </div>

                    <div className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e73] block">
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
                        <span className="text-[11px] text-[#6e6e73] block">
                            {retirementInfo 
                                ? (retirementInfo.is_retired 
                                    ? 'Statutory age reached (60 yrs)' 
                                    : `${Math.round(retirementInfo.days_remaining / 365)} years remaining`)
                                : 'Birthdate required'}
                        </span>
                    </div>

                    <div className="p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e73] block">
                            Banking & Payroll
                        </span>
                        <span className="text-base font-bold text-black mt-1 block break-words">
                            {employee.bank_account_no || 'No account logged'}
                        </span>
                        <span className="text-[11px] text-[#0066cc] font-medium block">
                            {employee.bank_name || 'CBE'}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Section 1 to 7 Master List Tabs */}
            <Tabs defaultValue="section1" className="w-full">
                <TabsList className="w-full overflow-x-auto flex-nowrap justify-start gap-2 sm:gap-4 border-b border-[#e8e8ed] scrollbar-thin mb-4 pb-0">
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
                    <div className="p-4 rounded-lg bg-[#f5f5f7] border border-[#d2d2d7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white border-2 border-[#0066cc] flex flex-col items-center justify-center shadow-sm shrink-0">
                                <span className="text-2xl font-extrabold text-[#0066cc] leading-none">
                                    {employee.age ?? (employee.birth_date ? new Date().getFullYear() - new Date(employee.birth_date).getFullYear() : 'â€”')}
                                </span>
                                <span className="text-[9px] font-bold text-[#6e6e73] uppercase">Years</span>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0066cc] block">
                                    Section 1: Date of Birth &amp; Age
                                </span>
                                <div className="flex flex-wrap items-center gap-3 text-sm mt-0.5 font-bold text-black">
                                    <span>{employee.birth_date_ec ? `${employee.birth_date_ec} E.C.` : 'No E.C. DOB'}</span>
                                    <span className="text-[#6e6e73] font-normal">|</span>
                                    <span className="text-[#424245] font-semibold">{employee.birth_date ? `${employee.birth_date} G.C.` : 'No G.C. DOB'}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-[#6e6e73]">Marital Status:</span>
                                    <span className="text-xs font-bold text-[#0066cc] px-2 py-0.5 rounded-xl bg-white border border-[#d2d2d7]">
                                        {employee.marital_status || 'Single'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-start sm:items-end">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e73]">Retirement Status</span>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                    variant={retirementInfo?.is_retired ? 'destructive' : (retirementInfo?.is_near ? 'outline' : 'secondary')}
                                    className="text-xs font-bold px-2 py-0.5"
                                >
                                    {retirementInfo?.status_label || (retirementInfo?.is_retired ? 'Retired' : 'Active (Not Retired)')}
                                </Badge>
                            </div>
                            <span className="text-xs text-[#6e6e73] mt-0.5">
                                {retirementInfo ? `${retirementInfo.retirement_date} (${Math.round(retirementInfo.days_remaining / 365)} yrs remaining)` : 'DOB required'}
                            </span>
                        </div>
                    </div>

                    {/* Section 1 Master Attributes Grid */}
                    <Card className="border-[#d2d2d7] bg-white">
                        <CardHeader>
                            <CardTitle>Section 1: Personal Identification Attributes</CardTitle>
                            <CardDescription>Verified personal identification and demographic records</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                                <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed]">
                                    <span className="text-[#6e6e73] block text-[11px] font-medium">Personnel File No:</span>
                                    <span className="font-bold text-black text-sm mt-0.5 block">{employee.file_no}</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed]">
                                    <span className="text-[#6e6e73] block text-[11px] font-medium">Full Name with Grand Father:</span>
                                    <span className="font-bold text-black text-sm mt-0.5 block">{employee.full_name}</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed]">
                                    <span className="text-[#6e6e73] block text-[11px] font-medium">Gender:</span>
                                    <span className="font-semibold text-black text-sm mt-0.5 block">{employee.gender}</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed]">
                                    <span className="text-[#6e6e73] block text-[11px] font-medium">Marital Status:</span>
                                    <span className="font-semibold text-black text-sm mt-0.5 block">{employee.marital_status || 'Single'}</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed]">
                                    <span className="text-[#6e6e73] block text-[11px] font-medium">Date of Birth E.C.:</span>
                                    <span className="font-bold text-[#0066cc] text-sm mt-0.5 block">{employee.birth_date_ec ? `${employee.birth_date_ec} E.C.` : 'â€”'}</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed]">
                                    <span className="text-[#6e6e73] block text-[11px] font-medium">Date of Birth G.C.:</span>
                                    <span className="font-semibold text-black text-sm mt-0.5 block">{employee.birth_date ? `${employee.birth_date} G.C.` : 'â€”'}</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
                                    <span className="text-[#0066cc] block text-[11px] font-semibold">Calculated Age:</span>
                                    <span className="font-bold text-[#0066cc] text-base mt-0.5 block">
                                        {employee.age ? `${employee.age} Years Old` : 'â€”'}
                                    </span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
                                    <span className="text-[#0066cc] block text-[11px] font-semibold">Retirement Status:</span>
                                    <span className="font-bold text-black text-sm mt-0.5 block">
                                        {retirementInfo?.status_label || (retirementInfo?.is_retired ? 'Retired' : 'Active (Not Retired)')}
                                    </span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed]">
                                    <span className="text-[#6e6e73] block text-[11px] font-medium">Scheduled Retirement Date:</span>
                                    <span className="font-semibold text-black text-sm mt-0.5 block">
                                        {retirementInfo?.retirement_date || 'â€”'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: SECTION 2 - EMPLOYMENT DETAILS */}
                <TabsContent value="section2" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-[#d2d2d7] bg-white">
                            <CardHeader>
                                <CardTitle>Section 2: Employment Details &amp; Assignment</CardTitle>
                                <CardDescription>Contractual assignment, project site, job grade and dual start dates</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#0066cc]">Date of Employment</span>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-sm font-bold text-black">Ethiopian Calendar:</span>
                                        <span className="font-bold text-[#0066cc]">{employee.employment_date_ec} E.C.</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-0.5">
                                        <span className="text-xs text-[#6e6e73]">Gregorian Equivalent:</span>
                                        <span className="text-xs font-semibold text-black">{employee.employment_date} G.C.</span>
                                    </div>
                                </div>

                                {(employee.status === 'Separated' || employee.separation) && (
                                    <div className="p-3.5 rounded-xl bg-[#fff5f5] border border-[#ffd1cf]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider text-red-700">Date of Termination</span>
                                            <Badge variant="destructive" className="text-[10px]">Separated</Badge>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-sm font-bold text-black">Ethiopian Calendar:</span>
                                            <span className="font-bold text-red-700">{employee.separation?.termination_date_ec || 'â€”'} E.C.</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <span className="text-xs text-[#6e6e73]">Gregorian Equivalent:</span>
                                            <span className="text-xs font-semibold text-black">{employee.separation?.effective_date || 'â€”'} G.C.</span>
                                        </div>
                                        {employee.separation?.separation_type && (
                                            <div className="flex justify-between items-center mt-1 pt-1 border-t border-[#ffd1cf]/60 text-xs">
                                                <span className="text-[#6e6e73]">Separation Type:</span>
                                                <span className="font-semibold text-black">{employee.separation.separation_type.replace(/_/g, ' ')}</span>
                                            </div>
                                        )}
                                        {employee.separation?.reason && (
                                            <div className="flex justify-between items-center mt-0.5 text-xs">
                                                <span className="text-[#6e6e73]">Reason:</span>
                                                <span className="font-medium text-black">{employee.separation.reason}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2 pt-2 text-xs">
                                    <div className="flex justify-between items-center py-1.5 border-b border-[#e8e8ed]">
                                        <span className="text-[#6e6e73]">Department:</span>
                                        <span className="font-semibold text-black">{employee.department?.name || 'â€”'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-[#e8e8ed]">
                                        <span className="text-[#6e6e73]">Work Place / Project:</span>
                                        <span className="font-semibold text-black">{employee.work_place}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-[#e8e8ed]">
                                        <span className="text-[#6e6e73]">Job Title:</span>
                                        <span className="font-semibold text-black">{employee.position}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-[#e8e8ed]">
                                        <span className="text-[#6e6e73]">Job Grade:</span>
                                        <span className="font-bold text-[#0066cc]">
                                            {employee.grade ? `Grade ${employee.grade}` : 'â€”'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-[#e8e8ed]">
                                        <span className="text-[#6e6e73]">Steps:</span>
                                        <span className="font-bold text-[#0066cc]">
                                            {employee.step ? `Step ${employee.step}` : 'â€”'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-[#e8e8ed]">
                                        <span className="text-[#6e6e73]">Term of Employment:</span>
                                        <Badge variant={employee.status === 'Permanent' ? 'secondary' : employee.status === 'Separated' ? 'destructive' : 'outline'}>
                                            {employee.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-[#e8e8ed]">
                                        <span className="text-[#6e6e73]">Contract Classification:</span>
                                        <span className="font-semibold text-black">{employee.contract_type}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5">
                                        <span className="text-[#6e6e73]">Employment Type:</span>
                                        <span className="font-semibold text-black">{employee.employment_type}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-[#d2d2d7] bg-white">
                            <CardHeader>
                                <CardTitle>Milestones, Tenure &amp; Leave</CardTitle>
                                <CardDescription>Accumulated longevity and statutory leave entitlements</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#0066cc] block">Accumulated Service Tenure</span>
                                    <span className="text-xl font-bold text-black block mt-1">{tenure.formatted}</span>
                                    <span className="text-xs text-[#6e6e73] block mt-0.5">Continuous service since {employee.employment_date_ec} E.C.</span>
                                </div>

                                <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-[#6e6e73] font-medium block">Active Annual Entitlement</span>
                                        <span className="text-2xl font-bold text-[#0066cc] block mt-0.5">{annualLeaveEntitlement} Days</span>
                                        <span className="text-[11px] text-[#6e6e73] block mt-0.5">Proclamation 1156/2019 (16 days + 1 day / 2 yrs)</span>
                                    </div>
                                    <Award className="w-8 h-8 text-[#0066cc]/40" />
                                </div>

                                <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed]">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">Probation Details</span>
                                    <div className="flex justify-between items-center mt-1 text-xs">
                                        <span className="text-[#424245]">Probation Status:</span>
                                        <Badge variant={employee.probation_status === 'Passed' ? 'secondary' : 'outline'}>
                                            {employee.probation_status}
                                        </Badge>
                                    </div>
                                    {employee.probation_end_date && (
                                        <div className="flex justify-between items-center mt-1.5 text-xs">
                                            <span className="text-[#6e6e73]">Probation End Date:</span>
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
                        <Card className="border-[#d2d2d7] bg-white">
                            <CardHeader>
                                <CardTitle>Section 3: Education &amp; Qualifications</CardTitle>
                                <CardDescription>Academic degrees, certifying institution, and accreditation</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2 text-xs">
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Educational Qualification:</span>
                                    <span className="font-bold text-black text-sm">{employee.education_status || 'â€”'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Institution Graduated from:</span>
                                    <span className="font-semibold text-black text-sm">{employee.institution || 'â€”'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Year of Graduation E.C.:</span>
                                    <span className="font-semibold text-black text-sm">{employee.graduation_year_ec ? `${employee.graduation_year_ec} E.C.` : 'â€”'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Cost Sharing Status:</span>
                                    <span className="font-semibold text-black text-sm">{employee.cost_sharing_status || 'â€”'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5">
                                    <span className="text-[#6e6e73]">Professional License:</span>
                                    <span className="font-bold text-[#0066cc] text-sm">{employee.professional_license || 'â€”'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-[#d2d2d7] bg-white">
                            <CardHeader>
                                <CardTitle>Trainings &amp; Professional Certifications</CardTitle>
                                <CardDescription>Institutional capacity development records</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7] text-xs">
                                    <span className="font-bold text-[#0066cc] block text-sm">Trainings Acquired</span>
                                    <p className="text-[#424245] mt-1.5 leading-relaxed">
                                        Specialized engineering workshops, statutory occupational safety courses, and certified vocational training programs.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] text-xs flex justify-between items-center">
                                    <span className="text-[#6e6e73]">HRMS Training Registry Status:</span>
                                    <Badge variant="mint" className="text-xs font-semibold">Active &amp; Compliant</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 4: SECTION 4 - COMPENSATION & PAYROLL */}
                <TabsContent value="section4" className="max-w-3xl">
                    <Card className="border-[#d2d2d7] bg-white shadow-sm">
                        <CardHeader>
                            <CardTitle>Section 4: Itemized Earnings, Allowances &amp; Deductions</CardTitle>
                            <CardDescription>Monthly contractual basic earnings, active allowances, statutory contributions, and net compensation</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            {/* Base and Active Allowances */}
                            <div className="space-y-2">
                                {Number(salary?.basic_salary) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-sm font-semibold text-black">Gross Basic Salary</span>
                                        <span className="font-bold text-black text-sm">{formatCurrency(salary?.basic_salary)}</span>
                                    </div>
                                )}
                                {Number(salary?.responsibility_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-xs text-[#424245]">Responsibility Allowance</span>
                                        <span className="font-semibold text-[#0066cc] text-xs">{formatCurrency(salary?.responsibility_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.project_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-xs text-[#424245]">Project Site Allowance</span>
                                        <span className="font-semibold text-[#0066cc] text-xs">{formatCurrency(salary?.project_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.position_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-xs text-[#424245]">Position / Title Allowance</span>
                                        <span className="font-semibold text-[#0066cc] text-xs">{formatCurrency(salary?.position_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.daily_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-xs text-[#424245]">Daily Allowance</span>
                                        <span className="font-semibold text-[#0066cc] text-xs">{formatCurrency(salary?.daily_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.desert_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-xs text-[#424245]">Desert Allowance</span>
                                        <span className="font-semibold text-[#0066cc] text-xs">{formatCurrency(salary?.desert_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.house_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-xs text-[#424245]">Housing Allowance</span>
                                        <span className="font-semibold text-[#0066cc] text-xs">{formatCurrency(salary?.house_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.transport_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-xs text-[#424245]">Transport Allowance</span>
                                        <span className="font-semibold text-[#0066cc] text-xs">{formatCurrency(salary?.transport_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.fuel_allowance_amount) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-xs text-[#424245]">
                                            Fuel Allowance {salary?.fuel_allowance_litres ? `(${salary.fuel_allowance_litres} L)` : ''}
                                        </span>
                                        <span className="font-semibold text-[#0066cc] text-xs">{formatCurrency(salary?.fuel_allowance_amount)}</span>
                                    </div>
                                )}
                                {Number(salary?.perdiem) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-xs text-[#424245]">Regular Perdiem</span>
                                        <span className="font-semibold text-[#0066cc] text-xs">{formatCurrency(salary?.perdiem)}</span>
                                    </div>
                                )}
                                {Number(salary?.monthly_perdiem) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-xs text-[#424245]">Monthly Regular Perdiem</span>
                                        <span className="font-semibold text-[#0066cc] text-xs">{formatCurrency(salary?.monthly_perdiem)}</span>
                                    </div>
                                )}
                                {Number(salary?.hardship_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-xs text-[#424245]">Hardship Allowance</span>
                                        <span className="font-semibold text-[#0066cc] text-xs">{formatCurrency(salary?.hardship_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.food_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-xs text-[#424245]">Food Allowance</span>
                                        <span className="font-semibold text-[#0066cc] text-xs">{formatCurrency(salary?.food_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.mobile_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-xs text-[#424245]">Mobile Allowance</span>
                                        <span className="font-semibold text-[#0066cc] text-xs">{formatCurrency(salary?.mobile_allowance)}</span>
                                    </div>
                                )}
                                {Number(salary?.other_allowance) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-[#e8e8ed]">
                                        <span className="text-xs text-[#424245]">Other Allowance</span>
                                        <span className="font-semibold text-[#0066cc] text-xs">{formatCurrency(salary?.other_allowance)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Total Gross Earning Banner */}
                            {Number(salary?.total_salary || salary?.basic_salary) > 0 && (
                                <div className="flex justify-between items-center bg-[#f5f5f7] p-3 rounded-xl border border-[#d2d2d7]">
                                    <span className="text-sm font-bold text-black uppercase">Total Gross Earning</span>
                                    <span className="font-bold text-[#0066cc] text-lg">
                                        {formatCurrency(salary?.total_salary || salary?.basic_salary)}
                                    </span>
                                </div>
                            )}

                            {/* Statutory Deductions & Company Contributions (only if active) */}
                            {(Number(salary?.taxable_salary) > 0 || Number(salary?.income_tax) > 0 || Number(salary?.pension_employee) > 0 || Number(salary?.pension_company) > 0 || Number(salary?.total_deductions) > 0) && (
                                <div className="space-y-2 pt-2 border-t border-[#e8e8ed]">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#6e6e73] block mb-1">Statutory Deductions &amp; Pension Contributions</span>
                                    {Number(salary?.taxable_salary) > 0 && (
                                        <div className="flex justify-between items-center py-1.5 border-b border-[#e8e8ed]">
                                            <span className="text-xs text-[#424245]">Taxable Salary</span>
                                            <span className="font-medium text-black text-xs">{formatCurrency(salary?.taxable_salary)}</span>
                                        </div>
                                    )}
                                    {Number(salary?.income_tax) > 0 && (
                                        <div className="flex justify-between items-center py-1.5 border-b border-[#e8e8ed]">
                                            <span className="text-xs text-[#424245]">Employment Income Tax</span>
                                            <span className="font-medium text-[#ff3b30] text-xs">{formatCurrency(salary?.income_tax)}</span>
                                        </div>
                                    )}
                                    {Number(salary?.pension_employee) > 0 && (
                                        <div className="flex justify-between items-center py-1.5 border-b border-[#e8e8ed]">
                                            <span className="text-xs text-[#424245]">Pension - Employee Share (7%)</span>
                                            <span className="font-medium text-[#ff3b30] text-xs">{formatCurrency(salary?.pension_employee)}</span>
                                        </div>
                                    )}
                                    {Number(salary?.pension_company) > 0 && (
                                        <div className="flex justify-between items-center py-1.5 border-b border-[#e8e8ed]">
                                            <span className="text-xs text-[#424245]">Pension - Company Share (11%)</span>
                                            <span className="font-bold text-[#0066cc] text-xs">{formatCurrency(salary?.pension_company)}</span>
                                        </div>
                                    )}
                                    {Number(salary?.total_deductions) > 0 && (
                                        <div className="flex justify-between items-center py-1.5 border-b border-[#e8e8ed]">
                                            <span className="text-xs font-semibold text-black">Total Statutory Deductions</span>
                                            <span className="font-bold text-[#ff3b30] text-xs">{formatCurrency(salary?.total_deductions)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Net Take-Home Pay Banner */}
                            {((salary?.total_salary || 0) > 0) && (
                                <div className="flex justify-between items-center bg-[#f5f5f7] p-3 rounded-xl border border-[#e8e8ed]">
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
                        <Card className="border-[#d2d2d7] bg-white">
                            <CardHeader>
                                <CardTitle>Section 5: Experience &amp; Service Longevity</CardTitle>
                                <CardDescription>Elhadar tenure, external experience, and machinery assignment</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2 text-xs">
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Elhadar Company Experience:</span>
                                    <span className="font-bold text-black text-sm">{displayCompanyExp}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Previous Outside Experience:</span>
                                    <span className="font-semibold text-black text-sm">{employee.previous_experience || 'â€”'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Total Accumulated Experience:</span>
                                    <span className="font-bold text-[#0066cc] text-sm">{displayTotalExp}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Job Grade &amp; Step:</span>
                                    <span className="font-semibold text-black text-sm">
                                        Grade {employee.grade || 'â€”'} / Step {employee.step || 'â€”'}
                                    </span>
                                </div>
                                {employee.plate_number && (
                                    <div className="flex justify-between items-center py-2.5">
                                        <span className="text-[#6e6e73]">Assigned Vehicle / Plate No:</span>
                                        <span className="font-bold text-[#0066cc] text-sm">{employee.plate_number}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-[#d2d2d7] bg-white">
                            <CardHeader>
                                <CardTitle>Performance Reviews &amp; Disciplinary Record</CardTitle>
                                <CardDescription>Official appraisal scores and disciplinary standing</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2 text-xs">
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Performance Appraisal Round 1:</span>
                                    <span className="font-bold text-black text-sm">{employee.performance_score_round_1 || 'â€”'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Performance Appraisal Round 2:</span>
                                    <span className="font-bold text-black text-sm">{employee.performance_score_round_2 || 'â€”'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5">
                                    <span className="text-[#6e6e73]">Disciplinary Action:</span>
                                    <span className={`font-semibold text-sm ${employee.disciplinary_action ? 'text-[#ff3b30]' : 'text-[#0066cc]'}`}>
                                        {employee.disciplinary_action || 'Clean Record (None)'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 6: SECTION 6 - FINANCIAL & LEGAL IDS */}
                <TabsContent value="section6" className="space-y-6">
                    <Card className="border-[#d2d2d7] bg-white">
                        <CardHeader>
                            <CardTitle>Section 6: Financial, Banking &amp; Pension Identifiers</CardTitle>
                            <CardDescription>Governmental pension registries, disbursement accounts, and TIN</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                                <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed]">
                                    <span className="text-[#6e6e73] block text-[11px] font-medium">Commercial Bank Name:</span>
                                    <span className="font-bold text-black text-sm mt-0.5 block">{employee.bank_name || 'Commercial Bank of Ethiopia'}</span>
                                </div>
                                <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
                                    <span className="text-[#0066cc] block text-[11px] font-semibold">Bank Account Number:</span>
                                    <span className="font-extrabold text-[#0066cc] text-base mt-0.5 block">{employee.bank_account_no || 'â€”'}</span>
                                </div>
                                <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed]">
                                    <span className="text-[#6e6e73] block text-[11px] font-medium">Tax Identification Number (TIN):</span>
                                    <span className="font-bold text-black text-sm mt-0.5 block">{employee.tin_no || 'â€”'}</span>
                                </div>
                                <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
                                    <span className="text-[#0066cc] block text-[11px] font-semibold">POESSA Pension No:</span>
                                    <span className="font-bold text-[#0066cc] text-sm mt-0.5 block">{employee.poessa_no || 'â€”'}</span>
                                </div>
                                <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]">
                                    <span className="text-[#0066cc] block text-[11px] font-semibold">PSSSA Pension No:</span>
                                    <span className="font-bold text-[#0066cc] text-sm mt-0.5 block">{employee.psssa_no || 'â€”'}</span>
                                </div>
                                <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed]">
                                    <span className="text-[#6e6e73] block text-[11px] font-medium">Social Security Number:</span>
                                    <span className="font-bold text-black text-sm mt-0.5 block">{employee.social_security_no || 'â€”'}</span>
                                </div>
                                {employee.plate_number && (
                                    <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] md:col-span-2 lg:col-span-1">
                                        <span className="text-[#6e6e73] block text-[11px] font-medium">Assigned Vehicle / Plate No:</span>
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
                        <Card className="border-[#d2d2d7] bg-white">
                            <CardHeader>
                                <CardTitle>Section 7: Contact Information &amp; Emergency</CardTitle>
                                <CardDescription>Primary communications and next of kin contacts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2 text-xs">
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Primary Telephone No:</span>
                                    <span className="font-bold text-black text-sm">{formatEthPhone(employee.phone) || employee.phone || 'â€”'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">E-mail Address:</span>
                                    <span className="font-semibold text-black text-sm">{employee.email || 'None on file'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Emergency Contact Person:</span>
                                    <span className="font-bold text-black text-sm">{employee.emergency_contact_name || 'â€”'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Relationship:</span>
                                    <span className="font-bold text-[#0066cc] text-sm">{employee.emergency_contact_relationship || 'â€”'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5">
                                    <span className="text-[#6e6e73]">Emergency Contact Phone:</span>
                                    <span className="font-bold text-[#0066cc] text-sm">{employee.emergency_contact_phone || 'â€”'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-[#d2d2d7] bg-white">
                            <CardHeader>
                                <CardTitle>Residential Address Details</CardTitle>
                                <CardDescription>Official domicile recorded for statutory notification</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2 text-xs">
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Region:</span>
                                    <span className="font-semibold text-black text-sm">{employee.region || 'â€”'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">City:</span>
                                    <span className="font-semibold text-black text-sm">{employee.city || 'â€”'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#e8e8ed]">
                                    <span className="text-[#6e6e73]">Sub-City (Kifle Ketema):</span>
                                    <span className="font-semibold text-black text-sm">{employee.sub_city || 'â€”'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5">
                                    <span className="text-[#6e6e73]">Woreda / House Number:</span>
                                    <span className="font-semibold text-black text-sm">{employee.woreda || 'â€”'} / {employee.house_no || 'â€”'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Section 8: Expandable Remarks & Personnel Notes Card */}
                    <Card className="border-[#d2d2d7] bg-white overflow-hidden">
                        <CardHeader 
                            className="py-3 px-6 border-b border-[#e8e8ed] bg-[#f5f5f7]/80 cursor-pointer select-none hover:bg-[#f5f5f7]/60 transition-colors"
                            onClick={() => setRemarksExpanded(!remarksExpanded)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#0066cc]" />
                                    <CardTitle className="text-sm font-bold text-black">
                                        Section 8: Remarks &amp; Personnel Notes
                                    </CardTitle>
                                    {employee.remarks ? (
                                        <Badge variant="mint" className="text-[10px] ml-2 font-semibold">Note Recorded</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-[10px] ml-2">No Remarks</Badge>
                                    )}
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#6e6e73]">
                                    {remarksExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </Button>
                            </div>
                        </CardHeader>
                        {remarksExpanded && (
                            <CardContent className="p-6 text-xs text-[#424245] whitespace-pre-wrap leading-relaxed bg-white">
                                {employee.remarks || (
                                    <span className="text-[#6e6e73] italic">
                                        No official remarks or personnel notes logged for this employee.
                                    </span>
                                )}
                            </CardContent>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            

            {/* Discrepancy History Table */}
            <Card className="border-[#d2d2d7] bg-white">
                <CardHeader>
                    <CardTitle className="text-base">Data Correction Requests History</CardTitle>
                    <CardDescription>Submitted discrepancies under review by HR Administration</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                    {discrepancyReports.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#6e6e73]">
                            No data discrepancy reports submitted yet. If you notice any error in your records, click "Report Discrepancy" above.
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[400px] custom-scrollbar">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-[#f5f5f7] sticky top-0 z-20 shadow-[0_1px_0_0_#e8e8ed]">
                                    <tr className="border-b border-[#e8e8ed] text-[#6e6e73] uppercase">
                                        <th className="py-2.5 px-3 font-bold bg-[#f5f5f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#e8e8ed]">Field name</th>
                                        <th className="py-2.5 px-3 font-bold bg-[#f5f5f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#e8e8ed]">Current record</th>
                                        <th className="py-2.5 px-3 font-bold bg-[#f5f5f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#e8e8ed]">Proposed correction</th>
                                        <th className="py-2.5 px-3 font-bold bg-[#f5f5f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#e8e8ed]">Explanation</th>
                                        <th className="py-2.5 px-3 font-bold text-right bg-[#f5f5f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#e8e8ed]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e8e8ed]">
                                    {discrepancyReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-[#f5f5f7]">
                                            <td className="py-3 px-3 font-semibold text-black">{report.field_name}</td>
                                            <td className="py-3 px-3 text-[#6e6e73]">{report.current_value || 'Ã¢â‚¬â€'}</td>
                                            <td className="py-3 px-3 font-bold text-[#0066cc]">{report.proposed_value}</td>
                                            <td className="py-3 px-3 text-[#424245] max-w-xs truncate">{report.explanation || 'Ã¢â‚¬â€'}</td>
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
                <DialogContent className="max-w-md bg-white border-[#d2d2d7] p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-black flex items-center gap-2">
                            <Send className="w-4 h-4 text-[#0066cc]" />
                            Report Data Discrepancy
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#6e6e73]">
                            Submit an official correction request to HR Administration. Your submission will be audited and reviewed.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
                                Field with Discrepancy
                            </label>
                            <Select value={data.field_name} onValueChange={(v) => setData('field_name', v)}>
                                <SelectTrigger className="w-full h-10 rounded-xl border-[#d2d2d7] bg-[#f5f5f7] text-xs text-[#424245]"><SelectValue placeholder="Select field" /></SelectTrigger>
                                <SelectContent>
                                <SelectGroup><SelectLabel>Personal &amp; Identity</SelectLabel>
                                    <SelectItem value="Full Name">Full Name</SelectItem><SelectItem value="Gender">Gender</SelectItem><SelectItem value="DOB (E.C)">Date of Birth (E.C)</SelectItem><SelectItem value="DOB (G.C)">Date of Birth (G.C)</SelectItem><SelectItem value="Marital Status">Marital Status</SelectItem><SelectItem value="Phone Number">Phone Number</SelectItem><SelectItem value="Email Address">Email Address</SelectItem>
                                </SelectGroup>
                                <SelectGroup><SelectLabel>Residence &amp; Emergency</SelectLabel>
                                    <SelectItem value="Region / City">Region / City / Woreda</SelectItem><SelectItem value="Emergency Contact Name">Emergency Contact Name</SelectItem><SelectItem value="Emergency Contact Phone">Emergency Contact Phone</SelectItem>
                                </SelectGroup>
                                <SelectGroup><SelectLabel>Education &amp; Qualifications</SelectLabel>
                                    <SelectItem value="Education Attainment">Education Attainment</SelectItem><SelectItem value="Institution">Institution</SelectItem><SelectItem value="Graduation Year">Graduation Year (E.C)</SelectItem><SelectItem value="Professional License">Professional License</SelectItem>
                                </SelectGroup>
                                <SelectGroup><SelectLabel>Employment &amp; Experience</SelectLabel>
                                    <SelectItem value="Department">Department</SelectItem><SelectItem value="Job Title">Job Title</SelectItem><SelectItem value="Work Place">Work Place</SelectItem><SelectItem value="Employment Date">Employment Date</SelectItem><SelectItem value="Previous Experience">Previous Experience</SelectItem>
                                </SelectGroup>
                                <SelectGroup><SelectLabel>Financial &amp; Legal IDs</SelectLabel>
                                    <SelectItem value="TIN Number">TIN Number</SelectItem><SelectItem value="Bank Name">Bank Name</SelectItem><SelectItem value="Commercial Bank Account">Commercial Bank Account</SelectItem><SelectItem value="Social Security No">Social Security No</SelectItem>
                                </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
                                Current Value in System (Optional)
                            </label>
                            <Input
                                value={data.current_value}
                                onChange={(e) => setData('current_value', e.target.value)}
                                placeholder="Value shown right now..."
                                className="bg-[#f5f5f7] border-[#d2d2d7] text-xs h-10"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
                                Proposed Correct Value <span className="text-[#ff3b30]">*</span>
                            </label>
                            <Input
                                required
                                value={data.proposed_value}
                                onChange={(e) => setData('proposed_value', e.target.value)}
                                placeholder="Enter the correct information..."
                                className="bg-[#f5f5f7] border-[#d2d2d7] text-xs h-10"
                            />
                            {errors.proposed_value && (
                                <p className="text-xs text-[#ff3b30] mt-1">{errors.proposed_value}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
                                Explanation / Supporting Details
                            </label>
                            <Textarea
                                value={data.explanation}
                                onChange={(e) => setData('explanation', e.target.value)}
                                rows={3}
                                placeholder="Provide context or document reference for HR verification..."
                                className="w-full rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] p-2.5 text-xs text-[#424245] focus-visible:ring-[#0066cc]"
                            />
                        </div>

                        <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-[#e8e8ed]">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowModal(false)}
                                className="text-xs border-[#d2d2d7] rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold uppercase rounded-xl"
                            >
                                {processing ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Remove Profile Photo Confirmation Dialog */}
            <AlertDialog open={deletePhotoOpen} onOpenChange={setDeletePhotoOpen}>
                <AlertDialogContent className="bg-white border-[#d2d2d7]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-black">
                            Remove Profile Photo?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-[#6e6e73]">
                            Are you sure you want to delete your profile photo? Your avatar will revert to your name initials.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="text-xs h-9 border-[#d2d2d7] hover:bg-[#f5f5f7]">
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


