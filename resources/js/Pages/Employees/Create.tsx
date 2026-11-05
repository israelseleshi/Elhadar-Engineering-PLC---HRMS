import { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import { Input } from '@/Components/ui/input';
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
    ShieldCheck
} from 'lucide-react';

interface Department {
    id: number;
    name: string;
}

interface Props {
    departments: Department[];
}

export default function Create({ departments }: Props) {
    const [step, setStep] = useState(1);

    const { data, setData, post, processing, errors } = useForm({
        // Step 1: Personal
        full_name: '',
        gender: 'Male',
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

        // Step 2: Assignment
        file_no: '',
        department_id: departments.length > 0 ? String(departments[0].id) : '',
        position: '',
        work_place: 'Project',
        employment_type: 'Non-Managerial',
        contract_type: 'Permanent',
        status: 'Probation',
        grade: 'IV',
        step: '1',

        // Step 3: Dates & Milestones
        employment_date: new Date().toISOString().split('T')[0],
        employment_date_ec: '20/02/2018',
        birth_date: '1995-05-15',
        birth_date_ec: '07/09/1987',
        contract_end_date: '',

        // Step 4: Compensation & Banking
        basic_salary: '18500.00',
        responsibility_allowance: '0',
        project_allowance: '2500',
        position_allowance: '0',
        hardship_allowance: '1500',
        transport_allowance: '1200',
        house_allowance: '3000',
        mobile_allowance: '0',
        food_allowance: '0',
        bank_name: 'Commercial Bank of Ethiopia (CBE)',
        bank_account_no: '',
        tin_no: '',
        social_security_no: '',
        poessa_no: '',
        psssa_no: '',
        plate_number: '',
        remarks: 'Registered via HR onboarding workflow.',
    });

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

    const nextStep = () => setStep((s) => Math.min(4, s + 1));
    const prevStep = () => setStep((s) => Math.max(1, s - 1));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('employees.store'));
    };

    const steps = [
        { num: 1, title: 'Personal & Contacts', icon: User },
        { num: 2, title: 'Role & Assignment', icon: Briefcase },
        { num: 3, title: 'Dual Dates & Milestones', icon: Calendar },
        { num: 4, title: 'Compensation & Banking', icon: CreditCard },
    ];

    return (
        <AuthenticatedLayout
            title="Register New Personnel"
            subtitle="Multi-step onboarding form compliant with Ethiopian Labour Proclamation 1156/2019 and POESSA reporting."
        >
            <Head title="Onboard Personnel - Elhadar Engineering HRMS" />

            {/* Back to Directory */}
            <div className="mb-4">
                <Link href={route('employees.index')}>
                    <Button variant="outline" size="sm" className="gap-2 text-xs font-semibold text-[#008254] border-[#d8d9da] hover:bg-[#effcf8]">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Staff Directory
                    </Button>
                </Link>
            </div>

            {/* Step Wizard Progress Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {steps.map((st) => {
                    const Icon = st.icon;
                    const isActive = step === st.num;
                    const isDone = step > st.num;
                    return (
                        <div
                            key={st.num}
                            onClick={() => setStep(st.num)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                isActive
                                    ? 'bg-[#effcf8] border-[#008254] shadow-xs'
                                    : isDone
                                    ? 'bg-white border-[#b7ecda] text-[#008254]'
                                    : 'bg-white border-[#d8d9da] text-[#64666a]'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isActive
                                        ? 'bg-[#008254] text-white'
                                        : isDone
                                        ? 'bg-[#e3faf2] text-[#008254]'
                                        : 'bg-[#f7f7f7] text-[#64666a]'
                                }`}>
                                    {isDone ? <CheckCircle2 className="w-4 h-4 text-[#008254]" /> : st.num}
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider block text-[#64666a]">
                                        Step {st.num}
                                    </span>
                                    <span className="text-xs font-bold text-black block truncate">
                                        {st.title}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Multi-Step Form Container */}
            <Card className="border-[#d8d9da] bg-white">
                <form onSubmit={handleSubmit}>
                    {/* Step 1: Personal & Demographics */}
                    {step === 1 && (
                        <div className="p-6 space-y-4">
                            <CardHeader className="p-0 pb-4 border-b border-[#ebebec]">
                                <CardTitle className="text-base">Step 1: Personal Profile & Demographics</CardTitle>
                                <CardDescription>Capture official identification and residential address hierarchy</CardDescription>
                            </CardHeader>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols- gap-4 pt-2">
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Full Name (Tripartite) <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Input
                                        required
                                        value={data.full_name}
                                        onChange={(e) => setData('full_name', e.target.value)}
                                        placeholder="First Father Grandfather"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                    {errors.full_name && <p className="text-xs text-[#de2828] mt-1">{errors.full_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Gender <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Select value={data.gender} onValueChange={(v) => setData('gender', v)}><SelectTrigger className="w-full h-10 rounded-xs border-[#d8d9da] bg-[#f7f7f7] text-xs text-[#3d4045]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Marital Status
                                    </label>
                                    <Select value={data.marital_status} onValueChange={(v) => setData('marital_status', v)}><SelectTrigger className="w-full h-10 rounded-xs border-[#d8d9da] bg-[#f7f7f7] text-xs text-[#3d4045]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Single">Single</SelectItem><SelectItem value="Married">Married</SelectItem><SelectItem value="Divorced">Divorced</SelectItem><SelectItem value="Widowed">Widowed</SelectItem></SelectContent></Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols- gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Educational Attainment
                                    </label>
                                    <Input
                                        value={data.education_status}
                                        onChange={(e) => setData('education_status', e.target.value)}
                                        placeholder="e.g. BSc in Civil Engineering"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Mobile Phone (+251)
                                    </label>
                                    <Input
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="0911234567"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Official Email
                                    </label>
                                    <Input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="name@elhadar.com"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-[#ebebec]">
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">Region</label>
                                    <Select
                                        value={allRegions.find((r) => r.name === data.region)?.id?.toString() ?? undefined}
                                        onValueChange={(val) => {
                                            const r = allRegions.find((region) => region.id?.toString() === val);
                                            if (r) setData('region', r.name);
                                        }}
                                        disabled={addressLoading}
                                    >
                                        <SelectTrigger className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10">
                                            <SelectValue placeholder="Region" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allRegions.map((r) => (
                                                <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">City</label>
                                    <Select
                                        value={allZones.find((z) => z.name === data.city)?.id?.toString() ?? undefined}
                                        onValueChange={(val) => {
                                            const z = allZones.find((zone) => zone.id?.toString() === val);
                                            if (z) setData('city', z.name);
                                        }}
                                        disabled={!filteredZones.length || addressLoading}
                                    >
                                        <SelectTrigger className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10">
                                            <SelectValue placeholder="City" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredZones.map((z) => (
                                                <SelectItem key={z.id} value={z.id.toString()}>{z.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">Sub-City (K/Ketema)</label>
                                    <Select
                                        value={allWoredas.find((w) => w.name === data.sub_city)?.id?.toString() ?? undefined}
                                        onValueChange={(val) => {
                                            const w = allWoredas.find((woreda) => woreda.id?.toString() === val);
                                            if (w) setData('sub_city', w.name);
                                        }}
                                        disabled={!filteredWoredas.length || addressLoading}
                                    >
                                        <SelectTrigger className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10">
                                            <SelectValue placeholder="Sub-City" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredWoredas.map((w) => (
                                                <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">Woreda</label>
                                    <Input
                                        value={data.woreda}
                                        onChange={(e) => setData('woreda', e.target.value)}
                                        placeholder="Woreda 03"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">House Number</label>
                                    <Input
                                        value={data.house_no}
                                        onChange={(e) => setData('house_no', e.target.value)}
                                        placeholder="H-401"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols- gap-4 pt-2 border-t border-[#ebebec]">
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">Emergency Contact Name</label>
                                    <Input
                                        value={data.emergency_contact_name}
                                        onChange={(e) => setData('emergency_contact_name', e.target.value)}
                                        placeholder="Family or next of kin"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">Relationship</label>
                                    <Input
                                        value={data.emergency_contact_relationship}
                                        onChange={(e) => setData('emergency_contact_relationship', e.target.value)}
                                        placeholder="e.g. Spouse, Brother, Father"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">Emergency Telephone</label>
                                    <Input
                                        value={data.emergency_contact_phone}
                                        onChange={(e) => setData('emergency_contact_phone', e.target.value)}
                                        placeholder="0911998877"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Role & Department Assignment */}
                    {step === 2 && (
                        <div className="p-6 space-y-4">
                            <CardHeader className="p-0 pb-4 border-b border-[#ebebec]">
                                <CardTitle className="text-base">Step 2: Department, Position & Workplace</CardTitle>
                                <CardDescription>Establish physical filing code, organizational hierarchy, and contract model</CardDescription>
                            </CardHeader>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols- gap-4 pt-2">
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        File Number (Filing Index) <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Input
                                        required
                                        value={data.file_no}
                                        onChange={(e) => setData('file_no', e.target.value)}
                                        placeholder="e.g. A-101, B-012"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10 font-bold"
                                    />
                                    {errors.file_no && <p className="text-xs text-[#de2828] mt-1">{errors.file_no}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Department <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Select value={String(data.department_id)} onValueChange={(v) => setData('department_id', v)}><SelectTrigger className="w-full h-10 rounded-xs border-[#d8d9da] bg-[#f7f7f7] text-xs text-[#3d4045]"><SelectValue placeholder="Select department" /></SelectTrigger><SelectContent>{departments.map((dept) => (<SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>))}</SelectContent></Select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Position / Job Title <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Input
                                        required
                                        value={data.position}
                                        onChange={(e) => setData('position', e.target.value)}
                                        placeholder="e.g. Project Electrical Engineer"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                    {errors.position && <p className="text-xs text-[#de2828] mt-1">{errors.position}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols- gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Work Place <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Select value={data.work_place} onValueChange={(v) => setData('work_place', v)}><SelectTrigger className="w-full h-10 rounded-xs border-[#d8d9da] bg-[#f7f7f7] text-xs text-[#3d4045]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Project">Project Site</SelectItem><SelectItem value="Head Office">Head Office (H.O)</SelectItem></SelectContent></Select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Employment Classification <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Select value={data.employment_type} onValueChange={(v) => setData('employment_type', v)}><SelectTrigger className="w-full h-10 rounded-xs border-[#d8d9da] bg-[#f7f7f7] text-xs text-[#3d4045]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Non-Managerial">Non-Managerial (60 Working Days Probation)</SelectItem><SelectItem value="Managerial">Managerial (90 Calendar Days Probation)</SelectItem></SelectContent></Select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Contract Model <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Select value={data.contract_type} onValueChange={(v) => setData('contract_type', v)}><SelectTrigger className="w-full h-10 rounded-xs border-[#d8d9da] bg-[#f7f7f7] text-xs text-[#3d4045]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Permanent">Permanent</SelectItem><SelectItem value="Contract">Fixed-Term Contract</SelectItem><SelectItem value="Daily">Daily / Casual</SelectItem></SelectContent></Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols- gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Initial Status <span className="text-[#de2828]">*</span>
                                    </label>
                                <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                    <SelectTrigger className="w-full h-10 rounded-xs border-[#d8d9da] bg-[#f7f7f7] text-xs text-[#3d4045]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Probation">Probation (Under Evaluation)</SelectItem>
                                        <SelectItem value="Permanent">Permanent (Confirmed)</SelectItem>
                                        <SelectItem value="Contract">Fixed Contract</SelectItem>
                                    </SelectContent>
                                </Select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">Salary Grade</label>
                                    <Input
                                        value={data.grade}
                                        onChange={(e) => setData('grade', e.target.value)}
                                        placeholder="e.g. IV, VII"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">Salary Step</label>
                                    <Input
                                        value={data.step}
                                        onChange={(e) => setData('step', e.target.value)}
                                        placeholder="e.g. 1, 2"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Dual Calendar Dates & Milestones */}
                    {step === 3 && (
                        <div className="p-6 space-y-4">
                            <CardHeader className="p-0 pb-4 border-b border-[#ebebec]">
                                <CardTitle className="text-base">Step 3: Dual Calendar Dates (E.C. &amp; G.C.)</CardTitle>
                                <CardDescription>Record dates in Ethiopian Calendar with Gregorian synchronization</CardDescription>
                            </CardHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="p-4 rounded-xs bg-[#effcf8] border border-[#b7ecda] space-y-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#008254] block">
                                        Date of Employment
                                    </span>
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">
                                            Ethiopian Calendar Date (E.C) <span className="text-[#de2828]">*</span>
                                        </label>
                                        <Input
                                            required
                                            value={data.employment_date_ec}
                                            onChange={(e) => setData('employment_date_ec', e.target.value)}
                                            placeholder="dd/mm/yyyy E.C (e.g. 20/02/2018)"
                                            className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">
                                            Gregorian Equivalent (G.C) <span className="text-[#de2828]">*</span>
                                        </label>
                                        <Input
                                            type="date"
                                            required
                                            value={data.employment_date}
                                            onChange={(e) => setData('employment_date', e.target.value)}
                                            className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-xs bg-[#f7f7f7] border border-[#ebebec] space-y-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#64666a] block">
                                        Date of Birth (For 60-Year Retirement Engine)
                                    </span>
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">
                                            Birth Date in Ethiopian Calendar (E.C)
                                        </label>
                                        <Input
                                            value={data.birth_date_ec}
                                            onChange={(e) => setData('birth_date_ec', e.target.value)}
                                            placeholder="dd/mm/yyyy E.C"
                                            className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">
                                            Birth Date in Gregorian (G.C)
                                        </label>
                                        <Input
                                            type="date"
                                            value={data.birth_date}
                                            onChange={(e) => setData('birth_date', e.target.value)}
                                            className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            {data.contract_type === 'Contract' && (
                                <div className="p-4 rounded-xs bg-[#fffbeb] border border-[#fef3c7] space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#b45309] block">
                                        Fixed-Term Contract End Date (Con.End Day)
                                    </span>
                                    <Input
                                        type="date"
                                        value={data.contract_end_date}
                                        onChange={(e) => setData('contract_end_date', e.target.value)}
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10 max-w-sm"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Compensation & Banking */}
                    {step === 4 && (
                        <div className="p-6 space-y-4">
                            <CardHeader className="p-0 pb-4 border-b border-[#ebebec]">
                                <CardTitle className="text-base">Step 4: Statutory Wage, Allowances & Banking</CardTitle>
                                <CardDescription>Itemized breakdown of basic salary, allowances, pension shares, and CBE disbursement</CardDescription>
                            </CardHeader>

                            <div className="p-4 rounded-xs bg-[#effcf8] border border-[#b7ecda] mb-2">
                                <label className="block text-xs font-bold text-[#00482f] uppercase tracking-wider mb-1">
                                    Basic Monthly Salary (ETB) <span className="text-[#de2828]">*</span>
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={data.basic_salary}
                                    onChange={(e) => setData('basic_salary', e.target.value)}
                                    placeholder="18500.00"
                                    className="bg-[#f7f7f7] border-[#d8d9da] text-sm h-11 font-bold text-[#008254]"
                                />
                                <span className="text-[11px] text-[#64666a] mt-1 block">
                                    Subject to 7% employee pension deduction and 11% employer contribution per Proclamation 1268/2022.
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-black mb-1">Hardship Allowance</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.hardship_allowance}
                                        onChange={(e) => setData('hardship_allowance', e.target.value)}
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-black mb-1">Project Site Allowance</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.project_allowance}
                                        onChange={(e) => setData('project_allowance', e.target.value)}
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-black mb-1">Position / Role Allowance</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.position_allowance}
                                        onChange={(e) => setData('position_allowance', e.target.value)}
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-black mb-1">Transport Allowance</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.transport_allowance}
                                        onChange={(e) => setData('transport_allowance', e.target.value)}
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-black mb-1">Housing Allowance</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.house_allowance}
                                        onChange={(e) => setData('house_allowance', e.target.value)}
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-black mb-1">Mobile Allowance</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.mobile_allowance}
                                        onChange={(e) => setData('mobile_allowance', e.target.value)}
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-black mb-1">Food Allowance</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.food_allowance}
                                        onChange={(e) => setData('food_allowance', e.target.value)}
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-black mb-1">Responsibility Allowance</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.responsibility_allowance}
                                        onChange={(e) => setData('responsibility_allowance', e.target.value)}
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols- gap-4 pt-2 border-t border-[#ebebec]">
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">Commercial Bank Name</label>
                                    <Input
                                        value={data.bank_name}
                                        onChange={(e) => setData('bank_name', e.target.value)}
                                        placeholder="Commercial Bank of Ethiopia (CBE)"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">Bank Account Number</label>
                                    <Input
                                        value={data.bank_account_no}
                                        onChange={(e) => setData('bank_account_no', e.target.value)}
                                        placeholder="1000..."
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">Tax ID Number (TIN)</label>
                                    <Input
                                        value={data.tin_no}
                                        onChange={(e) => setData('tin_no', e.target.value)}
                                        placeholder="0012345678"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">POESSA Pension No</label>
                                    <Input
                                        value={data.poessa_no}
                                        onChange={(e) => setData('poessa_no', e.target.value)}
                                        placeholder="POESSA-..."
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">PSSSA Pension No</label>
                                    <Input
                                        value={data.psssa_no}
                                        onChange={(e) => setData('psssa_no', e.target.value)}
                                        placeholder="PSSSA-..."
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">Assigned Vehicle Plate No</label>
                                    <Input
                                        value={data.plate_number}
                                        onChange={(e) => setData('plate_number', e.target.value)}
                                        placeholder="e.g. 3-A-12345"
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">Social Security Number</label>
                                    <Input
                                        value={data.social_security_no}
                                        onChange={(e) => setData('social_security_no', e.target.value)}
                                        placeholder="SS-..."
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-[#ebebec]">
                                <label className="block text-xs font-bold text-black mb-1">Remarks &amp; Onboarding Notes (Section 8)</label>
                                <Textarea
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    rows={2}
                                    placeholder="Enter any onboarding remarks or statutory notes..."
                                    className="w-full p-2.5 rounded-xs border border-[#d8d9da] bg-[#f7f7f7] text-xs text-[#3d4045] focus-visible:ring-[#008254]"
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons Footer */}
                    <div className="p-6 border-t border-[#ebebec] bg-[#f7f7f7] flex justify-between items-center">
                        {step > 1 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={prevStep}
                                className="text-xs border-[#d8d9da] rounded-xs gap-1.5"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" /> Previous
                            </Button>
                        ) : <div />}

                        {step < 4 ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                className="bg-[#008254] hover:bg-[#006642] text-white text-xs font-bold uppercase rounded-xs gap-1.5"
                            >
                                Next Step <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[#008254] hover:bg-[#006642] text-white text-xs font-bold uppercase rounded-xs gap-1.5"
                            >
                                {processing ? 'Submitting...' : 'Complete Onboarding & Save Employee'}
                            </Button>
                        )}
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
