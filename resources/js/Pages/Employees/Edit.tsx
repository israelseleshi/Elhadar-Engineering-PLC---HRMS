import { useState, useRef, useEffect, useMemo } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmployeeAvatar from '@/Components/EmployeeAvatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
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
import { gcToEc, ecToGc, formatEthiopianDisplay } from '@/lib/ethiopianDate';
import { formatEthPhoneInput, formatEthPhone } from '@/lib/utils';
import { 
    User, 
    Briefcase, 
    Calendar, 
    CreditCard, 
    Save, 
    ArrowLeft, 
    TrendingUp, 
    Plus,
    X,
    Building2,
    ShieldCheck,
    Camera,
    Trash2,
    FileText,
    GraduationCap,
    Award,
    MapPin,
    AlertCircle,
    CheckCircle2,
    RotateCcw,
    Sparkles,
    Check,
    UploadCloud,
    Phone,
    Eye
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
        employee_id_no?: string;
        full_name: string;
        profile_photo_url?: string | null;
        gender: 'Male' | 'Female' | string;
        education_status?: string;
        institution?: string;
        graduation_year_ec?: string;
        professional_license?: string;
        cost_sharing_status?: string;
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
        probation_end_date?: string;
        probation_status?: string;
        permanent_status_date?: string;
        contract_end_date?: string;
        retirement_date?: string;
        previous_experience?: string;
        company_experience?: string;
        total_experience?: string;
        performance_score_round_1?: number | string;
        performance_score_round_2?: number | string;
        disciplinary_action?: string;
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

const ETHIOPIAN_BANKS = [
    'Commercial Bank of Ethiopia (CBE)',
    'Awash International Bank',
    'Dashen Bank',
    'Bank of Abyssinia',
    'Wegagen Bank',
    'United Bank (Hibret Bank)',
    'Nib International Bank',
    'Cooperative Bank of Oromia',
    'Oromia Bank',
    'Zemen Bank',
    'Berhan Bank',
    'Abay Bank',
    'Lion International Bank',
    'Enat Bank',
    'Global Bank Ethiopia',
    'Sinqee Bank',
    'Siinqee Bank',
    'Tsehay Bank',
    'Ahadu Bank',
    'Gadaa Bank',
    'Hijra Bank',
    'Zad Bank',
];

const SECTIONS = [
    { id: 'identity', label: '1. Identity & Personal', icon: User, color: 'text-[#008254]' },
    { id: 'employment', label: '2. Job Assignment', icon: Briefcase, color: 'text-[#1e40af]' },
    { id: 'dates', label: '3. Statutory Dates', icon: Calendar, color: 'text-[#008254]' },
    { id: 'academic', label: '4. Education & Licenses', icon: GraduationCap, color: 'text-[#7c3aed]' },
    { id: 'experience', label: '5. Tenure & Performance', icon: Award, color: 'text-[#0284c7]' },
    { id: 'financial', label: '6. Banking & Identifiers', icon: CreditCard, color: 'text-[#b45309]' },
    { id: 'compensation', label: '7. Wage & Remarks', icon: TrendingUp, color: 'text-[#059669]' },
];

export default function Edit({ employee, departments }: Props) {
    const initialValues = useMemo(() => ({
        file_no: employee.file_no || '',
        employee_id_no: employee.employee_id_no || '',
        full_name: employee.full_name || '',
        gender: employee.gender || 'Male',
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
        employment_date_ec: employee.employment_date_ec || (employee.employment_date ? gcToEc(employee.employment_date.substring(0, 10)) || '' : ''),
        birth_date: employee.birth_date ? employee.birth_date.substring(0, 10) : '',
        birth_date_ec: employee.birth_date_ec || (employee.birth_date ? gcToEc(employee.birth_date.substring(0, 10)) || '' : ''),
        probation_end_date: employee.probation_end_date ? employee.probation_end_date.substring(0, 10) : '',
        probation_status: employee.probation_status || 'Pending',
        permanent_status_date: employee.permanent_status_date ? employee.permanent_status_date.substring(0, 10) : '',
        contract_end_date: employee.contract_end_date ? employee.contract_end_date.substring(0, 10) : '',
        retirement_date: employee.retirement_date ? employee.retirement_date.substring(0, 10) : '',
        education_status: employee.education_status || '',
        institution: employee.institution || '',
        graduation_year_ec: employee.graduation_year_ec || '',
        professional_license: employee.professional_license || '',
        cost_sharing_status: employee.cost_sharing_status || '',
        previous_experience: employee.previous_experience || '',
        company_experience: employee.company_experience || '',
        total_experience: employee.total_experience || '',
        performance_score_round_1: employee.performance_score_round_1 !== undefined && employee.performance_score_round_1 !== null ? String(employee.performance_score_round_1) : '',
        performance_score_round_2: employee.performance_score_round_2 !== undefined && employee.performance_score_round_2 !== null ? String(employee.performance_score_round_2) : '',
        disciplinary_action: employee.disciplinary_action || '',
        bank_name: employee.bank_name || '',
        bank_account_no: employee.bank_account_no || '',
        tin_no: employee.tin_no || '',
        social_security_no: employee.social_security_no || '',
        poessa_no: employee.poessa_no || '',
        psssa_no: employee.psssa_no || '',
        plate_number: employee.plate_number || '',
        remarks: employee.remarks || '',
    }), [employee, departments]);

    const { data, setData, put, processing, errors, reset, isDirty } = useForm(initialValues);

    const [allRegions, setAllRegions] = useState<Array<{ id: string | number; name: string }>>([]);
    const [allZones, setAllZones] = useState<Array<{ id: string | number; name: string; parent_id: string | number }>>([]);
    const [allWoredas, setAllWoredas] = useState<Array<{ id: string | number; name: string; parent_id: string | number }>>([]);
    const [filteredZones, setFilteredZones] = useState<Array<{ id: string | number; name: string; parent_id: string | number }>>([]);
    const [filteredWoredas, setFilteredWoredas] = useState<Array<{ id: string | number; name: string; parent_id: string | number }>>([]);
    const [addressLoading, setAddressLoading] = useState(false);

    useEffect(() => {
        setAddressLoading(true);
        fetch('https://openadmindata.org/api/v1/countries/et.json')
            .then((res) => res.json())
            .then((payload) => {
                const d = payload?.data || {};
                setAllRegions((d.region || []).map((r: any) => ({ id: r.id, name: r.name_en })));
                setAllZones((d.zone || []).map((z: any) => ({ id: z.id, name: z.name_en, parent_id: z.parent_id })));
                setAllWoredas((d.woreda || []).map((w: any) => ({ id: w.id, name: w.name_en, parent_id: w.parent_id })));
                setAddressLoading(false);
            })
            .catch(() => setAddressLoading(false));
    }, []);

    useEffect(() => {
        const region = allRegions.find((r) => r.name === data.region);
        if (region) {
            setFilteredZones(allZones.filter((z) => z.parent_id === region.id));
        } else {
            setFilteredZones([]);
        }
        setData('city', '');
        setData('sub_city', '');
    }, [data.region, allRegions, allZones]);

    useEffect(() => {
        const zone = allZones.find((z) => z.name === data.city);
        if (zone) {
            setFilteredWoredas(allWoredas.filter((w) => w.parent_id === zone.id));
        } else {
            setFilteredWoredas([]);
        }
        setData('sub_city', '');
    }, [data.city, allZones, allWoredas]);

    const [activeSection, setActiveSection] = useState('identity');
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
    const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Unsaved changes browser prompt
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Count how many fields differ from initial values
    const dirtyCount = useMemo(() => {
        let count = 0;
        for (const key of Object.keys(initialValues) as (keyof typeof initialValues)[]) {
            if (data[key] !== initialValues[key]) {
                count++;
            }
        }
        return count;
    }, [data, initialValues]);

    // Salary form state for increment modal
    const [salaryModalOpen, setSalaryModalOpen] = useState(false);
    const [deletePhotoOpen, setDeletePhotoOpen] = useState(false);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
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

    const handlePhotoFile = (file: File) => {
        if (!file) return;
        setPreviewPhotoUrl(URL.createObjectURL(file));

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
        setDeletePhotoOpen(true);
    };

    const confirmDeletePhoto = () => {
        setPreviewPhotoUrl(null);
        router.delete(route('employees.photo.destroy', employee.id), {
            preserveScroll: true,
            onFinish: () => setDeletePhotoOpen(false),
        });
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('employees.update', employee.id), {
            preserveScroll: true,
        });
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
            subtitle="Premium administration suite covering all statutory workforce parameters with real-time audit logging."
        >
            <Head title={`Edit ${employee.full_name} - Elhadar Engineering HRMS`} />

            {/* Sticky Command Bar */}
            <div className="sticky top-0 z-30 -mx-4 lg:-mx-8 px-4 lg:px-8 py-3 bg-white/95 backdrop-blur-md border-b border-[#d8d9da] shadow-xs transition-all mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link href={route('employees.show', employee.id)}>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 px-3 gap-1.5 text-xs font-semibold border-[#d8d9da] hover:bg-[#effcf8] hover:text-[#008254] rounded-sm"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 text-[#008254]" />
                                <span className="hidden sm:inline">Profile</span>
                            </Button>
                        </Link>

                        <div className="flex items-center gap-2.5 truncate">
                            <EmployeeAvatar
                                name={employee.full_name}
                                src={previewPhotoUrl || employee.profile_photo_url}
                                size="sm"
                            />
                            <div className="truncate">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-bold text-black truncate leading-tight">
                                        {employee.full_name}
                                    </h2>
                                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-xs bg-[#effcf8] text-[#008254] border border-[#b7ecda]">
                                        {employee.file_no}
                                    </span>
                                </div>
                                <p className="text-[11px] text-[#64666a] truncate">
                                    {employee.position} · {employee.department?.name || 'General Operations'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                        {/* Dirty State Indicator */}
                        {isDirty ? (
                            <div className="flex items-center gap-1.5">
                                <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-semibold gap-1 py-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    <span>{dirtyCount} unsaved change{dirtyCount > 1 ? 's' : ''}</span>
                                </Badge>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setResetConfirmOpen(true)}
                                    title="Discard unsaved changes"
                                    className="h-8 px-2 text-xs text-[#64666a] hover:text-black gap-1"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    <span className="hidden sm:inline">Reset</span>
                                </Button>
                            </div>
                        ) : (
                            <Badge variant="outline" className="text-xs text-[#64666a] border-[#ebebec] gap-1 py-1 hidden sm:inline-flex">
                                <Check className="w-3 h-3 text-[#008254]" />
                                <span>All changes saved</span>
                            </Badge>
                        )}

                        <Link href={route('employees.show', employee.id)}>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 gap-1.5 text-xs font-semibold border-[#d8d9da] hover:bg-[#effcf8] hover:text-[#008254] rounded-sm hidden lg:flex"
                            >
                                <Eye className="w-3.5 h-3.5 text-[#008254]" />
                                <span>Preview Card</span>
                            </Button>
                        </Link>

                        <Button
                            type="button"
                            onClick={handleProfileSubmit}
                            disabled={processing}
                            className="bg-[#008254] hover:bg-[#006a44] text-white font-bold text-xs gap-1.5 rounded-sm px-4 h-9 shadow-sm cursor-pointer"
                        >
                            <Save className="w-4 h-4" />
                            <span>{processing ? 'Saving...' : 'Save Profile'}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Section Stepper / Progressive Disclosure Navigation */}
            <div className="mb-6 overflow-x-auto pb-1 scrollbar-none">
                <div className="flex items-center gap-2 min-w-max p-1 bg-[#f7f7f7] border border-[#ebebec] rounded-sm">
                    {SECTIONS.map((sec) => {
                        const Icon = sec.icon;
                        const isActive = activeSection === sec.id;
                        return (
                            <button
                                key={sec.id}
                                type="button"
                                onClick={() => {
                                    setActiveSection(sec.id);
                                    const el = document.getElementById(sec.id);
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xs text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    isActive
                                        ? 'bg-white text-[#008254] shadow-xs border border-[#d8d9da]'
                                        : 'text-[#64666a] hover:text-black hover:bg-white/60'
                                }`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#008254]' : sec.color}`} />
                                <span>{sec.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Global Errors Banner */}
            {Object.keys(errors).length > 0 && (
                <div className="mb-6 p-4 rounded-sm border border-red-200 bg-red-50 text-red-900 text-xs">
                    <div className="flex items-center gap-2 font-bold mb-1">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span>Validation errors found in submitted form:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-red-700 pl-2">
                        {Object.entries(errors).slice(0, 5).map(([field, msg]) => (
                            <li key={field}><strong className="capitalize">{field.replace(/_/g, ' ')}:</strong> {msg}</li>
                        ))}
                    </ul>
                </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-8">
                {/* 1. Identity & Personal Details */}
                <Card id="identity" className="border-[#d8d9da] bg-white shadow-xs overflow-hidden scroll-mt-24">
                    <CardHeader className="border-b border-[#ebebec] py-4 px-6 bg-[#f7f7f7]/40 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                                <span className="w-7 h-7 rounded-sm bg-[#effcf8] text-[#008254] flex items-center justify-center font-bold">
                                    <User className="w-4 h-4" />
                                </span>
                                <span>1. Personal &amp; Identity Credentials</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-[#64666a] mt-0.5">
                                Government legal identity, demographics, residential locations, and emergency contacts.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="border-[#d8d9da] text-xs font-semibold text-[#008254]">
                            Required &amp; Core
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-6 lg:p-8">
                        {/* Interactive Photo Avatar Management with Drag & Drop */}
                        <div className="mb-8 p-5 rounded-sm border border-[#ebebec] bg-[#fafafa]">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div 
                                    className={`relative group shrink-0 rounded-full border-2 transition-all p-1 ${
                                        isDraggingPhoto ? 'border-[#008254] scale-105' : 'border-[#d8d9da]'
                                    }`}
                                    onDragOver={(e) => { e.preventDefault(); setIsDraggingPhoto(true); }}
                                    onDragLeave={() => setIsDraggingPhoto(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDraggingPhoto(false);
                                        const file = e.dataTransfer.files?.[0];
                                        if (file) handlePhotoFile(file);
                                    }}
                                >
                                    <EmployeeAvatar
                                        name={employee.full_name}
                                        src={previewPhotoUrl || employee.profile_photo_url}
                                        size="2xl"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingPhoto}
                                        title="Click or drag new image here"
                                        className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                                    >
                                        <Camera className="w-6 h-6 mb-1" />
                                        <span className="text-[10px] font-bold">{isUploadingPhoto ? 'Uploading...' : 'Change'}</span>
                                    </button>
                                    {(previewPhotoUrl || employee.profile_photo_url) && (
                                        <button
                                            type="button"
                                            onClick={handleDeletePhoto}
                                            title="Remove profile image"
                                            className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 shadow-xs transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-1.5 text-center sm:text-left flex-1">
                                    <div className="flex items-center justify-center sm:justify-start gap-2">
                                        <h4 className="text-sm font-bold text-black">Official Profile Portrait</h4>
                                        <Badge className="bg-[#effcf8] text-[#008254] border border-[#b7ecda] text-[10px]">
                                            96px Dossier Spec
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-[#64666a] max-w-md">
                                        Drag and drop or browse to replace avatar photo. High resolution JPEG, PNG, or WEBP supported (Max 2MB).
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploadingPhoto}
                                            className="text-xs h-9 gap-1.5 border-[#d8d9da] hover:bg-[#effcf8] hover:text-[#008254] rounded-sm font-semibold"
                                        >
                                            <UploadCloud className="w-4 h-4 text-[#008254]" />
                                            <span>{isUploadingPhoto ? 'Saving Image...' : 'Browse New Portrait'}</span>
                                        </Button>
                                        {(previewPhotoUrl || employee.profile_photo_url) && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleDeletePhoto}
                                                className="text-xs h-9 gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-sm"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete Photo</span>
                                            </Button>
                                        )}
                                        <Input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/png,image/jpeg,image/webp,image/jpg"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handlePhotoFile(file);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fields Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols- gap-6">
                            <div>
                                <Label className="text-sm font-semibold text-black">Company File No *</Label>
                                <Input
                                    value={data.file_no}
                                    onChange={(e) => setData('file_no', e.target.value)}
                                    placeholder="e.g. 001"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm font-mono font-bold"
                                />
                                {errors.file_no && <p className="text-[11px] text-[#de2828] mt-1">{errors.file_no}</p>}
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">National / FAN ID Code</Label>
                                <Input
                                    value={data.employee_id_no}
                                    onChange={(e) => setData('employee_id_no', e.target.value)}
                                    placeholder="e.g. ETH-FAN-102938"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm font-mono"
                                />
                                {errors.employee_id_no && <p className="text-[11px] text-[#de2828] mt-1">{errors.employee_id_no}</p>}
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Full Legal Name *</Label>
                                <Input
                                    value={data.full_name}
                                    onChange={(e) => setData('full_name', e.target.value)}
                                    placeholder="First Middle Last"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm font-medium"
                                />
                                {errors.full_name && <p className="text-[11px] text-[#de2828] mt-1">{errors.full_name}</p>}
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Gender *</Label>
                                <Select value={data.gender} onValueChange={(val) => setData('gender', val)}>
                                    <SelectTrigger className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7]">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Marital Status</Label>
                                <Select 
                                    value={data.marital_status || '__none__'} 
                                    onValueChange={(val) => setData('marital_status', val === '__none__' ? '' : val)}
                                >
                                    <SelectTrigger className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7]">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Not Specified</SelectItem>
                                        <SelectItem value="Single">Single</SelectItem>
                                        <SelectItem value="Married">Married</SelectItem>
                                        <SelectItem value="Divorced">Divorced</SelectItem>
                                        <SelectItem value="Widowed">Widowed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Primary Phone (Ethiopia)</Label>
                                <div className="relative mt-1.5 flex items-center">
                                    <span className="absolute left-3 text-xs font-bold text-[#008254] select-none">
                                        +251
                                    </span>
                                    <Input
                                        value={data.phone}
                                        onChange={(e) => setData('phone', formatEthPhoneInput(e.target.value))}
                                        placeholder="0911 000 000"
                                        className="h-11 pl-14 text-xs border-[#d8d9da] rounded-sm font-mono font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Official Email Address</Label>
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="employee@elhadar.com"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                                {errors.email && <p className="text-[11px] text-[#de2828] mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Region / State</Label>
                                <Select
                                    value={allRegions.find((r) => r.name === data.region)?.id?.toString() ?? undefined}
                                    onValueChange={(val) => {
                                        const r = allRegions.find((region) => region.id?.toString() === val);
                                        if (r) setData('region', r.name);
                                    }}
                                    disabled={addressLoading}
                                >
                                    <SelectTrigger className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7]">
                                        <SelectValue placeholder="Select region" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allRegions.map((r) => (
                                            <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">City</Label>
                                <Select
                                    value={allZones.find((z) => z.name === data.city)?.id?.toString() ?? undefined}
                                    onValueChange={(val) => {
                                        const z = allZones.find((zone) => zone.id?.toString() === val);
                                        if (z) setData('city', z.name);
                                    }}
                                    disabled={!filteredZones.length || addressLoading}
                                >
                                    <SelectTrigger className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7]">
                                        <SelectValue placeholder="Select city" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredZones.map((z) => (
                                            <SelectItem key={z.id} value={z.id.toString()}>{z.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Sub-City / Zone</Label>
                                <Select
                                    value={allWoredas.find((w) => w.name === data.sub_city)?.id?.toString() ?? undefined}
                                    onValueChange={(val) => {
                                        const w = allWoredas.find((woreda) => woreda.id?.toString() === val);
                                        if (w) setData('sub_city', w.name);
                                    }}
                                    disabled={!filteredWoredas.length || addressLoading}
                                >
                                    <SelectTrigger className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7]">
                                        <SelectValue placeholder="Select sub-city" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredWoredas.map((w) => (
                                            <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Woreda / Kebele</Label>
                                <Input
                                    value={data.woreda}
                                    onChange={(e) => setData('woreda', e.target.value)}
                                    placeholder="e.g. Woreda 03"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">House Number</Label>
                                <Input
                                    value={data.house_no}
                                    onChange={(e) => setData('house_no', e.target.value)}
                                    placeholder="e.g. House 142 / New"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Emergency Contact Person</Label>
                                <Input
                                    value={data.emergency_contact_name}
                                    onChange={(e) => setData('emergency_contact_name', e.target.value)}
                                    placeholder="Next of kin full name"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Emergency Relationship</Label>
                                <Input
                                    value={data.emergency_contact_relationship}
                                    onChange={(e) => setData('emergency_contact_relationship', e.target.value)}
                                    placeholder="e.g. Spouse, Brother, Parent"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Emergency Contact Phone</Label>
                                <div className="relative mt-1.5 flex items-center">
                                    <span className="absolute left-3 text-xs font-bold text-[#008254] select-none">
                                        +251
                                    </span>
                                    <Input
                                        value={data.emergency_contact_phone}
                                        onChange={(e) => setData('emergency_contact_phone', formatEthPhoneInput(e.target.value))}
                                        placeholder="0911 000 000"
                                        className="h-11 pl-14 text-xs border-[#d8d9da] rounded-sm font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Department & Employment Assignment */}
                <Card id="employment" className="border-[#d8d9da] bg-white shadow-xs overflow-hidden scroll-mt-24">
                    <CardHeader className="border-b border-[#ebebec] py-4 px-6 bg-[#f7f7f7]/40 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                                <span className="w-7 h-7 rounded-sm bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                                    <Briefcase className="w-4 h-4" />
                                </span>
                                <span>2. Department &amp; Employment Assignment</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-[#64666a] mt-0.5">
                                Operating unit placement, job title, site deployment, and compensation grade/step.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="border-[#d8d9da] text-xs font-semibold text-blue-700">
                            Organization
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-6 lg:p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols- gap-6">
                            <div>
                                <Label className="text-sm font-semibold text-black">Assigned Department *</Label>
                                <Select 
                                    value={String(data.department_id)} 
                                    onValueChange={(val) => setData('department_id', Number(val))}
                                >
                                    <SelectTrigger className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7]">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((d) => (
                                            <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.department_id && <p className="text-[11px] text-[#de2828] mt-1">{errors.department_id}</p>}
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Job Position / Title *</Label>
                                <Input
                                    value={data.position}
                                    onChange={(e) => setData('position', e.target.value)}
                                    placeholder="e.g. Project Manager, Resident Engineer"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm font-medium"
                                />
                                {errors.position && <p className="text-[11px] text-[#de2828] mt-1">{errors.position}</p>}
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Work Place / Site Station *</Label>
                                <Input
                                    list="workplace-list"
                                    value={data.work_place}
                                    onChange={(e) => setData('work_place', e.target.value)}
                                    placeholder="Head Office or Site Name"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                                <datalist id="workplace-list">
                                    <option value="Head Office">Addis Ababa Head Office</option>
                                    <option value="Project">Regional Project Site</option>
                                    <option value="Lalibela Water Works">Lalibela Water Works Project</option>
                                    <option value="Mekelle Project">Mekelle Road Project</option>
                                    <option value="Dire Dawa Site">Dire Dawa Substation</option>
                                </datalist>
                                {errors.work_place && <p className="text-[11px] text-[#de2828] mt-1">{errors.work_place}</p>}
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Employment Classification *</Label>
                                <Select value={data.employment_type} onValueChange={(val) => setData('employment_type', val)}>
                                    <SelectTrigger className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7]">
                                        <SelectValue placeholder="Select classification" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Non-Managerial">Non-Managerial (60 Working Days Probation)</SelectItem>
                                        <SelectItem value="Managerial">Managerial / Executive (90 Days Statutory)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Contract Category *</Label>
                                <Select value={data.contract_type} onValueChange={(val) => setData('contract_type', val)}>
                                    <SelectTrigger className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7]">
                                        <SelectValue placeholder="Select contract type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Permanent">Permanent</SelectItem>
                                        <SelectItem value="Contract">Fixed-Term Project Contract</SelectItem>
                                        <SelectItem value="Daily">Daily Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Current Status *</Label>
                                <Select value={data.status} onValueChange={(val) => setData('status', val)}>
                                    <SelectTrigger className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7]">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Permanent">Permanent</SelectItem>
                                        <SelectItem value="Probation">Probation</SelectItem>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="Separated">Separated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Salary Grade Band</Label>
                                <Input
                                    value={data.grade}
                                    onChange={(e) => setData('grade', e.target.value)}
                                    placeholder="e.g. VIII, XII"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Step Level</Label>
                                <Input
                                    value={data.step}
                                    onChange={(e) => setData('step', e.target.value)}
                                    placeholder="e.g. 1, 2, 3"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Dates & Statutory Milestones */}
                <Card id="dates" className="border-[#d8d9da] bg-white shadow-xs overflow-hidden scroll-mt-24">
                    <CardHeader className="border-b border-[#ebebec] py-4 px-6 bg-[#f7f7f7]/40 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-black">
                                3. Statutory Dates &amp; Milestone Calendars
                            </CardTitle>
                            <CardDescription className="text-xs text-[#64666a] mt-0.5">
                                Dual Gregorian (G.C.) and Ethiopian (E.C.) date synchronizer with automatic astronomical conversion.
                            </CardDescription>
                        </div>
                        <Badge className="bg-[#effcf8] text-[#008254] border border-[#b7ecda] text-xs font-semibold">
                            Auto-Sync Enabled
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-6 lg:p-8 space-y-6">
                        {/* Employment Date Row */}
                        <div className="p-4 rounded-sm border border-[#ebebec] bg-[#fafafa]">
                            <div className="mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-black">
                                    Employment / Onboarding Date
                                </span>
                                <p className="text-[11px] text-[#008254] font-medium mt-0.5">
                                    {formatEthiopianDisplay(data.employment_date_ec || (data.employment_date ? gcToEc(data.employment_date) : ''))
                                        ? `Ethiopian Date: ${formatEthiopianDisplay(data.employment_date_ec || (data.employment_date ? gcToEc(data.employment_date) : ''))} (${data.employment_date_ec || (data.employment_date ? gcToEc(data.employment_date) : '')})`
                                        : 'Select Gregorian date to auto-populate Ethiopian calendar'}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold text-[#3d4045]">Gregorian Date (G.C.) *</Label>
                                    <Input
                                        type="date"
                                        value={data.employment_date}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const autoEc = val ? (gcToEc(val) || '') : '';
                                            setData((prev) => ({
                                                ...prev,
                                                employment_date: val,
                                                employment_date_ec: autoEc || (val ? prev.employment_date_ec : ''),
                                            }));
                                        }}
                                        className="mt-1 h-10 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7]"
                                    />
                                    {errors.employment_date && <p className="text-[11px] text-[#de2828] mt-1">{errors.employment_date}</p>}
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-[#3d4045]">Ethiopian Date (E.C.) *</Label>
                                    <Input
                                        value={data.employment_date_ec}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const autoGc = ecToGc(val);
                                            setData((prev) => ({
                                                ...prev,
                                                employment_date_ec: val,
                                                employment_date: autoGc || prev.employment_date,
                                            }));
                                        }}
                                        placeholder="YYYY-MM-DD (e.g. 2017-01-20)"
                                        className="mt-1 h-10 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7] font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Birth Date Row */}
                        <div className="p-4 rounded-sm border border-[#ebebec] bg-[#fafafa]">
                            <div className="mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-black">
                                    Date of Birth
                                </span>
                                <p className="text-[11px] text-[#008254] font-medium mt-0.5">
                                    {formatEthiopianDisplay(data.birth_date_ec || (data.birth_date ? gcToEc(data.birth_date) : ''))
                                        ? `Ethiopian Date: ${formatEthiopianDisplay(data.birth_date_ec || (data.birth_date ? gcToEc(data.birth_date) : ''))} (${data.birth_date_ec || (data.birth_date ? gcToEc(data.birth_date) : '')})`
                                        : 'Select Gregorian birth date to auto-populate Ethiopian calendar'}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold text-[#3d4045]">Gregorian Birth Date (G.C.)</Label>
                                    <Input
                                        type="date"
                                        value={data.birth_date}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const autoEc = val ? (gcToEc(val) || '') : '';
                                            setData((prev) => ({
                                                ...prev,
                                                birth_date: val,
                                                birth_date_ec: autoEc || (val ? prev.birth_date_ec : ''),
                                            }));
                                        }}
                                        className="mt-1 h-10 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7]"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-[#3d4045]">Ethiopian Birth Date (E.C.)</Label>
                                    <Input
                                        value={data.birth_date_ec}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const autoGc = ecToGc(val);
                                            setData((prev) => ({
                                                ...prev,
                                                birth_date_ec: val,
                                                birth_date: autoGc || prev.birth_date,
                                            }));
                                        }}
                                        placeholder="YYYY-MM-DD"
                                        className="mt-1 h-10 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7] font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Additional Milestone Dates Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols- gap-6 pt-2">
                            <div>
                                <Label className="text-sm font-semibold text-black">Contract End Date (If Contract)</Label>
                                <Input
                                    type="date"
                                    value={data.contract_end_date}
                                    onChange={(e) => setData('contract_end_date', e.target.value)}
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Probation Target End Date</Label>
                                <Input
                                    type="date"
                                    value={data.probation_end_date}
                                    onChange={(e) => setData('probation_end_date', e.target.value)}
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Probation Milestone Status</Label>
                                <Select 
                                    value={data.probation_status || 'Pending'} 
                                    onValueChange={(val) => setData('probation_status', val)}
                                >
                                    <SelectTrigger className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7]">
                                        <SelectValue placeholder="Select probation status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending Review</SelectItem>
                                        <SelectItem value="Passed">Passed / Confirmed</SelectItem>
                                        <SelectItem value="Extended">Extended (30 Days)</SelectItem>
                                        <SelectItem value="Failed">Failed / Terminated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Permanent Status Date</Label>
                                <Input
                                    type="date"
                                    value={data.permanent_status_date}
                                    onChange={(e) => setData('permanent_status_date', e.target.value)}
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Statutory Retirement Date</Label>
                                <Input
                                    type="date"
                                    value={data.retirement_date}
                                    onChange={(e) => setData('retirement_date', e.target.value)}
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Academic Background & Professional Accreditation */}
                <Card id="academic" className="border-[#d8d9da] bg-white shadow-xs overflow-hidden scroll-mt-24">
                    <CardHeader className="border-b border-[#ebebec] py-4 px-6 bg-[#f7f7f7]/40 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                                <span className="w-7 h-7 rounded-sm bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                                    <GraduationCap className="w-4 h-4" />
                                </span>
                                <span>4. Academic Credentials &amp; Accreditation (Section 4)</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-[#64666a] mt-0.5">
                                University degrees, certifying institution, graduation calendar year, and professional practice licenses.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="border-[#d8d9da] text-xs font-semibold text-purple-700">
                            Accreditation
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-6 lg:p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols- gap-6">
                            <div>
                                <Label className="text-sm font-semibold text-black">Highest Education Status</Label>
                                <Input
                                    value={data.education_status}
                                    onChange={(e) => setData('education_status', e.target.value)}
                                    placeholder="e.g. BSc in Civil Engineering, MSc, Diploma"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Institution Graduated From</Label>
                                <Input
                                    value={data.institution}
                                    onChange={(e) => setData('institution', e.target.value)}
                                    placeholder="e.g. Addis Ababa University (AAU)"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Graduation Year (E.C.)</Label>
                                <Input
                                    value={data.graduation_year_ec}
                                    onChange={(e) => setData('graduation_year_ec', e.target.value)}
                                    placeholder="e.g. 2012 E.C."
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm font-mono"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Professional License Code</Label>
                                <Input
                                    value={data.professional_license}
                                    onChange={(e) => setData('professional_license', e.target.value)}
                                    placeholder="e.g. Practicing Civil Engineer (PE-1049)"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm font-medium"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Cost Sharing Certificate Status</Label>
                                <Select 
                                    value={data.cost_sharing_status || '__none__'} 
                                    onValueChange={(val) => setData('cost_sharing_status', val === '__none__' ? '' : val)}
                                >
                                    <SelectTrigger className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm bg-[#f7f7f7]">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Not Specified</SelectItem>
                                        <SelectItem value="Cleared">Cleared (Letter on File)</SelectItem>
                                        <SelectItem value="In Progress">In Progress (Paying)</SelectItem>
                                        <SelectItem value="Exempt">Exempt / Not Applicable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Experience & Performance Records */}
                <Card id="experience" className="border-[#d8d9da] bg-white shadow-xs overflow-hidden scroll-mt-24">
                    <CardHeader className="border-b border-[#ebebec] py-4 px-6 bg-[#f7f7f7]/40 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                                <span className="w-7 h-7 rounded-sm bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                                    <Award className="w-4 h-4" />
                                </span>
                                <span>5. Experience &amp; Performance Records (Section 5)</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-[#64666a] mt-0.5">
                                External industry experience, longevity calculation overrides, evaluation appraisal scores, and disciplinary records.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="border-[#d8d9da] text-xs font-semibold text-sky-700">
                            Service Records
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-6 lg:p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols- gap-6">
                            <div>
                                <Label className="text-sm font-semibold text-black">Previous Outside Experience</Label>
                                <Input
                                    value={data.previous_experience}
                                    onChange={(e) => setData('previous_experience', e.target.value)}
                                    placeholder="e.g. 4 Years at MIDROC Construction"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Company Service Tenure String</Label>
                                <Input
                                    value={data.company_experience}
                                    onChange={(e) => setData('company_experience', e.target.value)}
                                    placeholder="Leave empty for auto-calculated tenure"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Total Career Longevity String</Label>
                                <Input
                                    value={data.total_experience}
                                    onChange={(e) => setData('total_experience', e.target.value)}
                                    placeholder="e.g. 6 Years, 4 Months"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Appraisal Round 1 Score (%)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={data.performance_score_round_1}
                                    onChange={(e) => setData('performance_score_round_1', e.target.value)}
                                    placeholder="e.g. 88.5"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm font-semibold"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Appraisal Round 2 Score (%)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={data.performance_score_round_2}
                                    onChange={(e) => setData('performance_score_round_2', e.target.value)}
                                    placeholder="e.g. 91.0"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm font-semibold"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Disciplinary Standing / Record</Label>
                                <Input
                                    value={data.disciplinary_action}
                                    onChange={(e) => setData('disciplinary_action', e.target.value)}
                                    placeholder="Clean Record (None) or Warning Details"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 6. Banking & Tax Identification */}
                <Card id="financial" className="border-[#d8d9da] bg-white shadow-xs overflow-hidden scroll-mt-24">
                    <CardHeader className="border-b border-[#ebebec] py-4 px-6 bg-[#f7f7f7]/40 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                                <span className="w-7 h-7 rounded-sm bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                                    <CreditCard className="w-4 h-4" />
                                </span>
                                <span>6. Banking, Tax &amp; Statutory Identifiers (Section 6)</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-[#64666a] mt-0.5">
                                Ethiopian commercial bank institutions, bank accounts, TIN, POESSA/PSSSA pension records, and vehicle plates.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="border-[#d8d9da] text-xs font-semibold text-amber-700">
                            Statutory &amp; Tax
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-6 lg:p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols- gap-6">
                            <div>
                                <Label className="text-sm font-semibold text-black">Bank Institution</Label>
                                <Input
                                    list="bank-options"
                                    value={data.bank_name}
                                    onChange={(e) => setData('bank_name', e.target.value)}
                                    placeholder="Commercial Bank of Ethiopia (CBE)"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm"
                                />
                                <datalist id="bank-options">
                                    {ETHIOPIAN_BANKS.map((b) => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </datalist>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Bank Account Number</Label>
                                <Input
                                    value={data.bank_account_no}
                                    onChange={(e) => setData('bank_account_no', e.target.value)}
                                    placeholder="1000..."
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm font-mono"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Tax Identification Number (TIN)</Label>
                                <Input
                                    value={data.tin_no}
                                    onChange={(e) => setData('tin_no', e.target.value)}
                                    placeholder="0012345678"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm font-mono"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">POESSA Private Pension Code</Label>
                                <Input
                                    value={data.poessa_no}
                                    onChange={(e) => setData('poessa_no', e.target.value)}
                                    placeholder="e.g. POESSA-10293"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm font-mono"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">PSSSA Public Pension Code</Label>
                                <Input
                                    value={data.psssa_no}
                                    onChange={(e) => setData('psssa_no', e.target.value)}
                                    placeholder="e.g. PSSSA-4928"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm font-mono"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Assigned Vehicle Plate Number</Label>
                                <Input
                                    value={data.plate_number}
                                    onChange={(e) => setData('plate_number', e.target.value)}
                                    placeholder="e.g. 3-A-12345"
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm font-mono"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-black">Social Security Scheme Code</Label>
                                <Input
                                    value={data.social_security_no}
                                    onChange={(e) => setData('social_security_no', e.target.value)}
                                    placeholder="SS-..."
                                    className="mt-1.5 h-11 text-xs border-[#d8d9da] rounded-sm font-mono"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 7. Remarks & Official Observations */}
                <Card id="compensation" className="border-[#d8d9da] bg-white shadow-xs overflow-hidden scroll-mt-24">
                    <CardHeader className="border-b border-[#ebebec] py-4 px-6 bg-[#f7f7f7]/40">
                        <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                            <span className="w-7 h-7 rounded-sm bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                                <FileText className="w-4 h-4" />
                            </span>
                            <span>7. Remarks &amp; Personnel Notes (Section 8)</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-[#64666a]">
                            Official administrative notes, special contractual stipulations, or HR audit notations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 lg:p-8">
                        <div>
                            <Label className="text-sm font-semibold text-black">Official Remarks / Observations</Label>
                            <Textarea
                                value={data.remarks}
                                onChange={(e) => setData('remarks', e.target.value)}
                                rows={4}
                                placeholder="Enter any HR observations, remarks, or special personnel conditions..."
                                className="mt-2 border-[#d8d9da] bg-[#f7f7f7] text-xs text-[#3d4045] focus-visible:ring-[#008254] rounded-sm"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Bottom Action Footer */}
                <div className="flex items-center justify-between p-4 bg-white border border-[#d8d9da] rounded-sm shadow-xs">
                    <div className="text-xs text-[#64666a]">
                        {isDirty ? (
                            <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Unsaved changes pending commit to database.
                            </span>
                        ) : (
                            <span className="text-[#008254] font-semibold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Profile is up-to-date.
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={route('employees.show', employee.id)}>
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="h-10 text-xs font-semibold border-[#d8d9da] rounded-sm"
                            >
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-[#008254] hover:bg-[#006a44] text-white font-bold text-xs gap-2 rounded-sm px-8 h-10 shadow-sm cursor-pointer"
                        >
                            <Save className="w-4 h-4" />
                            <span>{processing ? 'Saving Changes...' : 'Save & Update Employee Profile'}</span>
                        </Button>
                    </div>
                </div>
            </form>

            {/* Compensation & Salary Increment Adjuster Section */}
            <div className="mt-12 pt-8 border-t border-[#d8d9da]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-black flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#008254]" />
                            Compensation Package &amp; Salary Increment Ledger
                        </h3>
                        <p className="text-xs text-[#64666a] mt-0.5">
                            Active monthly wage, itemized field allowances, statutory pension computations, and increment archives.
                        </p>
                    </div>

                    <Button
                        onClick={() => setSalaryModalOpen(true)}
                        className="bg-[#008254] hover:bg-[#006a44] text-white font-bold text-xs gap-1.5 rounded-sm h-10 px-4 shadow-sm cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Record Salary Increment</span>
                    </Button>
                </div>

                {/* Current Active Salary Spec Card */}
                {employee.currentSalary && (
                    <Card className="border-[#008254]/30 bg-[#effcf8] mb-6 shadow-xs">
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
                                <div className="p-4 bg-white rounded-sm border border-[#d8d9da]">
                                    <p className="text-[10px] uppercase font-bold text-[#64666a]">Basic Salary</p>
                                    <p className="text-lg font-bold text-black mt-0.5">{formatCurrency(employee.currentSalary.basic_salary)}</p>
                                </div>
                                <div className="p-4 bg-white rounded-sm border border-[#d8d9da]">
                                    <p className="text-[10px] uppercase font-bold text-[#64666a]">Total Gross Wage</p>
                                    <p className="text-lg font-bold text-[#008254] mt-0.5">{formatCurrency(employee.currentSalary.total_salary)}</p>
                                </div>
                                <div className="p-4 bg-white rounded-sm border border-[#d8d9da]">
                                    <p className="text-[10px] uppercase font-bold text-[#64666a]">Pension 7% (Employee)</p>
                                    <p className="text-lg font-bold text-black mt-0.5">{formatCurrency(employee.currentSalary.pension_employee)}</p>
                                </div>
                                <div className="p-4 bg-white rounded-sm border border-[#d8d9da]">
                                    <p className="text-[10px] uppercase font-bold text-[#64666a]">Pension 11% (Company)</p>
                                    <p className="text-lg font-bold text-black mt-0.5">{formatCurrency(employee.currentSalary.pension_company)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Historical Salary Milestones */}
                {employee.salaries && employee.salaries.length > 1 && (
                    <Card className="border-[#d8d9da] bg-white shadow-xs">
                        <CardHeader className="border-b border-[#ebebec] py-3.5 px-6">
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
                                                <Badge className="bg-[#effcf8] text-[#008254] text-[10px] border border-[#b7ecda]">Current</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] text-[#64666a] border-[#ebebec]">Archived</Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Record Salary Increment Modal (Shadcn Dialog) */}
            <Dialog open={salaryModalOpen} onOpenChange={setSalaryModalOpen}>
                <DialogContent className="max-w-2xl bg-white border-[#d8d9da] p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-black flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-[#008254]" />
                            Record Salary Increment for {employee.full_name}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#64666a]">
                            Update basic compensation and statutory operational allowances. This creates a timestamped wage record.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSalarySubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <Label className="font-bold text-black">Effective Date *</Label>
                                <Input
                                    type="date"
                                    value={salaryForm.data.effective_date}
                                    onChange={(e) => salaryForm.setData('effective_date', e.target.value)}
                                    className="mt-1 h-9 text-xs border-[#d8d9da] rounded-sm"
                                    required
                                />
                            </div>

                            <div>
                                <Label className="font-bold text-black">New Basic Wage (ETB) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={salaryForm.data.basic_salary}
                                    onChange={(e) => salaryForm.setData('basic_salary', Number(e.target.value))}
                                    className="mt-1 h-9 text-xs border-[#d8d9da] rounded-sm font-semibold"
                                    required
                                />
                            </div>

                            <div>
                                <Label className="font-medium text-[#3d4045]">Responsibility Allowance</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={salaryForm.data.responsibility_allowance}
                                    onChange={(e) => salaryForm.setData('responsibility_allowance', Number(e.target.value))}
                                    className="mt-1 h-9 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="font-medium text-[#3d4045]">Project Site Allowance</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={salaryForm.data.project_allowance}
                                    onChange={(e) => salaryForm.setData('project_allowance', Number(e.target.value))}
                                    className="mt-1 h-9 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="font-medium text-[#3d4045]">Hardship Allowance</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={salaryForm.data.hardship_allowance}
                                    onChange={(e) => salaryForm.setData('hardship_allowance', Number(e.target.value))}
                                    className="mt-1 h-9 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="font-medium text-[#3d4045]">Transport Allowance</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={salaryForm.data.transport_allowance}
                                    onChange={(e) => salaryForm.setData('transport_allowance', Number(e.target.value))}
                                    className="mt-1 h-9 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="font-medium text-[#3d4045]">Housing Allowance</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={salaryForm.data.house_allowance}
                                    onChange={(e) => salaryForm.setData('house_allowance', Number(e.target.value))}
                                    className="mt-1 h-9 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>

                            <div>
                                <Label className="font-medium text-[#3d4045]">Mobile / Phone Allowance</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={salaryForm.data.mobile_allowance}
                                    onChange={(e) => salaryForm.setData('mobile_allowance', Number(e.target.value))}
                                    className="mt-1 h-9 text-xs border-[#d8d9da] rounded-sm"
                                />
                            </div>
                        </div>

                        {/* Calculated Summary Preview in Modal */}
                        <div className="mt-4 p-3 bg-[#effcf8] border border-[#008254]/30 rounded-sm flex items-center justify-between text-xs">
                            <div>
                                <p className="font-bold text-[#00482f]">Calculated Gross Salary</p>
                                <p className="text-[11px] text-[#00482f]/80">Basic + Itemized Allowances</p>
                            </div>
                            <p className="text-base font-bold text-[#008254]">
                                {formatCurrency(calculateModalGross())}
                            </p>
                        </div>

                        <DialogFooter className="mt-6 flex justify-end gap-2 pt-3 border-t border-[#ebebec]">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSalaryModalOpen(false)}
                                className="text-xs border-[#d8d9da] rounded-sm"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={salaryForm.processing}
                                className="bg-[#008254] hover:bg-[#006a44] text-white text-xs font-bold rounded-sm px-4"
                            >
                                {salaryForm.processing ? 'Saving...' : 'Apply Salary Increment'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Discard Unsaved Changes Confirmation Dialog */}
            <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
                <AlertDialogContent className="bg-white border-[#d8d9da]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-black">
                            Discard Unsaved Modifications?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-[#64666a]">
                            You have <strong className="text-black">{dirtyCount} modified parameter{dirtyCount > 1 ? 's' : ''}</strong> that will be reverted back to their saved state. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="text-xs h-9 border-[#d8d9da] hover:bg-[#f7f7f7]">
                            Keep Editing
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                reset();
                                setResetConfirmOpen(false);
                            }}
                            className="text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        >
                            Discard Changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Remove Profile Photo Confirmation Dialog */}
            <AlertDialog open={deletePhotoOpen} onOpenChange={setDeletePhotoOpen}>
                <AlertDialogContent className="bg-white border-[#d8d9da]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-black">
                            Remove Profile Photo?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-[#64666a]">
                            Are you sure you want to delete the profile photo for <strong className="text-black">{employee.full_name}</strong>?
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
        </AuthenticatedLayout>
    );
}
