import { useState, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';
import EmployeeAvatar from '@/Components/EmployeeAvatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { formatDate } from '@/lib/utils';
import { 
    Building2, 
    MapPin, 
    Clock, 
    CreditCard, 
    Calendar, 
    AlertCircle, 
    CheckCircle2, 
    Send, 
    FileText,
    Award,
    ShieldAlert,
    Camera,
    Trash2
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

interface Props {
    employee: {
        id: number;
        file_no: string;
        full_name: string;
        profile_photo_url?: string | null;
        gender: string;
        position: string;
        work_place: string;
        status: string;
        employment_type: string;
        employment_date_ec: string;
        phone?: string;
        email?: string;
        bank_name?: string;
        bank_account_no?: string;
        tin_no?: string;
        poessa_no?: string;
        psssa_no?: string;
        plate_number?: string;
        education_status?: string;
        institution?: string;
        emergency_contact_name?: string;
        emergency_contact_relationship?: string;
        emergency_contact_phone?: string;
        department?: { name: string };
        current_salary?: {
            basic_salary: number;
            total_salary: number;
            responsibility_allowance?: number;
            hardship_allowance: number;
            desert_allowance?: number;
            daily_allowance?: number;
            project_allowance: number;
            position_allowance: number;
            transport_allowance: number;
            fuel_allowance_amount?: number;
            fuel_allowance_litres?: number;
            monthly_perdiem?: number;
            house_allowance: number;
            mobile_allowance: number;
            food_allowance: number;
            income_tax: number;
            pension_employee: number;
            total_deductions: number;
            net_salary?: number;
        };
    } | null;
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
    } | null;
    discrepancyReports: DiscrepancyReport[];
}

export default function Profile({ employee, tenure, annualLeaveEntitlement, retirementInfo, discrepancyReports }: Props) {
    const [showModal, setShowModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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
        if (!employee) return;
        if (confirm('Are you sure you want to remove your profile photo?')) {
            router.delete(route('employees.photo.destroy', employee.id), {
                preserveScroll: true,
            });
        }
    };

    const { data, setData, post, processing, reset, errors } = useForm({
        field_name: 'Full Name',
        current_value: '',
        proposed_value: '',
        explanation: '',
    });

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
            },
        });
    };

    if (!employee) {
        return (
            <PortalLayout title="Employee Self-Service">
                <Head title="Self-Service Portal - Elhadar Engineering HRMS" />
                <Card className="border-[#d8d9da] bg-white p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-[#64666a] mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-black">No Linked Employee Record Found</h3>
                    <p className="text-sm text-[#64666a] mt-1">
                        Please contact HR Administration to link your user account to an employee profile.
                    </p>
                </Card>
            </PortalLayout>
        );
    }

    const salary = employee.current_salary;

    return (
        <PortalLayout
            title="Employee Self-Service Portal"
            subtitle="Review your verified personnel records, payroll allowances, and report data discrepancies."
        >
            <Head title={`Self-Service: ${employee.full_name} - Elhadar Engineering HRMS`} />

            {/* Profile Overview Card */}
            <Card className="border-[#d8d9da] bg-white mb-6 overflow-hidden">
                <div className="p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-start gap-4">
                        <div className="relative group">
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
                                <span className="text-xs text-[#64666a]">
                                    {employee.employment_type}
                                </span>
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

                    <div className="flex flex-col sm:flex-row gap-3 items-stretch md:items-center">
                        <Button 
                            onClick={() => setShowModal(true)}
                            className="bg-[#008254] hover:bg-[#006642] text-white text-xs font-bold uppercase rounded-xs h-10 px-4 gap-2"
                        >
                            <ShieldAlert className="w-4 h-4" />
                            Report Discrepancy
                        </Button>
                    </div>
                </div>

                {/* Fast-Facts Ribbon */}
                <div className="grid grid-cols-2 md:grid-cols-4 border-t border-[#ebebec] bg-[#effcf8]/40 divide-y md:divide-y-0 md:divide-x divide-[#ebebec]">
                    <div className="p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64666a] block">
                            Service Tenure
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
                            Annual Leave Balance
                        </span>
                        <span className="text-base font-bold text-black mt-1 block">
                            {annualLeaveEntitlement} Working Days
                        </span>
                        <span className="text-[11px] text-[#64666a] block">
                            Statutory Proclamation 1156/2019
                        </span>
                    </div>

                    <div className="p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64666a] block">
                            Scheduled Retirement
                        </span>
                        <span className="text-base font-bold text-black mt-1 block">
                            {retirementInfo ? retirementInfo.retirement_date : 'Not recorded'}
                        </span>
                        <span className="text-[11px] text-[#64666a] block">
                            {retirementInfo ? `${Math.round(retirementInfo.days_remaining / 365)} years remaining` : 'Birthdate needed'}
                        </span>
                    </div>

                    <div className="p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64666a] block">
                            Disbursement Account
                        </span>
                        <span className="text-base font-bold text-black mt-1 block truncate">
                            {employee.bank_account_no || 'No account on file'}
                        </span>
                        <span className="text-[11px] text-[#008254] font-medium block">
                            {employee.bank_name || 'CBE'}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Compensation & Contact Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Payroll & Allowance Breakdown */}
                <Card className="border-[#d8d9da] bg-white lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Monthly Compensation & Allowances</CardTitle>
                        <CardDescription>Verified statutory compensation package</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                        <div className="flex justify-between items-center py-2 border-b border-[#ebebec] text-xs">
                            <span className="text-[#3d4045]">Basic Salary</span>
                            <span className="font-bold text-black">{formatCurrency(salary?.basic_salary)}</span>
                        </div>
                        {Number(salary?.responsibility_allowance) > 0 && (
                            <div className="flex justify-between items-center py-2 border-b border-[#ebebec] text-xs">
                                <span className="text-[#3d4045]">Responsibility Allowance</span>
                                <span className="font-semibold text-[#008254]">{formatCurrency(salary?.responsibility_allowance)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-[#ebebec] text-xs">
                            <span className="text-[#3d4045]">Hardship Allowance</span>
                            <span className="font-semibold text-[#008254]">{formatCurrency(salary?.hardship_allowance)}</span>
                        </div>
                        {Number(salary?.desert_allowance) > 0 && (
                            <div className="flex justify-between items-center py-2 border-b border-[#ebebec] text-xs">
                                <span className="text-[#3d4045]">Desert Allowance</span>
                                <span className="font-semibold text-[#008254]">{formatCurrency(salary?.desert_allowance)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-[#ebebec] text-xs">
                            <span className="text-[#3d4045]">Project Site Allowance</span>
                            <span className="font-semibold text-[#008254]">{formatCurrency(salary?.project_allowance)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-[#ebebec] text-xs">
                            <span className="text-[#3d4045]">Position / Title Allowance</span>
                            <span className="font-semibold text-[#008254]">{formatCurrency(salary?.position_allowance)}</span>
                        </div>
                        {Number(salary?.daily_allowance) > 0 && (
                            <div className="flex justify-between items-center py-2 border-b border-[#ebebec] text-xs">
                                <span className="text-[#3d4045]">Daily Allowance</span>
                                <span className="font-semibold text-[#008254]">{formatCurrency(salary?.daily_allowance)}</span>
                            </div>
                        )}
                        {Number(salary?.monthly_perdiem) > 0 && (
                            <div className="flex justify-between items-center py-2 border-b border-[#ebebec] text-xs">
                                <span className="text-[#3d4045]">Monthly Perdiem</span>
                                <span className="font-semibold text-[#008254]">{formatCurrency(salary?.monthly_perdiem)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-[#ebebec] text-xs">
                            <span className="text-[#3d4045]">Transport Allowance</span>
                            <span className="font-semibold text-[#008254]">{formatCurrency(salary?.transport_allowance)}</span>
                        </div>
                        {Number(salary?.fuel_allowance_amount) > 0 && (
                            <div className="flex justify-between items-center py-2 border-b border-[#ebebec] text-xs">
                                <span className="text-[#3d4045]">Fuel Allowance {salary?.fuel_allowance_litres ? `(${salary.fuel_allowance_litres} L)` : ''}</span>
                                <span className="font-semibold text-[#008254]">{formatCurrency(salary?.fuel_allowance_amount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-[#ebebec] text-xs">
                            <span className="text-[#3d4045]">Housing Allowance</span>
                            <span className="font-semibold text-[#008254]">{formatCurrency(salary?.house_allowance)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 bg-[#effcf8] p-3 rounded-xs border border-[#b7ecda]">
                            <span className="text-xs font-bold text-black uppercase">Gross Monthly Wage</span>
                            <span className="font-bold text-[#008254] text-base">
                                {formatCurrency(salary?.total_salary || salary?.basic_salary)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Identity & Contact Details */}
                <Card className="border-[#d8d9da] bg-white">
                    <CardHeader>
                        <CardTitle className="text-base">Identity & Contacts</CardTitle>
                        <CardDescription>Official personnel contacts and pension credentials</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2 text-xs">
                        <div>
                            <span className="text-[#64666a] block">Primary Telephone</span>
                            <span className="font-bold text-black text-sm">{employee.phone || '—'}</span>
                        </div>
                        <div>
                            <span className="text-[#64666a] block">Official Email</span>
                            <span className="font-medium text-black">{employee.email || 'None on file'}</span>
                        </div>
                        <div>
                            <span className="text-[#64666a] block">Emergency Contact</span>
                            <span className="font-bold text-[#008254]">
                                {employee.emergency_contact_phone || '—'}
                                {employee.emergency_contact_relationship ? ` (${employee.emergency_contact_relationship})` : ''}
                            </span>
                            {employee.emergency_contact_name && (
                                <span className="text-[11px] text-[#64666a] block mt-0.5">
                                    Name: {employee.emergency_contact_name}
                                </span>
                            )}
                        </div>
                        <div>
                            <span className="text-[#64666a] block">POESSA Pension Number</span>
                            <span className="font-semibold text-[#008254]">{employee.poessa_no || '—'}</span>
                        </div>
                        <div>
                            <span className="text-[#64666a] block">PSSSA Pension Number</span>
                            <span className="font-semibold text-[#008254]">{employee.psssa_no || '—'}</span>
                        </div>
                        <div>
                            <span className="text-[#64666a] block">Tax ID Number (TIN)</span>
                            <span className="font-medium text-black">{employee.tin_no || '—'}</span>
                        </div>
                        {employee.plate_number && (
                            <div>
                                <span className="text-[#64666a] block">Assigned Vehicle / Plate No</span>
                                <span className="font-semibold text-[#008254]">{employee.plate_number}</span>
                            </div>
                        )}
                        {employee.education_status && (
                            <div>
                                <span className="text-[#64666a] block">Education & Institution</span>
                                <span className="font-medium text-black">{employee.education_status} {employee.institution ? `(${employee.institution})` : ''}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

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
                                        <th className="py-2.5 px-3 font-bold bg-[#f7f7f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#ebebec]">Field Name</th>
                                        <th className="py-2.5 px-3 font-bold bg-[#f7f7f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#ebebec]">Current Record</th>
                                        <th className="py-2.5 px-3 font-bold bg-[#f7f7f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#ebebec]">Proposed Correction</th>
                                        <th className="py-2.5 px-3 font-bold bg-[#f7f7f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#ebebec]">Explanation</th>
                                        <th className="py-2.5 px-3 font-bold text-right bg-[#f7f7f7] sticky top-0 z-20 shadow-[inset_0_-1px_0_0_#ebebec]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#ebebec]">
                                    {discrepancyReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-[#f7f7f7]">
                                            <td className="py-3 px-3 font-semibold text-black">{report.field_name}</td>
                                            <td className="py-3 px-3 text-[#64666a]">{report.current_value || '—'}</td>
                                            <td className="py-3 px-3 font-bold text-[#008254]">{report.proposed_value}</td>
                                            <td className="py-3 px-3 text-[#3d4045] max-w-xs truncate">{report.explanation || '—'}</td>
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

            {/* Discrepancy Reporting Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-lg border border-[#d8d9da] shadow-lg max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold text-black">Report Data Discrepancy</h3>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="text-[#64666a] hover:text-black text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-[#64666a] mb-4">
                            Submit a correction request to HR Administration. Your submission will be audited and reviewed.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
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

                            <div className="flex justify-end gap-2 pt-2 border-t border-[#ebebec]">
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
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}
