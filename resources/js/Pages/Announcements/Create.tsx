import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Textarea } from '@/Components/ui/textarea';
import { Badge } from '@/Components/ui/badge';
import { Checkbox } from '@/Components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { toast } from 'sonner';
import {
    ArrowLeft,
    CalendarClock,
    FileText,
    Megaphone,
    Pin,
    Send,
    Shield,
    Upload,
    X,
    AlertTriangle,
    Bell,
    Users,
    Building2,
    MapPin,
    Smartphone,
    Smile,
    Calendar,
} from 'lucide-react';

interface Props {
    departments: { id: number; name: string }[];
    work_places: string[];
    roles: string[];
    contract_types: string[];
    employees: { id: number; name: string; role: string }[];
}

interface FormData {
    title: string;
    title_am: string;
    content: string;
    content_am: string;
    priority: 'standard' | 'important' | 'critical';
    category: 'general' | 'policy' | 'safety' | 'payroll' | 'holiday' | 'event';
    target_type: 'all' | 'departments' | 'work_places' | 'roles' | 'contract_types' | 'custom';
    target_department_ids: number[];
    target_work_places: string[];
    target_roles: string[];
    target_contract_types: string[];
    target_user_ids: number[];
    attachment: File | null;
    requires_acknowledgment: boolean;
    allow_reactions: boolean;
    send_sms: boolean;
    status: 'published' | 'draft' | 'scheduled';
    is_pinned: boolean;
    is_active: boolean;
    published_at: string;
    expires_at: string;
}

const today = (): string => new Date().toISOString().split('T')[0];

export default function AnnouncementsCreate({
    departments,
    work_places,
    roles,
    contract_types,
    employees,
}: Props) {
    const [langTab, setLangTab] = useState<'en' | 'am'>('en');
    const [publishImmediately, setPublishImmediately] = useState(true);
    const [hasExpiry, setHasExpiry] = useState(false);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        title: '',
        title_am: '',
        content: '',
        content_am: '',
        priority: 'standard',
        category: 'general',
        target_type: 'all',
        target_department_ids: [],
        target_work_places: [],
        target_roles: [],
        target_contract_types: [],
        target_user_ids: [],
        attachment: null,
        requires_acknowledgment: false,
        allow_reactions: true,
        send_sms: false,
        status: 'published',
        is_pinned: false,
        is_active: true,
        published_at: today(),
        expires_at: '',
    });

    const handleTargetTypeChange = (type: FormData['target_type']) => {
        setData('target_type', type);
    };

    const toggleDepartment = (id: number) => {
        setData(
            'target_department_ids',
            data.target_department_ids.includes(id)
                ? data.target_department_ids.filter((x) => x !== id)
                : [...data.target_department_ids, id]
        );
    };

    const toggleWorkPlace = (wp: string) => {
        setData(
            'target_work_places',
            data.target_work_places.includes(wp)
                ? data.target_work_places.filter((x) => x !== wp)
                : [...data.target_work_places, wp]
        );
    };

    const toggleRole = (r: string) => {
        setData(
            'target_roles',
            data.target_roles.includes(r)
                ? data.target_roles.filter((x) => x !== r)
                : [...data.target_roles, r]
        );
    };

    const toggleContractType = (ct: string) => {
        setData(
            'target_contract_types',
            data.target_contract_types.includes(ct)
                ? data.target_contract_types.filter((x) => x !== ct)
                : [...data.target_contract_types, ct]
        );
    };

    const toggleUser = (userId: number) => {
        setData(
            'target_user_ids',
            data.target_user_ids.includes(userId)
                ? data.target_user_ids.filter((x) => x !== userId)
                : [...data.target_user_ids, userId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('announcements.store'), {
            forceFormData: true,
            preserveScroll: true,
            onError: () => {
                toast.error('Please check the required fields before submitting.');
            },
        });
    };

    return (
        <AuthenticatedLayout
            title="Create Official Announcement"
            subtitle="Publish circulars, directives, and notifications with audience targeting."
        >
            <Head title="Publish Announcement - Elhadar Engineering HRMS" />

            <div className="mb-6 flex items-center justify-between">
                <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground">
                    <Link href={route('announcements.index')}>
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Notice Board</span>
                    </Link>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: Main Content & Language Tabs (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        <Card className="rounded-2xl border border-border/80 shadow-xs bg-card overflow-hidden">
                            <CardHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        Circular Content &amp; Language
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        Provide the announcement details in English and optional Amharic.
                                    </CardDescription>
                                </div>

                                {/* Bilingual Tabs */}
                                <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setLangTab('en')}
                                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                                            langTab === 'en'
                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        English
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLangTab('am')}
                                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                                            langTab === 'am'
                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        አማርኛ (Amharic)
                                    </button>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6 space-y-5">
                                {langTab === 'en' ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="title" className="text-xs font-semibold text-foreground">
                                                Announcement Title (English) <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="title"
                                                value={data.title}
                                                onChange={(e) => setData('title', e.target.value)}
                                                placeholder="e.g. Mandatory PPE Protocol Update for Project Sites"
                                                className="rounded-xl border-border/80 focus-visible:ring-primary/20 text-sm font-medium"
                                                required
                                            />
                                            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="content" className="text-xs font-semibold text-foreground">
                                                Body Content (English) <span className="text-destructive">*</span>
                                            </Label>
                                            <Textarea
                                                id="content"
                                                rows={7}
                                                value={data.content}
                                                onChange={(e) => setData('content', e.target.value)}
                                                placeholder="Write the full announcement text, key directives, guidelines, and contact persons..."
                                                className="rounded-xl border-border/80 focus-visible:ring-primary/20 text-sm leading-relaxed"
                                                required
                                            />
                                            {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="title_am" className="text-xs font-semibold text-foreground">
                                                የማስታወቂያው ርዕስ (አማርኛ)
                                            </Label>
                                            <Input
                                                id="title_am"
                                                value={data.title_am}
                                                onChange={(e) => setData('title_am', e.target.value)}
                                                placeholder="ምሳሌ፡ በግንባታ ቦታዎች ላይ የደህንነት አልባሳት አጠቃቀም መመሪያ"
                                                className="rounded-xl border-border/80 focus-visible:ring-primary/20 text-sm font-medium"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="content_am" className="text-xs font-semibold text-foreground">
                                                ዝርዝር መግለጫ (አማርኛ)
                                            </Label>
                                            <Textarea
                                                id="content_am"
                                                rows={7}
                                                value={data.content_am}
                                                onChange={(e) => setData('content_am', e.target.value)}
                                                placeholder="የማስታወቂያውን ሙሉ ዝርዝር እና መመሪያዎች እዚህ ይጻፉ..."
                                                className="rounded-xl border-border/80 focus-visible:ring-primary/20 text-sm leading-relaxed"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Official Document Attachment Upload */}
                                <div className="pt-2 border-t border-border/60">
                                    <Label className="text-xs font-semibold text-foreground block mb-2">
                                        Official Signed Circular Attachment (PDF, Image, Word)
                                    </Label>
                                    {data.attachment ? (
                                        <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="w-4 h-4 text-primary shrink-0" />
                                                <span className="text-xs font-medium text-foreground truncate">
                                                    {data.attachment.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    ({Math.round(data.attachment.size / 1024)} KB)
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setData('attachment', null)}
                                                className="text-muted-foreground hover:text-destructive p-1 rounded-md"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="border-2 border-dashed border-border/80 hover:border-primary/50 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-muted/10 hover:bg-muted/20">
                                            <Upload className="w-6 h-6 text-muted-foreground" />
                                            <span className="text-xs font-medium text-foreground">
                                                Click or drag official PDF circular here
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                PDF, JPG, PNG, DOCX up to 10 MB
                                            </span>
                                            <Input
                                                type="file"
                                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setData('attachment', e.target.files[0]);
                                                    }
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Audience Targeting Selector */}
                        <Card className="rounded-2xl border border-border/80 shadow-xs bg-card">
                            <CardHeader className="p-6 pb-3">
                                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    <span>Target Audience Segmentation</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Specify who should receive and see this circular.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 pt-2 space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {[
                                        { id: 'all', label: 'All Staff', icon: Users },
                                        { id: 'departments', label: 'By Department', icon: Building2 },
                                        { id: 'work_places', label: 'By Project Site', icon: MapPin },
                                        { id: 'roles', label: 'By Level', icon: Shield },
                                        { id: 'contract_types', label: 'By Contract', icon: FileText },
                                        { id: 'custom', label: 'Specific Staff', icon: Users },
                                    ].map((t) => {
                                        const isSelected = data.target_type === t.id;
                                        return (
                                            <button
                                                type="button"
                                                key={t.id}
                                                onClick={() => handleTargetTypeChange(t.id as any)}
                                                className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                                                    isSelected
                                                        ? 'bg-primary/10 border-primary text-primary font-semibold shadow-xs'
                                                        : 'border-border/80 bg-background text-muted-foreground hover:text-foreground hover:bg-accent'
                                                }`}
                                            >
                                                <t.icon className="w-4 h-4 shrink-0" />
                                                <span className="text-xs">{t.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Conditional Sub-Selectors */}
                                {data.target_type === 'departments' && (
                                    <div className="pt-3 border-t border-border/60">
                                        <Label className="text-xs font-semibold text-foreground block mb-2">
                                            Select Targeted Departments:
                                        </Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                                            {departments.map((d) => (
                                                <label
                                                    key={d.id}
                                                    className="flex items-center gap-2 text-xs p-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer"
                                                >
                                                    <Checkbox
                                                        checked={data.target_department_ids.includes(d.id)}
                                                        onCheckedChange={() => toggleDepartment(d.id)}
                                                    />
                                                    <span className="truncate">{d.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {data.target_type === 'work_places' && (
                                    <div className="pt-3 border-t border-border/60">
                                        <Label className="text-xs font-semibold text-foreground block mb-2">
                                            Select Targeted Workplaces / Sites:
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {work_places.map((wp) => (
                                                <button
                                                    type="button"
                                                    key={wp}
                                                    onClick={() => toggleWorkPlace(wp)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                        data.target_work_places.includes(wp)
                                                            ? 'bg-primary text-primary-foreground border-primary'
                                                            : 'bg-background border-border text-foreground hover:bg-accent'
                                                    }`}
                                                >
                                                    {wp}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {data.target_type === 'roles' && (
                                    <div className="pt-3 border-t border-border/60">
                                        <Label className="text-xs font-semibold text-foreground block mb-2">
                                            Select Targeted Staff Level:
                                        </Label>
                                        <div className="flex gap-2">
                                            {roles.map((r) => (
                                                <button
                                                    type="button"
                                                    key={r}
                                                    onClick={() => toggleRole(r)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                        data.target_roles.includes(r)
                                                            ? 'bg-primary text-primary-foreground border-primary'
                                                            : 'bg-background border-border text-foreground hover:bg-accent'
                                                    }`}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {data.target_type === 'contract_types' && (
                                    <div className="pt-3 border-t border-border/60">
                                        <Label className="text-xs font-semibold text-foreground block mb-2">
                                            Select Contract Types:
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {contract_types.map((ct) => (
                                                <button
                                                    type="button"
                                                    key={ct}
                                                    onClick={() => toggleContractType(ct)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                        data.target_contract_types.includes(ct)
                                                            ? 'bg-primary text-primary-foreground border-primary'
                                                            : 'bg-background border-border text-foreground hover:bg-accent'
                                                    }`}
                                                >
                                                    {ct}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {data.target_type === 'custom' && (
                                    <div className="pt-3 border-t border-border/60">
                                        <Label className="text-xs font-semibold text-foreground block mb-2">
                                            Select Individual Employees ({data.target_user_ids.length} selected):
                                        </Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                                            {employees.map((emp) => (
                                                <label
                                                    key={emp.id}
                                                    className="flex items-center gap-2 text-xs p-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer"
                                                >
                                                    <Checkbox
                                                        checked={data.target_user_ids.includes(emp.id)}
                                                        onCheckedChange={() => toggleUser(emp.id)}
                                                    />
                                                    <span className="truncate">{emp.name} ({emp.role})</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Priority, Compliance, Lifecycle Settings (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Priority & Category */}
                        <Card className="rounded-2xl border border-border/80 shadow-xs bg-card">
                            <CardHeader className="p-5 pb-3">
                                <CardTitle className="text-sm font-semibold text-foreground">
                                    Priority &amp; Category
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 pt-0 space-y-4">
                                <div>
                                    <Label className="text-xs font-semibold text-foreground block mb-1.5">
                                        Urgency Level
                                    </Label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {[
                                            { id: 'standard', label: 'General', color: 'bg-primary/10 text-primary border-primary/30' },
                                            { id: 'important', label: 'Important', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
                                            { id: 'critical', label: 'Critical', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
                                        ].map((p) => (
                                            <button
                                                type="button"
                                                key={p.id}
                                                onClick={() => setData('priority', p.id as any)}
                                                className={`py-1.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                                                    data.priority === p.id ? p.color + ' shadow-xs' : 'border-border text-muted-foreground'
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-foreground block mb-1.5">
                                        Circular Category
                                    </Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={(val: any) => setData('category', val)}
                                    >
                                        <SelectTrigger className="w-full text-xs rounded-xl border border-border bg-background h-10">
                                            <SelectValue placeholder="Select circular category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">General Company News</SelectItem>
                                            <SelectItem value="policy">Official HR Policy</SelectItem>
                                            <SelectItem value="safety">Health, Safety &amp; Environment</SelectItem>
                                            <SelectItem value="payroll">Payroll &amp; Compensation</SelectItem>
                                            <SelectItem value="holiday">Public Holiday Notice</SelectItem>
                                            <SelectItem value="event">Corporate Event / Milestone</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Compliance, E-Sign & Social Settings */}
                        <Card className="rounded-2xl border border-border/80 shadow-xs bg-card">
                            <CardHeader className="p-5 pb-3">
                                <CardTitle className="text-sm font-semibold text-foreground">
                                    Governance &amp; Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 pt-0 space-y-4 text-xs">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-foreground flex items-center gap-1">
                                            <Shield className="w-3.5 h-3.5 text-primary" /> Require Acknowledgment
                                        </p>
                                        <p className="text-muted-foreground text-[11px]">
                                            Employee must click E-Sign receipt confirmation.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.requires_acknowledgment}
                                        onCheckedChange={(c) => setData('requires_acknowledgment', c)}
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
                                    <div>
                                        <p className="font-semibold text-foreground flex items-center gap-1">
                                            <Smile className="w-3.5 h-3.5 text-primary" /> Allow Reactions
                                        </p>
                                        <p className="text-muted-foreground text-[11px]">
                                            Employees can react with 👏 🎉 ❤️ 👍.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.allow_reactions}
                                        onCheckedChange={(c) => setData('allow_reactions', c)}
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
                                    <div>
                                        <p className="font-semibold text-foreground flex items-center gap-1">
                                            <Pin className="w-3.5 h-3.5 text-primary" /> Pin to Notice Board
                                        </p>
                                        <p className="text-muted-foreground text-[11px]">
                                            Keeps this circular hero-pinned on dashboard.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.is_pinned}
                                        onCheckedChange={(c) => setData('is_pinned', c)}
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
                                    <div>
                                        <p className="font-semibold text-foreground flex items-center gap-1">
                                            <Smartphone className="w-3.5 h-3.5 text-amber-500" /> Dispatch Field SMS
                                        </p>
                                        <p className="text-muted-foreground text-[11px]">
                                            Simulate SMS memo (Log/Sandbox mode).
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.send_sms}
                                        onCheckedChange={(c) => setData('send_sms', c)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Scheduling & Lifecycle */}
                        <Card className="rounded-2xl border border-border/80 shadow-xs bg-card">
                            <CardHeader className="p-5 pb-3">
                                <CardTitle className="text-sm font-semibold text-foreground">
                                    Publishing &amp; Lifecycle
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 pt-0 space-y-3.5 text-xs">
                                <div className="space-y-1.5">
                                    <Label className="font-semibold text-foreground">Publication Date</Label>
                                    <Input
                                        type="date"
                                        value={data.published_at}
                                        onChange={(e) => setData('published_at', e.target.value)}
                                        className="rounded-xl border-border text-xs"
                                    />
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-border/40">
                                    <div className="flex items-center justify-between">
                                        <Label className="font-semibold text-foreground">Auto-Expire Circular</Label>
                                        <Switch checked={hasExpiry} onCheckedChange={(c) => {
                                            setHasExpiry(c);
                                            if (!c) setData('expires_at', '');
                                        }} />
                                    </div>
                                    {hasExpiry && (
                                        <Input
                                            type="date"
                                            value={data.expires_at}
                                            onChange={(e) => setData('expires_at', e.target.value)}
                                            className="rounded-xl border-border text-xs mt-2"
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit Action */}
                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl shadow-sm gap-2 text-sm"
                        >
                            <Send className="w-4 h-4" />
                            <span>{processing ? 'Publishing Circular...' : 'Publish Announcement'}</span>
                        </Button>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
