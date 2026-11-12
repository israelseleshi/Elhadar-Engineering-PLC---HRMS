import { useState, useEffect, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { 
    ArrowLeft, 
    ArrowRight, 
    User, 
    Briefcase, 
    Calendar, 
    CreditCard, 
    CheckCircle2, 
    Building2,
    ShieldCheck,
    FileCheck,
    AlertCircle,
    Landmark,
    MapPin,
    Phone,
    Mail,
    Receipt,
    Clock,
    Sparkles,
    Check,
    Edit3
} from 'lucide-react';
import { gcToEc, ecToGc, formatEthiopianDisplay } from '@/lib/ethiopianDate';
import { 
    ETHIOPIAN_REGIONS, 
    ETHIOPIAN_SUB_CITIES_OR_ZONES, 
    WORKPLACE_OPTIONS, 
    ETHIOPIAN_BANKS 
} from '@/lib/ethiopianLocations';
import { DatePicker } from '@/Components/ui/date-picker';

interface Department {
    id: number;
    name: string;
}

interface Props {
    departments: Department[];
}

export default function Create({ departments }: Props) {
    const [step, setStep] = useState(1);
    const [stepAttempted, setStepAttempted] = useState(false);

    // Initial default Ethiopian date calculated from today
    const todayGc = useMemo(() => new Date().toISOString().split('T')[0], []);
    const initialEcDate = useMemo(() => {
        const ec = gcToEc(todayGc);
        if (ec) {
            const [y, m, d] = ec.split('-');
            return `${d}/${m}/${y}`;
        }
        return '';
    }, [todayGc]);

    const { data, setData, post, processing, errors } = useForm({
        // Step 1: Personal Profile & Demographics
        full_name: '',
        gender: 'Male' as 'Male' | 'Female',
        marital_status: 'Single',
        education_status: '',
        phone: '',
        email: '',
        region: 'Addis Ababa',
        city: 'Addis Ababa',
        sub_city: 'Bole',
        woreda: '',
        house_no: '',
        emergency_contact_name: '',
        emergency_contact_relationship: '',
        emergency_contact_phone: '',

        // Step 2: Role & Organizational Assignment
        file_no: '',
        department_id: departments.length > 0 ? String(departments[0].id) : '',
        position: '',
        work_place: 'H.O',
        employment_type: 'Non-Managerial' as 'Non-Managerial' | 'Managerial',
        contract_type: 'Permanent' as 'Permanent' | 'Contract' | 'Daily',
        status: 'Probation' as 'Probation' | 'Permanent' | 'Contract',
        grade: '',
        step: '',

        // Step 3: Dual Calendar Dates & Milestones
        employment_date: todayGc,
        employment_date_ec: initialEcDate,
        birth_date: '',
        birth_date_ec: '',
        contract_end_date: '',

        // Step 4: Compensation & Statutory Banking
        basic_salary: '',
        responsibility_allowance: '0',
        project_allowance: '0',
        position_allowance: '0',
        hardship_allowance: '0',
        transport_allowance: '0',
        house_allowance: '0',
        mobile_allowance: '0',
        food_allowance: '0',
        perdiem: '0',
        monthly_perdiem: '0',
        bank_name: 'Commercial Bank of Ethiopia (CBE)',
        bank_account_no: '',
        tin_no: '',
        social_security_no: '',
        poessa_no: '',
        psssa_no: '',
        plate_number: '',
        remarks: '',
    });

    // Sub-city / zone options derived from selected region
    const availableSubCities = useMemo(() => {
        return ETHIOPIAN_SUB_CITIES_OR_ZONES[data.region] || [];
    }, [data.region]);

    // Update sub_city when region changes if current value is invalid
    const handleRegionChange = (newRegion: string) => {
        setData('region', newRegion);
        setData('city', newRegion);
        const nextSubCities = ETHIOPIAN_SUB_CITIES_OR_ZONES[newRegion] || [];
        setData('sub_city', nextSubCities[0] || '');
    };

    // Date synchronization helpers
    const handleGcEmploymentDateChange = (gcVal: string) => {
        setData('employment_date', gcVal);
        if (gcVal) {
            const ec = gcToEc(gcVal);
            if (ec) {
                const [y, m, d] = ec.split('-');
                setData('employment_date_ec', `${d}/${m}/${y}`);
            }
        }
    };

    const handleEcEmploymentDateChange = (ecVal: string) => {
        setData('employment_date_ec', ecVal);
        const parts = ecVal.trim().split(/[-/]/);
        if (parts.length === 3) {
            let [d, m, y] = parts;
            if (d.length === 4 && y.length <= 2) {
                // If entered YYYY-MM-DD
                const temp = d;
                d = y;
                y = temp;
            }
            if (y && m && d) {
                const ecFormatted = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                const gc = ecToGc(ecFormatted);
                if (gc) {
                    setData('employment_date', gc);
                }
            }
        }
    };

    const handleGcBirthDateChange = (gcVal: string) => {
        setData('birth_date', gcVal);
        if (gcVal) {
            const ec = gcToEc(gcVal);
            if (ec) {
                const [y, m, d] = ec.split('-');
                setData('birth_date_ec', `${d}/${m}/${y}`);
            }
        } else {
            setData('birth_date_ec', '');
        }
    };

    const handleEcBirthDateChange = (ecVal: string) => {
        setData('birth_date_ec', ecVal);
        const parts = ecVal.trim().split(/[-/]/);
        if (parts.length === 3) {
            let [d, m, y] = parts;
            if (d.length === 4 && y.length <= 2) {
                const temp = d;
                d = y;
                y = temp;
            }
            if (y && m && d) {
                const ecFormatted = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                const gc = ecToGc(ecFormatted);
                if (gc) {
                    setData('birth_date', gc);
                }
            }
        }
    };

    // Computed retirement target (60 years per Ethiopian Labour statutory framework)
    const computedRetirement = useMemo(() => {
        if (!data.birth_date || !data.birth_date.includes('-')) return null;
        const [y, m, d] = data.birth_date.split('-');
        const birthYear = parseInt(y, 10);
        if (isNaN(birthYear)) return null;
        const retYearGc = birthYear + 60;
        const retDateGc = `${retYearGc}-${m}-${d}`;
        const retEc = gcToEc(retDateGc);
        let retEcDisplay = '';
        if (retEc) {
            const [ey, em, ed] = retEc.split('-');
            retEcDisplay = `${ed}/${em}/${ey} E.C.`;
        }
        return {
            gc: retDateGc,
            ec: retEcDisplay,
            yearGc: retYearGc,
        };
    }, [data.birth_date]);

    // Live Statutory Payroll Calculations
    const payrollMetrics = useMemo(() => {
        const basic = parseFloat(data.basic_salary) || 0;
        const hardship = parseFloat(data.hardship_allowance) || 0;
        const project = parseFloat(data.project_allowance) || 0;
        const responsibility = parseFloat(data.responsibility_allowance) || 0;
        const position = parseFloat(data.position_allowance) || 0;
        const transport = parseFloat(data.transport_allowance) || 0;
        const house = parseFloat(data.house_allowance) || 0;
        const food = parseFloat(data.food_allowance) || 0;
        const mobile = parseFloat(data.mobile_allowance) || 0;
        const perdiem = parseFloat(data.perdiem) || 0;
        const monthlyPerdiem = parseFloat(data.monthly_perdiem) || 0;

        const totalAllowances = hardship + project + responsibility + position + transport + house + food + mobile + perdiem + monthlyPerdiem;
        const grossSalary = basic + totalAllowances;
        const employeePension = Math.round(basic * 0.07 * 100) / 100;
        const companyPension = Math.round(basic * 0.11 * 100) / 100;
        const totalPension = Math.round((employeePension + companyPension) * 100) / 100;
        const netBase = Math.max(0, grossSalary - employeePension);

        return {
            basic,
            totalAllowances,
            grossSalary,
            employeePension,
            companyPension,
            totalPension,
            netBase,
        };
    }, [data]);

    // Error grouping per step for stepper indicators
    const stepErrors = useMemo(() => {
        const s1Keys = ['full_name', 'gender', 'marital_status', 'education_status', 'phone', 'email', 'region', 'city', 'sub_city', 'woreda', 'house_no', 'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone'];
        const s2Keys = ['file_no', 'department_id', 'position', 'work_place', 'employment_type', 'contract_type', 'status', 'grade', 'step'];
        const s3Keys = ['employment_date', 'employment_date_ec', 'birth_date', 'birth_date_ec', 'contract_end_date'];
        const s4Keys = ['basic_salary', 'responsibility_allowance', 'project_allowance', 'position_allowance', 'hardship_allowance', 'transport_allowance', 'house_allowance', 'mobile_allowance', 'food_allowance', 'perdiem', 'monthly_perdiem', 'bank_name', 'bank_account_no', 'tin_no', 'social_security_no', 'poessa_no', 'psssa_no', 'plate_number', 'remarks'];

        const hasErr = (keys: string[]) => keys.some((k) => !!errors[k as keyof typeof errors]);
        return {
            1: hasErr(s1Keys),
            2: hasErr(s2Keys),
            3: hasErr(s3Keys),
            4: hasErr(s4Keys),
            5: false,
        };
    }, [errors]);

    // Client-side step validation
    const validateStep = (currentStep: number): boolean => {
        if (currentStep === 1) {
            return Boolean(data.full_name.trim() && data.gender);
        }
        if (currentStep === 2) {
            return Boolean(data.file_no.trim() && data.department_id && data.position.trim() && data.work_place);
        }
        if (currentStep === 3) {
            return Boolean(data.employment_date && data.employment_date_ec);
        }
        if (currentStep === 4) {
            return Boolean(data.basic_salary !== '' && !isNaN(Number(data.basic_salary)) && Number(data.basic_salary) >= 0);
        }
        return true;
    };

    const nextStep = () => {
        setStepAttempted(true);
        if (validateStep(step)) {
            setStepAttempted(false);
            setStep((s) => Math.min(5, s + 1));
        }
    };

    const prevStep = () => {
        setStepAttempted(false);
        setStep((s) => Math.max(1, s - 1));
    };

    const handleStepJump = (target: number) => {
        if (target < step) {
            setStep(target);
            return;
        }
        // If jumping forward, ensure current step is valid
        if (validateStep(step)) {
            setStep(target);
        } else {
            setStepAttempted(true);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('employees.store'), {
            onError: (errs) => {
                // Auto-route to the first step containing errors
                if (stepErrors[1]) setStep(1);
                else if (stepErrors[2]) setStep(2);
                else if (stepErrors[3]) setStep(3);
                else if (stepErrors[4]) setStep(4);
            },
        });
    };

    const steps = [
        { num: 1, title: 'Personal & Contacts', subtitle: 'Identity & Address', icon: User },
        { num: 2, title: 'Role & Assignment', subtitle: 'Unit, File & Workplace', icon: Briefcase },
        { num: 3, title: 'Dates & Milestones', subtitle: 'Dual E.C. / G.C. Sync', icon: Calendar },
        { num: 4, title: 'Compensation & Bank', subtitle: 'Wage, Allowances & Pension', icon: CreditCard },
        { num: 5, title: 'Review Dossier', subtitle: 'Pre-Flight Verification', icon: FileCheck },
    ];

    const selectedDepartment = useMemo(() => {
        return departments.find((d) => String(d.id) === String(data.department_id));
    }, [departments, data.department_id]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2,
        }).format(val).replace('ETB', 'ETB ');
    };

    return (
        <AuthenticatedLayout
            title="Onboard Personnel"
            subtitle="Register new personnel compliant with Ethiopian Labour Proclamation 1156/2019 and POESSA pension framework."
        >
            <Head title="Onboard Personnel - Elhadar Engineering HRMS" />

            {/* Back Navigation Bar */}
            <div className="mb-5 flex items-center justify-between">
                <Link href={route('employees.index')}>
                    <Button variant="ghost" size="sm" className="gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" /> Back to Staff Directory
                    </Button>
                </Link>
                <div className="flex items-center gap-2.5">
                    <span className="text-sm text-muted-foreground">
                        Step <span className="font-bold text-foreground">{step}</span> of 5
                    </span>
                    <Badge variant="outline" className="text-xs font-medium px-3 py-1 border-border/80">
                        {step === 5 ? 'Pre-Flight Verification' : 'Data Entry In Progress'}
                    </Badge>
                </div>
            </div>

            {/* Apple Connected Pill Stepper Track */}
            <div className="mb-6 bg-card border border-border rounded-xl p-3.5 shadow-xs">
                <nav aria-label="Onboarding Progress" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {steps.map((st) => {
                        const Icon = st.icon;
                        const isActive = step === st.num;
                        const isDone = step > st.num;
                        const hasError = stepErrors[st.num as keyof typeof stepErrors];

                        return (
                            <button
                                key={st.num}
                                type="button"
                                onClick={() => handleStepJump(st.num)}
                                className={`group flex items-center gap-3.5 p-3.5 rounded-xl text-left transition-all border ${
                                    isActive
                                        ? 'bg-[#0066cc]/10 dark:bg-[#2997ff]/15 border-[#0066cc]/50 dark:border-[#2997ff]/50 shadow-xs ring-1 ring-[#0066cc]/20'
                                        : isDone
                                        ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/35 hover:bg-emerald-500/10'
                                        : 'bg-card border-border/70 hover:bg-muted/40'
                                }`}
                            >
                                <div className={`relative w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all shadow-xs ${
                                    hasError
                                        ? 'bg-destructive text-destructive-foreground'
                                        : isActive
                                        ? 'bg-[#0066cc] dark:bg-[#2997ff] text-white ring-4 ring-[#0066cc]/20 dark:ring-[#2997ff]/30'
                                        : isDone
                                        ? 'bg-[#34c759] text-white dark:bg-[#30d158]'
                                        : 'bg-muted text-muted-foreground border border-border/60'
                                }`}>
                                    {isDone && !hasError ? (
                                        <Check className="w-5 h-5 stroke-[2.8]" />
                                    ) : hasError ? (
                                        <AlertCircle className="w-5 h-5" />
                                    ) : (
                                        st.num
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <p className={`text-sm sm:text-[15px] font-bold truncate leading-tight ${
                                            isActive
                                                ? 'text-[#0066cc] dark:text-[#2997ff]'
                                                : isDone
                                                ? 'text-foreground'
                                                : 'text-foreground/90'
                                        }`}>
                                            {st.title}
                                        </p>
                                        {hasError && (
                                            <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs sm:text-[13px] text-muted-foreground truncate leading-tight mt-1 block">
                                        {st.subtitle}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Multi-Step Form Container */}
            <Card className="border-border bg-card shadow-xs overflow-hidden">
                <form onSubmit={handleSubmit}>
                    {/* ========================================================================= */}
                    {/* Step 1: Personal & Demographics */}
                    {/* ========================================================================= */}
                    {step === 1 && (
                        <div className="p-6 md:p-8 space-y-6">
                            <CardHeader className="p-0 pb-5 border-b border-border/80">
                                <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                    Personal Profile &amp; Residential Demographics
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground mt-1">
                                    Official identification credentials, national citizenship hierarchy, and emergency contacts.
                                </CardDescription>
                            </CardHeader>

                            {/* Tripartite Full Name, Gender, Marital Status */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                                        <span>Full Legal Name (Tripartite) <span className="text-destructive">*</span></span>
                                        <span className="text-xs font-normal text-muted-foreground">First Father Grandfather</span>
                                    </label>
                                    <Input
                                        required
                                        value={data.full_name}
                                        onChange={(e) => setData('full_name', e.target.value)}
                                        placeholder="e.g. Alazar Bekele Tadesse"
                                        className="h-11 rounded-xl bg-background border-border text-foreground text-sm focus-visible:ring-1 focus-visible:ring-[#0066cc]"
                                    />
                                    {errors.full_name && (
                                        <p className="text-xs text-destructive">{errors.full_name}</p>
                                    )}
                                    {stepAttempted && !data.full_name.trim() && (
                                        <p className="text-xs text-destructive font-medium">Full legal name is required.</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">
                                        Gender <span className="text-destructive">*</span>
                                    </label>
                                    <Select 
                                        value={data.gender} 
                                        onValueChange={(v: 'Male' | 'Female') => setData('gender', v)}
                                    >
                                        <SelectTrigger className="w-full h-11 rounded-xl bg-background border-border text-foreground text-sm">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">
                                        Marital Status
                                    </label>
                                    <Select 
                                        value={data.marital_status} 
                                        onValueChange={(v) => setData('marital_status', v)}
                                    >
                                        <SelectTrigger className="w-full h-11 rounded-xl bg-background border-border text-foreground text-sm">
                                            <SelectValue placeholder="Select marital status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Single">Single</SelectItem>
                                            <SelectItem value="Married">Married</SelectItem>
                                            <SelectItem value="Divorced">Divorced</SelectItem>
                                            <SelectItem value="Widowed">Widowed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Educational Attainment, Phone, Email */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">
                                        Educational Attainment
                                    </label>
                                    <Input
                                        value={data.education_status}
                                        onChange={(e) => setData('education_status', e.target.value)}
                                        placeholder="e.g. BSc in Civil Engineering"
                                        className="h-11 rounded-xl bg-background border-border text-foreground text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                                        <span>Mobile Phone</span>
                                        <span className="text-xs font-normal text-muted-foreground">ET (+251)</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                                        <Input
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="0911 234 567"
                                            className="h-11 pl-10 rounded-xl bg-background border-border text-foreground text-sm"
                                        />
                                    </div>
                                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">
                                        Official Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                                        <Input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="name@elhadar.com"
                                            className="h-11 pl-10 rounded-xl bg-background border-border text-foreground text-sm"
                                        />
                                    </div>
                                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                                </div>
                            </div>

                            <Separator className="my-2 bg-border/60" />

                            {/* Ethiopian Administrative Residence (Offline Resilient) */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        Residential Address Hierarchy
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Regional state, municipal sub-city/zone, woreda, and residential identifier.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">Region / State</label>
                                        <Select value={data.region} onValueChange={handleRegionChange}>
                                            <SelectTrigger className="w-full h-11 rounded-xl bg-background border-border text-foreground text-sm">
                                                <SelectValue placeholder="Select region" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ETHIOPIAN_REGIONS.map((r) => (
                                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">
                                            {data.region === 'Addis Ababa' ? 'Sub-City (K/Ketema)' : 'Zone / City'}
                                        </label>
                                        <Select 
                                            value={data.sub_city} 
                                            onValueChange={(val) => {
                                                setData('sub_city', val);
                                                setData('city', val);
                                            }}
                                        >
                                            <SelectTrigger className="w-full h-11 rounded-xl bg-background border-border text-foreground text-sm">
                                                <SelectValue placeholder="Select zone/sub-city" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableSubCities.map((sc) => (
                                                    <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">Woreda / Kebele</label>
                                        <Input
                                            value={data.woreda}
                                            onChange={(e) => setData('woreda', e.target.value)}
                                            placeholder="e.g. Woreda 03"
                                            className="h-11 rounded-xl bg-background border-border text-foreground text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">House / Flat Number</label>
                                        <Input
                                            value={data.house_no}
                                            onChange={(e) => setData('house_no', e.target.value)}
                                            placeholder="e.g. H-401 / New"
                                            className="h-11 rounded-xl bg-background border-border text-foreground text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-2 bg-border/60" />

                            {/* Emergency Contact Dossier */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        Emergency Contact Details
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Primary next-of-kin contact for field mobilization and safety communications.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">Contact Full Name</label>
                                        <Input
                                            value={data.emergency_contact_name}
                                            onChange={(e) => setData('emergency_contact_name', e.target.value)}
                                            placeholder="e.g. Almaz Bekele"
                                            className="h-11 rounded-xl bg-background border-border text-foreground text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">Relationship</label>
                                        <Input
                                            value={data.emergency_contact_relationship}
                                            onChange={(e) => setData('emergency_contact_relationship', e.target.value)}
                                            placeholder="e.g. Spouse, Brother, Father"
                                            className="h-11 rounded-xl bg-background border-border text-foreground text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">Telephone Number</label>
                                        <Input
                                            value={data.emergency_contact_phone}
                                            onChange={(e) => setData('emergency_contact_phone', e.target.value)}
                                            placeholder="0911 998 877"
                                            className="h-11 rounded-xl bg-background border-border text-foreground text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* Step 2: Role & Organizational Assignment */}
                    {/* ========================================================================= */}
                    {step === 2 && (
                        <div className="p-6 md:p-8 space-y-6">
                            <CardHeader className="p-0 pb-5 border-b border-border/80">
                                <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                    Department, Position &amp; Workplace Assignment
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground mt-1">
                                    Physical filing code index, organizational hierarchy, and statutory probation classification.
                                </CardDescription>
                            </CardHeader>

                            {/* Filing Index, Department, Position */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                                        <span>File Number (Filing Index) <span className="text-destructive">*</span></span>
                                        <span className="text-xs font-normal text-muted-foreground">Unique Index</span>
                                    </label>
                                    <Input
                                        required
                                        value={data.file_no}
                                        onChange={(e) => setData('file_no', e.target.value)}
                                        placeholder="e.g. EH-ENG-042"
                                        className="h-11 rounded-xl bg-background border-border text-foreground text-sm font-medium focus-visible:ring-1 focus-visible:ring-[#0066cc]"
                                    />
                                    {errors.file_no && <p className="text-xs text-destructive">{errors.file_no}</p>}
                                    {stepAttempted && !data.file_no.trim() && (
                                        <p className="text-xs text-destructive font-medium">File number index is required.</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">
                                        Department <span className="text-destructive">*</span>
                                    </label>
                                    <Select 
                                        value={String(data.department_id)} 
                                        onValueChange={(v) => setData('department_id', v)}
                                    >
                                        <SelectTrigger className="w-full h-11 rounded-xl bg-background border-border text-foreground text-sm">
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept.id} value={String(dept.id)}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.department_id && <p className="text-xs text-destructive">{errors.department_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">
                                        Position / Job Title <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        required
                                        value={data.position}
                                        onChange={(e) => setData('position', e.target.value)}
                                        placeholder="e.g. Senior Electrical Project Engineer"
                                        className="h-11 rounded-xl bg-background border-border text-foreground text-sm focus-visible:ring-1 focus-visible:ring-[#0066cc]"
                                    />
                                    {errors.position && <p className="text-xs text-destructive">{errors.position}</p>}
                                    {stepAttempted && !data.position.trim() && (
                                        <p className="text-xs text-destructive font-medium">Position title is required.</p>
                                    )}
                                </div>
                            </div>

                            {/* Workplace Deployment & Contract Model */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                                        <span>Work Place <span className="text-destructive">*</span></span>
                                        <span className="text-xs font-normal text-muted-foreground">Operational Station</span>
                                    </label>
                                    <Select 
                                        value={data.work_place} 
                                        onValueChange={(v) => setData('work_place', v)}
                                    >
                                        <SelectTrigger className="w-full h-11 rounded-xl bg-background border-border text-foreground text-sm">
                                            <SelectValue placeholder="Select workplace" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {WORKPLACE_OPTIONS.map((wp) => (
                                                <SelectItem key={wp.value} value={wp.value}>
                                                    {wp.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.work_place && <p className="text-xs text-destructive">{errors.work_place}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">
                                        Contract Model <span className="text-destructive">*</span>
                                    </label>
                                    <Select 
                                        value={data.contract_type} 
                                        onValueChange={(v: 'Permanent' | 'Contract' | 'Daily') => setData('contract_type', v)}
                                    >
                                        <SelectTrigger className="w-full h-11 rounded-xl bg-background border-border text-foreground text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Permanent">Permanent</SelectItem>
                                            <SelectItem value="Contract">Fixed-Term Contract</SelectItem>
                                            <SelectItem value="Daily">Daily / Casual Labor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">
                                        Initial Status <span className="text-destructive">*</span>
                                    </label>
                                    <Select 
                                        value={data.status} 
                                        onValueChange={(v: 'Probation' | 'Permanent' | 'Contract') => setData('status', v)}
                                    >
                                        <SelectTrigger className="w-full h-11 rounded-xl bg-background border-border text-foreground text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Probation">Probation (Under Evaluation)</SelectItem>
                                            <SelectItem value="Permanent">Permanent (Confirmed)</SelectItem>
                                            <SelectItem value="Contract">Fixed Contract</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Separator className="my-2 bg-border/60" />

                            {/* Statutory Classification & Grade/Step */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">
                                        Employment Classification <span className="text-destructive">*</span>
                                    </label>
                                    <Select 
                                        value={data.employment_type} 
                                        onValueChange={(v: 'Non-Managerial' | 'Managerial') => setData('employment_type', v)}
                                    >
                                        <SelectTrigger className="w-full h-11 rounded-xl bg-background border-border text-foreground text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Non-Managerial">Non-Managerial Staff</SelectItem>
                                            <SelectItem value="Managerial">Managerial / Executive Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {data.employment_type === 'Non-Managerial'
                                            ? 'Statutory 60 working days probation under Labour Proclamation 1156/2019.'
                                            : 'Statutory 90 calendar days probation for managerial leadership.'}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">
                                        Salary Grade
                                    </label>
                                    <Input
                                        value={data.grade}
                                        onChange={(e) => setData('grade', e.target.value)}
                                        placeholder="e.g. IV, VII, X"
                                        className="h-11 rounded-xl bg-background border-border text-foreground text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">
                                        Salary Step
                                    </label>
                                    <Input
                                        value={data.step}
                                        onChange={(e) => setData('step', e.target.value)}
                                        placeholder="e.g. 1, 2, 3"
                                        className="h-11 rounded-xl bg-background border-border text-foreground text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* Step 3: Dual Calendar Dates & Milestones */}
                    {/* ========================================================================= */}
                    {step === 3 && (
                        <div className="p-6 md:p-8 space-y-6">
                            <CardHeader className="p-0 pb-5 border-b border-border/80">
                                <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                    Dual Calendar Dates &amp; Milestone Engine
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground mt-1">
                                    Synchronized Ethiopian Calendar (E.C.) and Gregorian (G.C.) dates with retirement projection.
                                </CardDescription>
                            </CardHeader>

                            {/* Employment Date Sync Block */}
                            <div className="p-5 rounded-xl bg-muted/40 border border-border space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <Calendar className="w-4 h-4 text-[#0066cc] dark:text-[#2997ff]" />
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                                            Date of Employment (Hiring Milestone) <span className="text-destructive">*</span>
                                        </h3>
                                    </div>
                                    <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5 bg-background">
                                        Bidirectional Sync
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">
                                            Gregorian Calendar (G.C.) <span className="text-destructive">*</span>
                                        </label>
                                        <DatePicker
                                            value={data.employment_date}
                                            onChange={handleGcEmploymentDateChange}
                                            placeholder="Select employment date"
                                            fromYear={2000}
                                            toYear={new Date().getFullYear() + 2}
                                        />
                                        {errors.employment_date && <p className="text-xs text-destructive">{errors.employment_date}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                                            <span>Ethiopian Calendar (E.C.) <span className="text-destructive">*</span></span>
                                            <span className="text-xs font-normal text-muted-foreground">DD/MM/YYYY</span>
                                        </label>
                                        <Input
                                            required
                                            value={data.employment_date_ec}
                                            onChange={(e) => handleEcEmploymentDateChange(e.target.value)}
                                            placeholder="DD/MM/YYYY E.C."
                                            className="h-11 rounded-xl bg-background border-border text-foreground text-sm font-semibold text-[#0066cc] dark:text-[#2997ff]"
                                        />
                                        {data.employment_date && (
                                            <p className="text-xs font-medium text-[#0066cc] dark:text-[#2997ff]">
                                                {formatEthiopianDisplay(gcToEc(data.employment_date))}
                                            </p>
                                        )}
                                        {errors.employment_date_ec && <p className="text-xs text-destructive">{errors.employment_date_ec}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Birth Date & Retirement Engine */}
                            <div className="p-5 rounded-xl bg-muted/40 border border-border space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                                            Date of Birth &amp; Statutory 60-Year Retirement Projection
                                        </h3>
                                    </div>
                                    {computedRetirement && (
                                        <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 bg-background border-border text-foreground">
                                            Retires: {computedRetirement.yearGc} G.C. ({computedRetirement.ec})
                                        </Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">
                                            Birth Date in Gregorian (G.C.)
                                        </label>
                                        <DatePicker
                                            value={data.birth_date}
                                            onChange={handleGcBirthDateChange}
                                            placeholder="Select birth date"
                                            fromYear={1950}
                                            toYear={new Date().getFullYear()}
                                        />
                                        {errors.birth_date && <p className="text-xs text-destructive">{errors.birth_date}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                                            <span>Birth Date in Ethiopian Calendar (E.C.)</span>
                                            <span className="text-xs font-normal text-muted-foreground">DD/MM/YYYY</span>
                                        </label>
                                        <Input
                                            value={data.birth_date_ec}
                                            onChange={(e) => handleEcBirthDateChange(e.target.value)}
                                            placeholder="DD/MM/YYYY E.C."
                                            className="h-11 rounded-xl bg-background border-border text-foreground text-sm font-medium"
                                        />
                                        {data.birth_date && (
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {formatEthiopianDisplay(gcToEc(data.birth_date))}
                                            </p>
                                        )}
                                        {errors.birth_date_ec && <p className="text-xs text-destructive">{errors.birth_date_ec}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Term Contract End Date (Only if Contract) */}
                            {data.contract_type === 'Contract' && (
                                <div className="p-5 rounded-xl bg-muted/40 border border-border space-y-3">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                                        Fixed-Term Contract Expiration Date
                                    </h3>
                                    <div className="max-w-xs space-y-2">
                                        <DatePicker
                                            value={data.contract_end_date}
                                            onChange={(val) => setData('contract_end_date', val)}
                                            placeholder="Select contract expiration date"
                                            fromYear={new Date().getFullYear()}
                                            toYear={new Date().getFullYear() + 10}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Specifies tenure ceiling for automated renewal notifications.
                                        </p>
                                        {errors.contract_end_date && <p className="text-xs text-destructive">{errors.contract_end_date}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* Step 4: Compensation & Statutory Banking */}
                    {/* ========================================================================= */}
                    {step === 4 && (
                        <div className="p-6 md:p-8 space-y-6">
                            <CardHeader className="p-0 pb-5 border-b border-border/80">
                                <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                    Statutory Wage, Itemized Allowances &amp; Banking
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground mt-1">
                                    Base monthly salary, field &amp; fringe allowances, and CBE payroll disbursement details.
                                </CardDescription>
                            </CardHeader>

                            {/* Base Monthly Wage & Live Receipt Tile */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-5">
                                    <div className="p-5 rounded-xl bg-muted/40 border border-border space-y-2.5">
                                        <label className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center justify-between">
                                            <span>Basic Monthly Salary (ETB) <span className="text-destructive">*</span></span>
                                            <span className="text-xs font-normal text-muted-foreground">Pension Base</span>
                                        </label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={data.basic_salary}
                                            onChange={(e) => setData('basic_salary', e.target.value)}
                                            placeholder="0.00"
                                            className="h-12 rounded-xl bg-background border-border text-foreground text-lg font-bold text-[#0066cc] dark:text-[#2997ff] focus-visible:ring-1 focus-visible:ring-[#0066cc]"
                                        />
                                        {errors.basic_salary && <p className="text-xs text-destructive">{errors.basic_salary}</p>}
                                        <p className="text-xs text-muted-foreground">
                                            Subject to 7% employee pension deduction and 11% employer contribution per Proclamation 1268/2022.
                                        </p>
                                    </div>

                                    {/* Operational & Field Allowances */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                            Operational &amp; Field Allowances (ETB)
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Hardship Allowance</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.hardship_allowance}
                                                    onChange={(e) => setData('hardship_allowance', e.target.value)}
                                                    className="h-10 rounded-xl bg-background border-border text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Project Site Allowance</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.project_allowance}
                                                    onChange={(e) => setData('project_allowance', e.target.value)}
                                                    className="h-10 rounded-xl bg-background border-border text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Position Allowance</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.position_allowance}
                                                    onChange={(e) => setData('position_allowance', e.target.value)}
                                                    className="h-10 rounded-xl bg-background border-border text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Responsibility</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.responsibility_allowance}
                                                    onChange={(e) => setData('responsibility_allowance', e.target.value)}
                                                    className="h-10 rounded-xl bg-background border-border text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Standard Fringe Allowances */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                            Standard Fringe Allowances (ETB)
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Transport Allowance</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.transport_allowance}
                                                    onChange={(e) => setData('transport_allowance', e.target.value)}
                                                    className="h-10 rounded-xl bg-background border-border text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Housing Allowance</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.house_allowance}
                                                    onChange={(e) => setData('house_allowance', e.target.value)}
                                                    className="h-10 rounded-xl bg-background border-border text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Food Allowance</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.food_allowance}
                                                    onChange={(e) => setData('food_allowance', e.target.value)}
                                                    className="h-10 rounded-xl bg-background border-border text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Mobile Allowance</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.mobile_allowance}
                                                    onChange={(e) => setData('mobile_allowance', e.target.value)}
                                                    className="h-10 rounded-xl bg-background border-border text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Per Diem & Site Subsistence */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                            Per Diem &amp; Site Subsistence (ETB)
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Per Diem Allowance</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.perdiem}
                                                    onChange={(e) => setData('perdiem', e.target.value)}
                                                    className="h-10 rounded-xl bg-background border-border text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Monthly Per Diem Allowance</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.monthly_perdiem}
                                                    onChange={(e) => setData('monthly_perdiem', e.target.value)}
                                                    className="h-10 rounded-xl bg-background border-border text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Statutory Payroll Receipt Card */}
                                <div className="p-5 rounded-xl bg-muted/30 border border-border flex flex-col justify-between space-y-5">
                                    <div>
                                        <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                                            <Receipt className="w-4 h-4 text-[#0066cc] dark:text-[#2997ff]" />
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                                                Live Statutory Receipt
                                            </h3>
                                        </div>

                                        <div className="divide-y divide-border/60 text-sm mt-3">
                                            <div className="py-2.5 flex justify-between items-center">
                                                <span className="text-muted-foreground">Basic Salary</span>
                                                <span className="font-semibold text-foreground">{formatCurrency(payrollMetrics.basic)}</span>
                                            </div>
                                            <div className="py-2.5 flex justify-between items-center">
                                                <span className="text-muted-foreground">Total Allowances</span>
                                                <span className="font-semibold text-foreground">{formatCurrency(payrollMetrics.totalAllowances)}</span>
                                            </div>
                                            <div className="py-3 flex justify-between items-center text-base font-bold text-foreground">
                                                <span>Gross Monthly Pay</span>
                                                <span className="text-[#0066cc] dark:text-[#2997ff]">{formatCurrency(payrollMetrics.grossSalary)}</span>
                                            </div>
                                            <div className="py-2.5 flex justify-between items-center text-muted-foreground">
                                                <span>Employee Pension (7%)</span>
                                                <span className="text-destructive font-medium">-{formatCurrency(payrollMetrics.employeePension)}</span>
                                            </div>
                                            <div className="py-2.5 flex justify-between items-center text-muted-foreground">
                                                <span>Employer Share (11%)</span>
                                                <span className="font-medium text-foreground">+{formatCurrency(payrollMetrics.companyPension)}</span>
                                            </div>
                                            <div className="py-2.5 flex justify-between items-center font-semibold">
                                                <span>Total Pension (18%)</span>
                                                <span className="text-foreground">{formatCurrency(payrollMetrics.totalPension)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-card border border-border/80 text-xs text-muted-foreground">
                                        Computed in accordance with Ethiopian Private Organizations Pension Proclamation 1268/2022.
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-2 bg-border/60" />

                            {/* Banking & Statutory ID Credentials */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        Commercial Banking &amp; Tax Identification
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Direct deposit bank details, TIN tax index, and POESSA pension documentation.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">Commercial Bank</label>
                                        <Select 
                                            value={data.bank_name} 
                                            onValueChange={(v) => setData('bank_name', v)}
                                        >
                                            <SelectTrigger className="w-full h-11 rounded-xl bg-background border-border text-foreground text-sm">
                                                <SelectValue placeholder="Select bank" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ETHIOPIAN_BANKS.map((b) => (
                                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                                            <span>Bank Account Number</span>
                                            <span className="text-xs font-normal text-muted-foreground">CBE 13-digit</span>
                                        </label>
                                        <Input
                                            value={data.bank_account_no}
                                            onChange={(e) => setData('bank_account_no', e.target.value)}
                                            placeholder="1000..."
                                            className="h-11 rounded-xl bg-background border-border text-foreground text-sm font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                                            <span>Taxpayer ID (TIN)</span>
                                            <span className="text-xs font-normal text-muted-foreground">10-digit</span>
                                        </label>
                                        <Input
                                            value={data.tin_no}
                                            onChange={(e) => setData('tin_no', e.target.value)}
                                            placeholder="0012345678"
                                            className="h-11 rounded-xl bg-background border-border text-foreground text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">POESSA Pension No (Private)</label>
                                        <Input
                                            value={data.poessa_no}
                                            onChange={(e) => setData('poessa_no', e.target.value)}
                                            placeholder="POESSA-..."
                                            className="h-11 rounded-xl bg-background border-border text-foreground text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">PSSSA Pension No (Public)</label>
                                        <Input
                                            value={data.psssa_no}
                                            onChange={(e) => setData('psssa_no', e.target.value)}
                                            placeholder="PSSSA-..."
                                            className="h-11 rounded-xl bg-background border-border text-foreground text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">Social Security No</label>
                                        <Input
                                            value={data.social_security_no}
                                            onChange={(e) => setData('social_security_no', e.target.value)}
                                            placeholder="SS-..."
                                            className="h-11 rounded-xl bg-background border-border text-foreground text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">Assigned Vehicle Plate No</label>
                                        <Input
                                            value={data.plate_number}
                                            onChange={(e) => setData('plate_number', e.target.value)}
                                            placeholder="e.g. 3-A-12345"
                                            className="h-11 rounded-xl bg-background border-border text-foreground text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-2 bg-border/60" />

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">
                                    Onboarding Remarks &amp; Statutory Notes
                                </label>
                                <Textarea
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    rows={2}
                                    placeholder="Enter any additional remarks, field placement notes, or onboarding commentary..."
                                    className="rounded-xl bg-background border-border text-foreground text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* Step 5: Review & Confirm Dossier (Pre-Flight Snapshot) */}
                    {/* ========================================================================= */}
                    {step === 5 && (
                        <div className="p-6 md:p-8 space-y-6">
                            <CardHeader className="p-0 pb-5 border-b border-border/80">
                                <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                    Pre-Flight Personnel Dossier Verification
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground mt-1">
                                    Review all personnel parameters before finalizing registration into Elhadar HRMS records.
                                </CardDescription>
                            </CardHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Quadrant 1: Identity & Demographics */}
                                <div className="p-5 rounded-xl bg-muted/40 border border-border space-y-3.5">
                                    <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-[#0066cc] dark:text-[#2997ff]" />
                                            <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                                                Identity &amp; Residence
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setStep(1)}
                                            className="h-8 px-3 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" /> Edit
                                        </Button>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Full Name:</span>
                                            <span className="font-semibold text-foreground">{data.full_name || '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Gender / Marital:</span>
                                            <span className="text-foreground">{data.gender} • {data.marital_status}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Education:</span>
                                            <span className="text-foreground">{data.education_status || '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Phone:</span>
                                            <span className="text-foreground">{data.phone || '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Address:</span>
                                            <span className="text-foreground text-right">
                                                {data.region}, {data.sub_city}
                                                {data.woreda ? `, ${data.woreda}` : ''}
                                                {data.house_no ? `, ${data.house_no}` : ''}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Emergency Contact:</span>
                                            <span className="text-foreground">
                                                {data.emergency_contact_name 
                                                    ? `${data.emergency_contact_name} (${data.emergency_contact_relationship || 'Contact'})` 
                                                    : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quadrant 2: Organizational Placement */}
                                <div className="p-5 rounded-xl bg-muted/40 border border-border space-y-3.5">
                                    <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-[#0066cc] dark:text-[#2997ff]" />
                                            <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                                                Role &amp; Deployment
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setStep(2)}
                                            className="h-8 px-3 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" /> Edit
                                        </Button>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">File Number:</span>
                                            <span className="font-semibold text-foreground">{data.file_no || '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Department:</span>
                                            <span className="font-semibold text-foreground">{selectedDepartment?.name || '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Position:</span>
                                            <span className="text-foreground">{data.position || '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Workplace Station:</span>
                                            <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5 border-border">
                                                {data.work_place}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Classification:</span>
                                            <span className="text-foreground">{data.employment_type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Contract &amp; Status:</span>
                                            <span className="text-foreground">{data.contract_type} • {data.status}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quadrant 3: Dual Calendar Milestones */}
                                <div className="p-5 rounded-xl bg-muted/40 border border-border space-y-3.5">
                                    <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-[#0066cc] dark:text-[#2997ff]" />
                                            <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                                                Statutory Milestones
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setStep(3)}
                                            className="h-8 px-3 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" /> Edit
                                        </Button>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Employment Date (G.C.):</span>
                                            <span className="font-semibold text-foreground">{data.employment_date || '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Employment Date (E.C.):</span>
                                            <span className="font-semibold text-[#0066cc] dark:text-[#2997ff]">
                                                {data.employment_date_ec ? `${data.employment_date_ec} E.C.` : '—'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Birth Date:</span>
                                            <span className="text-foreground">
                                                {data.birth_date ? `${data.birth_date} G.C.` : '—'}
                                                {data.birth_date_ec ? ` (${data.birth_date_ec} E.C.)` : ''}
                                            </span>
                                        </div>
                                        {computedRetirement && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Retirement Horizon (60y):</span>
                                                <span className="text-foreground">{computedRetirement.yearGc} G.C.</span>
                                            </div>
                                        )}
                                        {data.contract_type === 'Contract' && data.contract_end_date && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Contract Expiration:</span>
                                                <span className="text-foreground">{data.contract_end_date}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quadrant 4: Compensation & Bank Details */}
                                <div className="p-5 rounded-xl bg-muted/40 border border-border space-y-3.5">
                                    <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-[#0066cc] dark:text-[#2997ff]" />
                                            <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                                                Gross Pay &amp; Banking
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setStep(4)}
                                            className="h-8 px-3 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" /> Edit
                                        </Button>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Basic Monthly Salary:</span>
                                            <span className="font-semibold text-foreground">{formatCurrency(payrollMetrics.basic)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Total Allowances:</span>
                                            <span className="text-foreground">{formatCurrency(payrollMetrics.totalAllowances)}</span>
                                        </div>
                                        <div className="flex justify-between text-base font-bold pt-2 border-t border-border/60">
                                            <span>Gross Total Pay:</span>
                                            <span className="text-[#0066cc] dark:text-[#2997ff]">{formatCurrency(payrollMetrics.grossSalary)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Statutory Pension (7% / 11%):</span>
                                            <span className="text-foreground">
                                                {formatCurrency(payrollMetrics.employeePension)} / {formatCurrency(payrollMetrics.companyPension)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Bank &amp; Account:</span>
                                            <span className="text-foreground text-right truncate max-w-[200px]">
                                                {data.bank_name} {data.bank_account_no ? `(${data.bank_account_no})` : ''}
                                            </span>
                                        </div>
                                        {data.tin_no && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">TIN:</span>
                                                <span className="text-foreground">{data.tin_no}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons Footer */}
                    <div className="p-4 sm:p-6 border-t border-border/80 bg-muted/20 flex justify-between items-center">
                        {step > 1 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={prevStep}
                                className="h-11 px-6 text-sm font-semibold border-border rounded-xl gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Previous
                            </Button>
                        ) : (
                            <div />
                        )}

                        {step < 5 ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                className="h-11 px-7 bg-[#0066cc] hover:bg-[#0071e3] text-white text-sm font-semibold rounded-xl gap-2 shadow-xs transition-colors"
                            >
                                Continue <ArrowRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-11 px-7 bg-[#0066cc] hover:bg-[#0071e3] text-white text-sm font-bold rounded-xl gap-2 shadow-xs transition-colors"
                            >
                                {processing ? (
                                    <>Enlisting Personnel...</>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Complete Onboarding &amp; Save Employee
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
