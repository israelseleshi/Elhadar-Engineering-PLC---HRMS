import { useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmployeeAvatar from '@/Components/EmployeeAvatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
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
    ChevronUp
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

export default function Show({ employee, tenure, annualLeaveEntitlement, retirementInfo }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [remarksExpanded, setRemarksExpanded] = useState(Boolean(employee.remarks));

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
        if (confirm(`Are you sure you want to remove the profile photo for ${employee.full_name}?`)) {
            router.delete(route('employees.photo.destroy', employee.id), {
                preserveScroll: true,
            });
        }
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

    return (
        <AuthenticatedLayout>
            <Head title={`${employee.full_name} (${employee.file_no}) - Employee Profile`} />

            {/* Back to Directory Button */}
            <div className="mb-4">
                <Link href={route('employees.index')}>
                    <Button variant="outline" size="sm" className="gap-2 text-xs font-semibold text-[#008254] border-[#d8d9da] hover:bg-[#effcf8]">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Staff Directory
                    </Button>
                </Link>
            </div>

            {/* Header Profile Dossier Card */}
            <Card className="border-[#d8d9da] bg-white mb-6 overflow-hidden">
                <div className="p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="relative group shrink-0">
                            <EmployeeAvatar
                                name={employee.full_name}
                                src={employee.profile_photo_url}
                                size="2xl"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                title="Upload new photo"
                                className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                            >
                                <Camera className="w-6 h-6" />
                                <span className="text-[10px] font-semibold mt-1">{isUploading ? 'Saving...' : 'Change'}</span>
                            </button>
                            {employee.profile_photo_url && (
                                <button
                                    type="button"
                                    onClick={handleDeletePhoto}
                                    title="Remove photo"
                                    className="absolute bottom-0 right-0 bg-white p-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50 shadow-xs transition-colors cursor-pointer"
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
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-xs bg-[#effcf8] text-[#008254] border border-[#b7ecda]">
                                    {employee.file_no}
                                </span>
                                <Badge variant={employee.status === 'Permanent' ? 'mint' : 'secondary'}>
                                    {employee.status}
                                </Badge>
                                <span className="text-xs text-[#64666a]">
                                    {employee.employment_type}
                                </span>
                                {employee.grade && (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-xs bg-[#f7f7f7] text-[#3d4045] border border-[#d8d9da]">
                                        Grade: {employee.grade}
                                    </span>
                                )}
                                {employee.step && (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-xs bg-[#f7f7f7] text-[#3d4045] border border-[#d8d9da]">
                                        Step: {employee.step}
                                    </span>
                                )}
                                {employee.age && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-xs bg-[#effcf8] text-[#008254] border border-[#b7ecda]">
                                        Age: {employee.age}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-black tracking-tight">
                                {employee.full_name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-[#3d4045] mt-1.5 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-[#008254]" />
                                    {employee.department?.name || 'General Engineering'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-[#008254]" />
                                    {employee.work_place}
                                </span>
                                <span>•</span>
                                <span>{employee.position}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2.5 w-full md:w-auto">
                        <div className="flex flex-col items-end w-full md:w-auto p-4 rounded-lg bg-[#f7f7f7] border border-[#ebebec]">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">
                                Total Monthly Compensation
                            </span>
                            <span className="text-2xl font-bold text-[#008254] mt-0.5">
                                {formatCurrency(salary?.total_salary || salary?.basic_salary)}
                            </span>
                            <span className="text-[11px] text-[#64666a]">
                                Basic: {formatCurrency(salary?.basic_salary)}
                            </span>
                        </div>
                        <Link href={route('employees.edit', employee.id)} className="w-full">
                            <Button size="sm" variant="outline" className="w-full text-xs font-semibold gap-1.5 border-[#d8d9da] hover:bg-[#effcf8] hover:text-[#008254] rounded-xs">
                                <Edit className="w-3.5 h-3.5 text-[#008254]" />
                                <span>Edit Profile</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statutory Fast-Facts Ribbon (NerdWallet Comparison Spec) */}
                <div className="grid grid-cols-2 md:grid-cols-4 border-t border-[#ebebec] bg-[#effcf8]/40 divide-y md:divide-y-0 md:divide-x divide-[#ebebec]">
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
                        <span className="text-base font-bold text-black mt-1 block truncate">
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
                <TabsList className="overflow-x-auto flex-nowrap justify-start gap-2 sm:gap-4 border-b border-[#ebebec] scrollbar-thin mb-4 pb-0">
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
                                <div className="flex justify-between items-center py-2 border-b border-[#ebebec]">
                                    <span className="text-sm font-semibold text-black">Gross Basic Salary</span>
                                    <span className="font-bold text-black text-sm">{formatCurrency(salary?.basic_salary)}</span>
                                </div>
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
                            <div className="flex justify-between items-center bg-[#effcf8] p-3 rounded-xs border border-[#b7ecda]">
                                <span className="text-sm font-bold text-black uppercase">Total Gross Earning</span>
                                <span className="font-bold text-[#008254] text-lg">
                                    {formatCurrency(salary?.total_salary || salary?.basic_salary)}
                                </span>
                            </div>

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
                                    <span className="font-bold text-black text-sm">{employee.phone || '—'}</span>
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
        </AuthenticatedLayout>
    );
}
