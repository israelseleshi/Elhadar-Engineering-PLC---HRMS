import { useState, useRef } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmployeeAvatar from '@/Components/EmployeeAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import Modal from '@/Components/Modal';
import { 
    User, 
    Briefcase, 
    Calendar, 
    CreditCard, 
    Save, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle, 
    TrendingUp, 
    Clock, 
    Plus,
    X,
    Building2,
    ShieldCheck,
    Camera,
    Trash2,
    FileText
} from 'lucide-react';

interface SalaryRecord {
    id: number;
    basic_salary: number;
    responsibility_allowance?: number;
    project_allowance?: number;
    position_allowance?: number;
    hardship_allowance?: number;
    transport_allowance?: number;
    house_allowance?: number;
    mobile_allowance?: number;
    food_allowance?: number;
    total_salary: number;
    pension_employee: number;
    pension_company: number;
    effective_date: string;
    is_current: boolean;
}

interface Props {
    employee: {
        id: number;
        file_no: string;
        full_name: string;
        profile_photo_url?: string | null;
        gender: string;
        education_status?: string;
        marital_status?: string;
        phone?: string;
        email?: string;
        region?: string;
        city?: string;
        sub_city?: string;
        woreda?: string;
        house_no?: string;
        emergency_contact_name?: string;
        emergency_contact_relationship?: string;
        emergency_contact_phone?: string;
        department_id: number;
        department?: { id: number; name: string };
        position: string;
        work_place: string;
        employment_type: string;
        contract_type: string;
        status: string;
        grade?: string;
        step?: string;
        employment_date: string;
        employment_date_ec: string;
        birth_date?: string;
        birth_date_ec?: string;
        contract_end_date?: string;
        bank_name?: string;
        bank_account_no?: string;
        tin_no?: string;
        social_security_no?: string;
        poessa_no?: string;
        psssa_no?: string;
        plate_number?: string;
        remarks?: string;
        currentSalary?: SalaryRecord;
        salaries?: SalaryRecord[];
    };
    departments: { id: number; name: string }[];
}

export default function Edit({ employee, departments }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        file_no: employee.file_no || '',
        full_name: employee.full_name || '',
        gender: employee.gender || 'Male',
        education_status: employee.education_status || '',
        marital_status: employee.marital_status || '',
        phone: employee.phone || '',
        email: employee.email || '',
        region: employee.region || '',
        city: employee.city || '',
        sub_city: employee.sub_city || '',
        woreda: employee.woreda || '',
        house_no: employee.house_no || '',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_relationship: employee.emergency_contact_relationship || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        department_id: employee.department_id || (departments[0]?.id ?? 1),
        position: employee.position || '',
        work_place: employee.work_place || 'Project',
        employment_type: employee.employment_type || 'Non-Managerial',
        contract_type: employee.contract_type || 'Permanent',
        status: employee.status || 'Permanent',
        grade: employee.grade || '',
        step: employee.step || '',
        employment_date: employee.employment_date ? employee.employment_date.substring(0, 10) : '',
        employment_date_ec: employee.employment_date_ec || '',
        birth_date: employee.birth_date ? employee.birth_date.substring(0, 10) : '',
        birth_date_ec: employee.birth_date_ec || '',
        contract_end_date: employee.contract_end_date ? employee.contract_end_date.substring(0, 10) : '',
        bank_name: employee.bank_name || '',
        bank_account_no: employee.bank_account_no || '',
        tin_no: employee.tin_no || '',
        social_security_no: employee.social_security_no || '',
        poessa_no: employee.poessa_no || '',
        psssa_no: employee.psssa_no || '',
        plate_number: employee.plate_number || '',
        remarks: employee.remarks || '',
    });

    const [salaryModalOpen, setSalaryModalOpen] = useState(false);
    const salaryForm = useForm({
        basic_salary: employee.currentSalary?.basic_salary || 0,
        responsibility_allowance: employee.currentSalary?.responsibility_allowance || 0,
        project_allowance: employee.currentSalary?.project_allowance || 0,
        position_allowance: employee.currentSalary?.position_allowance || 0,
        hardship_allowance: employee.currentSalary?.hardship_allowance || 0,
        transport_allowance: employee.currentSalary?.transport_allowance || 0,
        house_allowance: employee.currentSalary?.house_allowance || 0,
        mobile_allowance: employee.currentSalary?.mobile_allowance || 0,
        food_allowance: employee.currentSalary?.food_allowance || 0,
        effective_date: new Date().toISOString().split('T')[0],
        remarks: '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
        if (confirm(`Are you sure you want to remove the profile photo for ${employee.full_name}?`)) {
            router.delete(route('employees.photo.destroy', employee.id), {
                preserveScroll: true,
            });
        }
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('employees.update', employee.id));
    };

    const handleSalarySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        salaryForm.post(route('employees.salaries.store', employee.id), {
            onSuccess: () => setSalaryModalOpen(false),
        });
    };

    const formatCurrency = (amount?: number) => {
        if (!amount || amount <= 0) return '0.00 ETB';
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const calculateModalGross = () => {
        const basic = Number(salaryForm.data.basic_salary) || 0;
        const resp = Number(salaryForm.data.responsibility_allowance) || 0;
        const proj = Number(salaryForm.data.project_allowance) || 0;
        const pos = Number(salaryForm.data.position_allowance) || 0;
        const hard = Number(salaryForm.data.hardship_allowance) || 0;
        const trans = Number(salaryForm.data.transport_allowance) || 0;
        const house = Number(salaryForm.data.house_allowance) || 0;
        const mob = Number(salaryForm.data.mobile_allowance) || 0;
        const food = Number(salaryForm.data.food_allowance) || 0;
        return basic + resp + proj + pos + hard + trans + house + mob + food;
    };

    return (
        <AuthenticatedLayout
            title={`Edit Profile: ${employee.full_name} (${employee.file_no})`}
            subtitle="Update personnel credentials, contract parameters, and register salary increments with automated audit trail logging."
        >
            <Head title={`Edit ${employee.full_name} - Elhadar Engineering HRMS`} />

            {/* Back Button */}
            <div className="mb-6 flex items-center justify-between">
                <Link href={route('employees.show', employee.id)}>
                    <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 border-[#d8d9da] rounded-xs">
                        <ArrowLeft className="w-3.5 h-3.5 text-[#008254]" />
                        <span>Back to Employee Profile</span>
                    </Button>
                </Link>

                <div className="flex items-center gap-2">
                    <Badge className="bg-[#effcf8] text-[#008254] border border-[#008254]/30 text-xs">
                        Audit Logging Active
                    </Badge>
                </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* 1. Identity & Personal Details */}
                <Card className="border-[#d8d9da] bg-white">
                    <CardHeader className="border-b border-[#ebebec] py-4 px-6 bg-[#f7f7f7]/40">
                        <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                            <User className="w-4 h-4 text-[#008254]" />
                            1. Personal &amp; Identity Credentials
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {/* Profile Photo Avatar Management */}
                        <div className="flex flex-col sm:flex-row items-center gap-5 py-2 mb-6">
                            <div className="relative group">
                                <EmployeeAvatar
                                    name={employee.full_name}
                                    src={employee.profile_photo_url}
                                    size="xl"
                                />
                            </div>
                            <div className="space-y-1.5 text-center sm:text-left flex-1">
                                <h4 className="text-sm font-bold text-black">Profile Avatar Photo</h4>
                                <p className="text-xs text-[#64666a]">
                                    Supports JPEG, PNG, or WEBP (Max 2MB). Click below to update the employee photo immediately.
                                </p>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingPhoto}
                                        className="text-xs h-8 gap-1.5 border-[#d8d9da]"
                                    >
                                        <Camera className="w-3.5 h-3.5 text-[#008254]" />
                                        <span>{isUploadingPhoto ? 'Uploading...' : 'Upload New Photo'}</span>
                                    </Button>
                                    {employee.profile_photo_url && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleDeletePhoto}
                                            className="text-xs h-8 gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Remove</span>
                                        </Button>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/png,image/jpeg,image/webp,image/jpg"
                                        onChange={handlePhotoChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-black">File No *</label>
                                <Input
                                    value={data.file_no}
                                    onChange={(e) => setData('file_no', e.target.value)}
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                                {errors.file_no && <p className="text-[11px] text-[#de2828] mt-1">{errors.file_no}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-black">Full Name *</label>
                                <Input
                                    value={data.full_name}
                                    onChange={(e) => setData('full_name', e.target.value)}
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs font-medium"
                                />
                                {errors.full_name && <p className="text-[11px] text-[#de2828] mt-1">{errors.full_name}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Gender *</label>
                                <select
                                    value={data.gender}
                                    onChange={(e) => setData('gender', e.target.value)}
                                    className="mt-1 w-full h-10 border border-[#d8d9da] rounded-xs text-xs px-3 bg-white"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Marital Status</label>
                                <select
                                    value={data.marital_status}
                                    onChange={(e) => setData('marital_status', e.target.value)}
                                    className="mt-1 w-full h-10 border border-[#d8d9da] rounded-xs text-xs px-3 bg-white"
                                >
                                    <option value="">Select status</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Widowed">Widowed</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Education Status</label>
                                <Input
                                    value={data.education_status}
                                    onChange={(e) => setData('education_status', e.target.value)}
                                    placeholder="e.g. BSc Civil Engineering"
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Phone Number</label>
                                <Input
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Email Address</label>
                                <Input
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">City / Sub-City</label>
                                <Input
                                    value={data.sub_city}
                                    onChange={(e) => setData('sub_city', e.target.value)}
                                    placeholder="e.g. Bole Sub-City"
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Emergency Contact Name</label>
                                <Input
                                    value={data.emergency_contact_name}
                                    onChange={(e) => setData('emergency_contact_name', e.target.value)}
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Emergency Contact Relationship</label>
                                <Input
                                    value={data.emergency_contact_relationship}
                                    onChange={(e) => setData('emergency_contact_relationship', e.target.value)}
                                    placeholder="e.g. Spouse, Brother, Father"
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Emergency Contact Phone</label>
                                <Input
                                    value={data.emergency_contact_phone}
                                    onChange={(e) => setData('emergency_contact_phone', e.target.value)}
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Department & Job Assignment */}
                <Card className="border-[#d8d9da] bg-white">
                    <CardHeader className="border-b border-[#ebebec] py-4 px-6 bg-[#f7f7f7]/40">
                        <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-[#008254]" />
                            2. Department &amp; Employment Assignment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-black">Department *</label>
                                <select
                                    value={data.department_id}
                                    onChange={(e) => setData('department_id', Number(e.target.value))}
                                    className="mt-1 w-full h-10 border border-[#d8d9da] rounded-xs text-xs px-3 bg-white"
                                >
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Job Position / Title *</label>
                                <Input
                                    value={data.position}
                                    onChange={(e) => setData('position', e.target.value)}
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs font-medium"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Work Place / Site *</label>
                                <select
                                    value={data.work_place}
                                    onChange={(e) => setData('work_place', e.target.value)}
                                    className="mt-1 w-full h-10 border border-[#d8d9da] rounded-xs text-xs px-3 bg-white"
                                >
                                    <option value="Project">Regional Project Site</option>
                                    <option value="Head Office">Addis Ababa Head Office</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Employment Type *</label>
                                <select
                                    value={data.employment_type}
                                    onChange={(e) => setData('employment_type', e.target.value)}
                                    className="mt-1 w-full h-10 border border-[#d8d9da] rounded-xs text-xs px-3 bg-white"
                                >
                                    <option value="Non-Managerial">Non-Managerial (60 Days Probation)</option>
                                    <option value="Managerial">Managerial / Executive (90 Days)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Contract Type *</label>
                                <select
                                    value={data.contract_type}
                                    onChange={(e) => setData('contract_type', e.target.value)}
                                    className="mt-1 w-full h-10 border border-[#d8d9da] rounded-xs text-xs px-3 bg-white"
                                >
                                    <option value="Permanent">Permanent</option>
                                    <option value="Contract">Fixed Term Project Contract</option>
                                    <option value="Daily">Daily Staff</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Status *</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="mt-1 w-full h-10 border border-[#d8d9da] rounded-xs text-xs px-3 bg-white"
                                >
                                    <option value="Permanent">Permanent</option>
                                    <option value="Probation">Probation</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Separated">Separated</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Salary Grade</label>
                                <Input
                                    value={data.grade}
                                    onChange={(e) => setData('grade', e.target.value)}
                                    placeholder="e.g. VIII"
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Step Level</label>
                                <Input
                                    value={data.step}
                                    onChange={(e) => setData('step', e.target.value)}
                                    placeholder="e.g. 2"
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Dates & Statutory Milestones */}
                <Card className="border-[#d8d9da] bg-white">
                    <CardHeader className="border-b border-[#ebebec] py-4 px-6 bg-[#f7f7f7]/40">
                        <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#008254]" />
                            3. Statutory Dates &amp; Milestone Calendars
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-black">Employment Date (G.C.) *</label>
                                <Input
                                    type="date"
                                    value={data.employment_date}
                                    onChange={(e) => setData('employment_date', e.target.value)}
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Employment Date (E.C.) *</label>
                                <Input
                                    value={data.employment_date_ec}
                                    onChange={(e) => setData('employment_date_ec', e.target.value)}
                                    placeholder="YYYY-MM-DD (e.g. 2017-01-20)"
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Contract End Date (If Contract)</label>
                                <Input
                                    type="date"
                                    value={data.contract_end_date}
                                    onChange={(e) => setData('contract_end_date', e.target.value)}
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Date of Birth (G.C.)</label>
                                <Input
                                    type="date"
                                    value={data.birth_date}
                                    onChange={(e) => setData('birth_date', e.target.value)}
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Date of Birth (E.C.)</label>
                                <Input
                                    value={data.birth_date_ec}
                                    onChange={(e) => setData('birth_date_ec', e.target.value)}
                                    placeholder="YYYY-MM-DD"
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Banking & Tax Identification (Section 6) */}
                <Card className="border-[#d8d9da] bg-white">
                    <CardHeader className="border-b border-[#ebebec] py-4 px-6 bg-[#f7f7f7]/40">
                        <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-[#008254]" />
                            4. Banking, Tax &amp; Legal Identifiers (Section 6)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-black">Bank Institution</label>
                                <Input
                                    value={data.bank_name}
                                    onChange={(e) => setData('bank_name', e.target.value)}
                                    placeholder="e.g. Commercial Bank of Ethiopia (CBE)"
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Account Number</label>
                                <Input
                                    value={data.bank_account_no}
                                    onChange={(e) => setData('bank_account_no', e.target.value)}
                                    placeholder="1000..."
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Tax Identification Number (TIN)</label>
                                <Input
                                    value={data.tin_no}
                                    onChange={(e) => setData('tin_no', e.target.value)}
                                    placeholder="0012345678"
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">POESSA Pension No</label>
                                <Input
                                    value={data.poessa_no}
                                    onChange={(e) => setData('poessa_no', e.target.value)}
                                    placeholder="e.g. POESSA-10293"
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">PSSSA Pension No</label>
                                <Input
                                    value={data.psssa_no}
                                    onChange={(e) => setData('psssa_no', e.target.value)}
                                    placeholder="e.g. PSSSA-4928"
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Assigned Vehicle / Plate No</label>
                                <Input
                                    value={data.plate_number}
                                    onChange={(e) => setData('plate_number', e.target.value)}
                                    placeholder="e.g. 3-A-12345"
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black">Social Security No</label>
                                <Input
                                    value={data.social_security_no}
                                    onChange={(e) => setData('social_security_no', e.target.value)}
                                    placeholder="SS-..."
                                    className="mt-1 text-xs h-10 border-[#d8d9da] rounded-xs font-mono"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Remarks & Official Observations (Section 8) */}
                <Card className="border-[#d8d9da] bg-white">
                    <CardHeader className="border-b border-[#ebebec] py-4 px-6 bg-[#f7f7f7]/40">
                        <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#008254]" />
                            5. Remarks &amp; Personnel Notes (Section 8)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div>
                            <label className="text-xs font-bold text-black">Official Remarks / Observations</label>
                            <textarea
                                value={data.remarks}
                                onChange={(e) => setData('remarks', e.target.value)}
                                rows={3}
                                placeholder="Enter any HR observations, remarks, or special personnel conditions..."
                                className="mt-1 w-full p-3 rounded-xs border border-[#d8d9da] bg-white text-xs text-[#3d4045] focus:outline-none focus:ring-1 focus:ring-[#008254]"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Save Profile Button */}
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="submit"
                        disabled={processing}
                        className="bg-[#008254] hover:bg-[#006a44] text-white font-bold text-xs gap-2 rounded-xs px-6 h-11 shadow-sm"
                    >
                        <Save className="w-4 h-4" />
                        <span>{processing ? 'Saving...' : 'Update Personnel Profile'}</span>
                    </Button>
                </div>
            </form>

            {/* Compensation & Salary Increment Adjuster Section */}
            <div className="mt-10 pt-8 border-t border-[#d8d9da]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-black flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#008254]" />
                            Compensation Package &amp; Salary Increment Ledger
                        </h3>
                        <p className="text-xs text-[#64666a] mt-0.5">
                            Manage active monthly wage, itemized field allowances, and archive historical salary adjustments.
                        </p>
                    </div>

                    <Button
                        onClick={() => setSalaryModalOpen(true)}
                        className="bg-[#008254] hover:bg-[#006a44] text-white font-bold text-xs gap-1.5 rounded-xs shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Record Salary Increment</span>
                    </Button>
                </div>

                {/* Current Active Salary Spec Card */}
                {employee.currentSalary && (
                    <Card className="border-[#008254]/30 bg-[#effcf8] mb-6">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#00482f]">
                                    Current Active Milestone (Effective {new Date(employee.currentSalary.effective_date).toLocaleDateString()})
                                </span>
                                <Badge className="bg-[#008254] text-white text-xs font-bold">
                                    Current Package
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-white rounded-xs border border-[#d8d9da]">
                                    <p className="text-[10px] uppercase font-bold text-[#64666a]">Basic Salary</p>
                                    <p className="text-lg font-bold text-black mt-0.5">{formatCurrency(employee.currentSalary.basic_salary)}</p>
                                </div>
                                <div className="p-3 bg-white rounded-xs border border-[#d8d9da]">
                                    <p className="text-[10px] uppercase font-bold text-[#64666a]">Total Gross Wage</p>
                                    <p className="text-lg font-bold text-[#008254] mt-0.5">{formatCurrency(employee.currentSalary.total_salary)}</p>
                                </div>
                                <div className="p-3 bg-white rounded-xs border border-[#d8d9da]">
                                    <p className="text-[10px] uppercase font-bold text-[#64666a]">Pension 7% (Employee)</p>
                                    <p className="text-lg font-bold text-black mt-0.5">{formatCurrency(employee.currentSalary.pension_employee)}</p>
                                </div>
                                <div className="p-3 bg-white rounded-xs border border-[#d8d9da]">
                                    <p className="text-[10px] uppercase font-bold text-[#64666a]">Pension 11% (Company)</p>
                                    <p className="text-lg font-bold text-black mt-0.5">{formatCurrency(employee.currentSalary.pension_company)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Historical Salary Milestones */}
                {employee.salaries && employee.salaries.length > 1 && (
                    <Card className="border-[#d8d9da] bg-white">
                        <CardHeader className="border-b border-[#ebebec] py-3 px-4">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#64666a]">
                                Historical Salary Increments &amp; Archives
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-[#ebebec]">
                                {employee.salaries.map((sal) => (
                                    <div key={sal.id} className="p-4 flex items-center justify-between text-xs">
                                        <div>
                                            <span className="font-bold text-black">
                                                Effective: {new Date(sal.effective_date).toLocaleDateString()}
                                            </span>
                                            <span className="ml-3 text-[#64666a]">
                                                Basic: {formatCurrency(sal.basic_salary)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-black">
                                                Gross: {formatCurrency(sal.total_salary)}
                                            </span>
                                            {sal.is_current ? (
                                                <Badge className="bg-[#effcf8] text-[#008254] text-[10px]">Current</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] text-[#64666a]">Archived</Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Record Salary Increment Modal */}
            <Modal show={salaryModalOpen} onClose={() => setSalaryModalOpen(false)} maxWidth="2xl">
                <form onSubmit={handleSalarySubmit} className="bg-white p-6 rounded-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-[#ebebec] mb-4">
                        <h3 className="text-base font-bold text-black flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-[#008254]" />
                            Record Salary Increment for {employee.full_name}
                        </h3>
                        <button type="button" onClick={() => setSalaryModalOpen(false)} className="text-[#64666a] hover:text-black">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                            <label className="font-bold text-black">Effective Date *</label>
                            <Input
                                type="date"
                                value={salaryForm.data.effective_date}
                                onChange={(e) => salaryForm.setData('effective_date', e.target.value)}
                                className="mt-1 h-9 text-xs border-[#d8d9da] rounded-xs"
                                required
                            />
                        </div>

                        <div>
                            <label className="font-bold text-black">New Basic Wage (ETB) *</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={salaryForm.data.basic_salary}
                                onChange={(e) => salaryForm.setData('basic_salary', Number(e.target.value))}
                                className="mt-1 h-9 text-xs border-[#d8d9da] rounded-xs font-semibold"
                                required
                            />
                        </div>

                        <div>
                            <label className="font-medium text-[#3d4045]">Responsibility Allowance</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={salaryForm.data.responsibility_allowance}
                                onChange={(e) => salaryForm.setData('responsibility_allowance', Number(e.target.value))}
                                className="mt-1 h-9 text-xs border-[#d8d9da] rounded-xs"
                            />
                        </div>

                        <div>
                            <label className="font-medium text-[#3d4045]">Project Site Allowance</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={salaryForm.data.project_allowance}
                                onChange={(e) => salaryForm.setData('project_allowance', Number(e.target.value))}
                                className="mt-1 h-9 text-xs border-[#d8d9da] rounded-xs"
                            />
                        </div>

                        <div>
                            <label className="font-medium text-[#3d4045]">Hardship Allowance</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={salaryForm.data.hardship_allowance}
                                onChange={(e) => salaryForm.setData('hardship_allowance', Number(e.target.value))}
                                className="mt-1 h-9 text-xs border-[#d8d9da] rounded-xs"
                            />
                        </div>

                        <div>
                            <label className="font-medium text-[#3d4045]">Transport Allowance</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={salaryForm.data.transport_allowance}
                                onChange={(e) => salaryForm.setData('transport_allowance', Number(e.target.value))}
                                className="mt-1 h-9 text-xs border-[#d8d9da] rounded-xs"
                            />
                        </div>

                        <div>
                            <label className="font-medium text-[#3d4045]">Housing Allowance</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={salaryForm.data.house_allowance}
                                onChange={(e) => salaryForm.setData('house_allowance', Number(e.target.value))}
                                className="mt-1 h-9 text-xs border-[#d8d9da] rounded-xs"
                            />
                        </div>

                        <div>
                            <label className="font-medium text-[#3d4045]">Mobile / Phone Allowance</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={salaryForm.data.mobile_allowance}
                                onChange={(e) => salaryForm.setData('mobile_allowance', Number(e.target.value))}
                                className="mt-1 h-9 text-xs border-[#d8d9da] rounded-xs"
                            />
                        </div>
                    </div>

                    {/* Calculated Summary Preview in Modal */}
                    <div className="mt-4 p-3 bg-[#effcf8] border border-[#008254]/30 rounded-xs flex items-center justify-between text-xs">
                        <div>
                            <p className="font-bold text-[#00482f]">Calculated Gross Salary</p>
                            <p className="text-[11px] text-[#00482f]/80">Basic + Itemized Allowances</p>
                        </div>
                        <p className="text-base font-bold text-[#008254]">
                            {formatCurrency(calculateModalGross())}
                        </p>
                    </div>

                    <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-[#ebebec]">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSalaryModalOpen(false)}
                            className="text-xs border-[#d8d9da] rounded-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={salaryForm.processing}
                            className="bg-[#008254] hover:bg-[#006a44] text-white text-xs font-bold rounded-xs px-4"
                        >
                            {salaryForm.processing ? 'Saving...' : 'Apply Salary Increment'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
