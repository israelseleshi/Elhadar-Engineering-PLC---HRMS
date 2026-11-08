import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Badge } from '@/Components/ui/badge';
import {
    SegmentedControl,
    SegmentedControlItem,
} from '@/Components/boardui/components/base/segmented-control/segmented-control';
import { DatePicker as BoardUIDatePicker } from '@/Components/boardui/components/base/date-picker/date-picker';
import { NumberField as BoardUINumberField } from '@/Components/boardui/components/base/number-field/number-field';
import { Textarea as BoardUITextarea } from '@/Components/boardui/components/base/textarea/textarea';
import { parseDate, type CalendarDate } from '@internationalized/date';
import {
    RiCalendarLine,
    RiTimeLine,
    RiPhoneLine,
    RiFileTextLine,
    RiSendPlaneFill,
    RiUploadCloud2Line,
} from '@remixicon/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
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
import {
    CalendarCheck,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Send,
    Paperclip,
    RotateCcw,
    Shield,
    Users,
    FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { gcToEc } from '@/lib/ethiopianDate';

interface Colleague {
    id: number;
    full_name: string;
    file_no: string;
    position: string;
}

interface LeaveRequestItem {
    id: number;
    leave_type: string;
    start_date: string;
    start_date_ec?: string;
    end_date: string;
    end_date_ec?: string;
    requested_days: number;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
    handover_employee?: {
        id: number;
        full_name: string;
        file_no: string;
        position: string;
    } | null;
    reviewer?: {
        id: number;
        name: string;
    } | null;
    reviewer_notes?: string | null;
    attachment_path?: string | null;
    created_at: string;
}

interface Props {
    employee: {
        id: number;
        full_name: string;
        file_no: string;
        position: string;
        department?: string;
        phone?: string;
    } | null;
    tenure: {
        years: number;
        months: number;
        days: number;
        formatted: string;
    };
    annualLeaveEntitlement: number;
    availableDays: number;
    approvedDaysTaken: number;
    pendingCount: number;
    leaveRequests: LeaveRequestItem[];
    colleagues: Colleague[];
}

export default function Leave({
    employee,
    tenure,
    annualLeaveEntitlement,
    availableDays,
    approvedDaysTaken,
    pendingCount,
    leaveRequests,
    colleagues,
}: Props) {
    const [activeTab, setActiveTab] = useState<'new-request' | 'history'>('new-request');
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [requestToCancel, setRequestToCancel] = useState<LeaveRequestItem | null>(null);

    const sanitizePhoneNumber = (raw: string): string => {
        let digits = raw.replace(/\D/g, '');

        if (digits.startsWith('251')) {
            digits = digits.slice(3);
        }

        digits = digits.replace(/^0+/, '');

        // Ethiopian mobile numbers start with 9 (Ethio Telecom) or 7 (Safaricom)
        if (digits.length > 0 && !digits.startsWith('9') && !digits.startsWith('7')) {
            const validIdx = digits.search(/[97]/);
            if (validIdx !== -1) {
                digits = digits.slice(validIdx);
            } else {
                digits = '';
            }
        }

        return digits.slice(0, 9);
    };

    const initialPhoneNational = sanitizePhoneNumber(employee?.phone || '');
    const [contactPhoneNational, setContactPhoneNational] = useState(initialPhoneNational);

    const {
        data: leaveData,
        setData: setLeaveData,
        post: postLeave,
        processing,
        errors: leaveErrors,
        reset: resetLeave,
    } = useForm({
        leave_type: 'Annual',
        start_date: '',
        start_date_ec: '',
        end_date: '',
        end_date_ec: '',
        requested_days: '1',
        reason: '',
        handover_employee_id: '',
        contact_phone: initialPhoneNational ? `+251${initialPhoneNational}` : '',
        attachment: null as File | null,
    });

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitized = sanitizePhoneNumber(e.target.value);
        setContactPhoneNational(sanitized);
        setLeaveData('contact_phone', sanitized ? `+251${sanitized}` : '');
    };

    const toCalendarDate = (dateStr?: string): CalendarDate | null => {
        if (!dateStr) return null;
        try {
            return parseDate(dateStr);
        } catch {
            return null;
        }
    };

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
                setContactPhoneNational(initialPhoneNational);
                toast.success('Leave request submitted successfully for HR review');
                setActiveTab('history');
            },
            onError: () => {
                toast.error('Please resolve the errors highlighted below.');
            },
        });
    };

    const handleCancelLeave = () => {
        if (!requestToCancel) return;
        router.patch(
            route('portal.leave.cancel', requestToCancel.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCancelDialogOpen(false);
                    setRequestToCancel(null);
                    toast.success('Leave request cancelled');
                },
                onError: () => {
                    toast.error('Unable to cancel leave request.');
                },
            }
        );
    };

    const requestedNumber = parseFloat(leaveData.requested_days) || 0;
    const remainingAfterRequest =
        leaveData.leave_type === 'Annual' ? Math.max(0, availableDays - requestedNumber) : availableDays;

    return (
        <AuthenticatedLayout
            title="Leave Requests"
            subtitle="Request annual statutory rest, sick leave, or authorized absence and track approval status"
        >
            <Head title="Leave Requests - Employee Portal" />

            <div className="space-y-6">
                {/* Top Metrics Row: 3 Solid 100% Opaque Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* 1. Annual Leave Balance */}
                    <Card className="border-border bg-card shadow-xs rounded-xl p-5 flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-foreground">Annual Leave Balance</h3>
                                <div className="flex items-baseline gap-1.5 mt-2">
                                    <span className="text-3xl font-semibold tracking-tight text-primary">
                                        {availableDays}
                                    </span>
                                    <span className="text-xs font-medium text-muted-foreground">Working Days</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-primary shrink-0">
                                <CalendarCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 pt-2.5 border-t border-border/60">
                            Statutory entitlement: <strong className="font-semibold text-foreground">{annualLeaveEntitlement} days</strong> based on {tenure.years} years service (Art. 77)
                        </p>
                    </Card>

                    {/* 2. Approved Days Taken */}
                    <Card className="border-border bg-card shadow-xs rounded-xl p-5 flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-foreground">Approved Leaves Taken</h3>
                                <div className="flex items-baseline gap-1.5 mt-2">
                                    <span className="text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                                        {approvedDaysTaken}
                                    </span>
                                    <span className="text-xs font-medium text-muted-foreground">Days</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 pt-2.5 border-t border-border/60">
                            Approved and logged within current operational leave cycle
                        </p>
                    </Card>

                    {/* 3. Pending HR Reviews */}
                    <Card className="border-border bg-card shadow-xs rounded-xl p-5 flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-foreground">Pending Requests</h3>
                                <div className="flex items-baseline gap-1.5 mt-2">
                                    <span className="text-3xl font-semibold tracking-tight text-amber-600 dark:text-amber-400">
                                        {pendingCount}
                                    </span>
                                    <span className="text-xs font-medium text-muted-foreground">Awaiting Review</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 pt-2.5 border-t border-border/60">
                            Under active review by department supervisor and HR
                        </p>
                    </Card>
                </div>

                {/* Board UI Segmented Control — Apple macOS / iOS Capsule Switcher */}
                <div className="flex items-center justify-between pt-1">
                    <SegmentedControl
                        aria-label="Leave View Switcher"
                        selectedKeys={[activeTab]}
                        onSelectionChange={(keys) => {
                            const next = [...(keys as Set<string>)][0] as 'new-request' | 'history' | undefined;
                            if (next) setActiveTab(next);
                        }}
                        className="p-1 rounded-xl bg-muted/80 dark:bg-card border border-border/80 shadow-2xs"
                    >
                        <SegmentedControlItem
                            id="new-request"
                            className="px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-lg cursor-pointer"
                        >
                            <CalendarCheck className="w-3.5 h-3.5 text-primary" />
                            <span>Request New Leave</span>
                        </SegmentedControlItem>

                        <SegmentedControlItem
                            id="history"
                            className="px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-lg cursor-pointer"
                        >
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>Leave History &amp; Status</span>
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary">
                                {leaveRequests.length}
                            </span>
                        </SegmentedControlItem>
                    </SegmentedControl>
                </div>

                {activeTab === 'new-request' ? (
                    <div className="animate-in fade-in-50 duration-200 outline-hidden">
                        <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
                            <CardHeader className="py-4 px-6 border-b border-border/70">
                                <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    <span>Formal Leave Application</span>
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                    Applications are submitted directly to HR and the designated relief officer under Ethiopian Labour Proclamation No. 1156/2019.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-6">
                                <form onSubmit={handleLeaveSubmit} className="space-y-6">
                                    {/* 1. Leave Classification & Handover Colleague */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="leave_type" className="text-xs font-semibold text-foreground flex items-center gap-1">
                                                <span>Leave Classification</span>
                                                <span className="text-destructive">*</span>
                                            </Label>
                                            <Select
                                                value={leaveData.leave_type}
                                                onValueChange={(val) => setLeaveData('leave_type', val)}
                                            >
                                                <SelectTrigger id="leave_type" className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground text-xs shadow-2xs hover:border-border/80">
                                                    <SelectValue placeholder="Select leave classification" />
                                                </SelectTrigger>
                                                <SelectContent>
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
                                            <p className="text-[11px] text-muted-foreground">
                                                Governed under Ethiopian Labour Proclamation No. 1156/2019 statutory rights.
                                            </p>
                                            {leaveErrors.leave_type && (
                                                <p className="text-xs text-destructive font-medium">{leaveErrors.leave_type}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="handover_employee_id" className="text-xs font-semibold text-foreground flex items-center gap-1">
                                                <span>Designated Relief / Handover Colleague</span>
                                                <span className="text-muted-foreground font-normal text-[11px]">(Optional)</span>
                                            </Label>
                                            <Select
                                                value={leaveData.handover_employee_id || '__none__'}
                                                onValueChange={(val) => setLeaveData('handover_employee_id', val === '__none__' ? '' : val)}
                                            >
                                                <SelectTrigger id="handover_employee_id" className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground text-xs shadow-2xs hover:border-border/80">
                                                    <SelectValue placeholder="None / Independent Operational Role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">None / Independent Operational Role</SelectItem>
                                                    {colleagues.map((c) => (
                                                        <SelectItem key={c.id} value={String(c.id)}>
                                                            {c.full_name} ({c.file_no}) — {c.position}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-[11px] text-muted-foreground">
                                                Colleague assigned to handle time-critical duties during your absence.
                                            </p>
                                            {leaveErrors.handover_employee_id && (
                                                <p className="text-xs text-destructive font-medium">{leaveErrors.handover_employee_id}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Schedule: Commencement & Conclusion Dates */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                                        {/* Commencement Date */}
                                        <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-2xs hover:border-border/80 transition-all">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-primary" />
                                                    <span>Commencement Date</span>
                                                    <span className="text-destructive">*</span>
                                                </span>
                                                {leaveData.start_date_ec && (
                                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                                                        🇪🇹 {leaveData.start_date_ec}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="start_date" className="text-[11px] font-medium text-muted-foreground block">
                                                    Gregorian Calendar (G.C.)
                                                </Label>
                                                <BoardUIDatePicker
                                                    value={toCalendarDate(leaveData.start_date)}
                                                    onChange={(cDate) => handleStartDateChange(cDate ? cDate.toString() : '')}
                                                    aria-label="Commencement Date (G.C.)"
                                                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-xs shadow-2xs justify-start"
                                                />
                                                {leaveErrors.start_date && (
                                                    <p className="text-xs text-destructive font-medium">{leaveErrors.start_date}</p>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="start_date_ec" className="text-[11px] font-medium text-muted-foreground block">
                                                    Ethiopian Calendar (E.C.)
                                                </Label>
                                                <Input
                                                    id="start_date_ec"
                                                    required
                                                    value={leaveData.start_date_ec}
                                                    onChange={(e) => setLeaveData('start_date_ec', e.target.value)}
                                                    placeholder="DD/MM/YYYY E.C."
                                                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-xs font-mono shadow-2xs"
                                                />
                                                {leaveErrors.start_date_ec && (
                                                    <p className="text-xs text-destructive font-medium">{leaveErrors.start_date_ec}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Conclusion Date */}
                                        <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-2xs hover:border-border/80 transition-all">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-primary" />
                                                    <span>Conclusion Date</span>
                                                    <span className="text-destructive">*</span>
                                                </span>
                                                {leaveData.end_date_ec && (
                                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                                                        🇪🇹 {leaveData.end_date_ec}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="end_date" className="text-[11px] font-medium text-muted-foreground block">
                                                    Gregorian Calendar (G.C.)
                                                </Label>
                                                <BoardUIDatePicker
                                                    value={toCalendarDate(leaveData.end_date)}
                                                    onChange={(cDate) => handleEndDateChange(cDate ? cDate.toString() : '')}
                                                    aria-label="Conclusion Date (G.C.)"
                                                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-xs shadow-2xs justify-start"
                                                />
                                                {leaveErrors.end_date && (
                                                    <p className="text-xs text-destructive font-medium">{leaveErrors.end_date}</p>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="end_date_ec" className="text-[11px] font-medium text-muted-foreground block">
                                                    Ethiopian Calendar (E.C.)
                                                </Label>
                                                <Input
                                                    id="end_date_ec"
                                                    required
                                                    value={leaveData.end_date_ec}
                                                    onChange={(e) => setLeaveData('end_date_ec', e.target.value)}
                                                    placeholder="DD/MM/YYYY E.C."
                                                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-xs font-mono shadow-2xs"
                                                />
                                                {leaveErrors.end_date_ec && (
                                                    <p className="text-xs text-destructive font-medium">{leaveErrors.end_date_ec}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Duration & Emergency Contact */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="requested_days" className="text-xs font-semibold text-foreground flex items-center justify-between">
                                                <span className="flex items-center gap-1">
                                                    <span>Working Days Requested</span>
                                                    <span className="text-destructive">*</span>
                                                </span>
                                                {leaveData.leave_type === 'Annual' && (
                                                    <span className="text-[11px] font-medium text-muted-foreground">
                                                        Remaining after: <strong className={remainingAfterRequest > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 font-semibold'}>{remainingAfterRequest} days</strong>
                                                    </span>
                                                )}
                                            </Label>
                                            <BoardUINumberField
                                                id="requested_days"
                                                aria-label="Working Days Requested"
                                                value={Number(leaveData.requested_days) || 1}
                                                onChange={(val) => setLeaveData('requested_days', String(val))}
                                                minValue={0.5}
                                                maxValue={120}
                                                step={0.5}
                                                isRequired
                                                className="w-full"
                                                fieldClassName="h-11 rounded-xl border border-border bg-card text-foreground text-xs font-mono shadow-2xs hover:border-border/80"
                                            />
                                            {leaveErrors.requested_days && (
                                                <p className="text-xs text-destructive font-medium">{leaveErrors.requested_days}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="contact_phone" className="text-xs font-semibold text-foreground flex items-center gap-1">
                                                <span>Contact Phone During Absence</span>
                                                <span className="text-muted-foreground font-normal text-[11px]">(Emergency)</span>
                                            </Label>
                                            <div className="relative group">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono font-semibold pointer-events-none select-none flex items-center gap-1">
                                                    <RiPhoneLine className="w-3.5 h-3.5 text-muted-foreground/80" />
                                                    <span>+251</span>
                                                </span>
                                                <Input
                                                    id="contact_phone"
                                                    type="tel"
                                                    inputMode="numeric"
                                                    value={contactPhoneNational}
                                                    onChange={handlePhoneChange}
                                                    placeholder="9XXXXXXXX"
                                                    autoComplete="tel-national"
                                                    className="w-full h-11 pl-[76px] pr-3.5 rounded-xl border border-border bg-card text-foreground text-xs font-mono tracking-wider shadow-2xs hover:border-border/80 focus-visible:ring-primary"
                                                />
                                            </div>
                                            {leaveErrors.contact_phone && (
                                                <p className="text-xs text-destructive font-medium">{leaveErrors.contact_phone}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* 4. Reason & Operational Handover Notes */}
                                    <div className="space-y-1.5 pt-1">
                                        <Label htmlFor="reason" className="text-xs font-semibold text-foreground flex items-center justify-between">
                                            <span className="flex items-center gap-1">
                                                <span>Reason &amp; Handover Notes</span>
                                                <span className="text-destructive">*</span>
                                            </span>
                                            <span className="text-[11px] text-muted-foreground font-normal">
                                                {leaveData.reason.length} / 1000 characters
                                            </span>
                                        </Label>
                                        <BoardUITextarea
                                            id="reason"
                                            aria-label="Reason & Handover Notes"
                                            isRequired
                                            rows={3}
                                            autoResize
                                            maxRows={8}
                                            maxLength={1000}
                                            value={leaveData.reason}
                                            onChange={(val) => setLeaveData('reason', val)}
                                            placeholder="State the operational reason for leave, emergency contact details, and handover instructions for your designated relief colleague..."
                                            fieldClassName="p-3 rounded-xl border border-border bg-card text-foreground shadow-2xs hover:border-border/80"
                                            className="text-xs leading-relaxed"
                                        />
                                        {leaveErrors.reason && (
                                            <p className="text-xs text-destructive font-medium">{leaveErrors.reason}</p>
                                        )}
                                    </div>

                                    {/* 5. Supporting Document Attachment */}
                                    <div className="space-y-2 pt-1">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                                <RiFileTextLine className="w-3.5 h-3.5 text-primary" />
                                                <span>Supporting Document / Medical Note</span>
                                                <span className="text-[11px] font-normal text-muted-foreground">(Optional)</span>
                                            </Label>
                                            <span className="text-[11px] text-muted-foreground">PDF, PNG, JPG, WEBP (Max 5MB)</span>
                                        </div>

                                        {!leaveData.attachment ? (
                                            <label
                                                htmlFor="leave-attachment-input"
                                                className="group relative flex flex-col items-center justify-center py-6 px-4 rounded-xl border border-dashed border-border hover:border-primary/70 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer text-center"
                                            >
                                                <Input
                                                    id="leave-attachment-input"
                                                    type="file"
                                                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                                                    className="sr-only"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        if (file) setLeaveData('attachment', file);
                                                    }}
                                                />
                                                <div className="w-10 h-10 rounded-full bg-card border border-border/80 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-105 transition-all shadow-xs mb-2">
                                                    <RiUploadCloud2Line className="w-5 h-5" />
                                                </div>
                                                <p className="text-xs font-medium text-foreground">
                                                    <span className="text-primary font-semibold underline underline-offset-2">Click to select file</span> or drag and drop here
                                                </p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    Official medical release certificate, marriage license, or statutory notice
                                                </p>
                                            </label>
                                        ) : (
                                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card shadow-xs">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                                        <RiFileTextLine className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-foreground tracking-tight">{leaveData.attachment.name}</p>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                                            {(leaveData.attachment.size / (1024 * 1024)).toFixed(2)} MB • Ready for HR attachment
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setLeaveData('attachment', null)}
                                                    className="px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                        {leaveErrors.attachment && (
                                            <p className="text-xs text-destructive font-medium">{leaveErrors.attachment}</p>
                                        )}
                                    </div>

                                    {/* 6. Action Submit Bar */}
                                    <div className="pt-4 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <span>Application is logged directly in your official leave ledger for supervisor review</span>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white px-7 py-2.5 text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                        >
                                            <RiSendPlaneFill className="w-3.5 h-3.5" />
                                            <span>{processing ? 'Submitting Application...' : 'Submit Formal Leave Application'}</span>
                                        </button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="animate-in fade-in-50 duration-200 outline-hidden">
                        <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
                            <CardHeader className="py-4 px-6 border-b border-border/70">
                                <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-primary" />
                                    <span>Leave Request History &amp; Approval Ledger</span>
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                    Complete record of all submitted leave requests and official HR decisions.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-0">
                                {leaveRequests.length === 0 ? (
                                    <div className="p-12 text-center text-muted-foreground">
                                        <CalendarCheck className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                                        <p className="text-sm font-semibold text-foreground">No Leave Requests on File</p>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                            You haven&apos;t submitted any leave requests yet. Use the &ldquo;Request New Leave&rdquo; tab to submit a new application.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-muted/40">
                                                <TableRow className="border-border/60">
                                                    <TableHead className="text-xs font-semibold py-3 px-4">Leave Type</TableHead>
                                                    <TableHead className="text-xs font-semibold py-3 px-4">Duration &amp; Dates</TableHead>
                                                    <TableHead className="text-xs font-semibold py-3 px-4">Relief Officer</TableHead>
                                                    <TableHead className="text-xs font-semibold py-3 px-4">Reason</TableHead>
                                                    <TableHead className="text-xs font-semibold py-3 px-4">Status</TableHead>
                                                    <TableHead className="text-xs font-semibold py-3 px-4 text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="divide-y divide-border/60">
                                                {leaveRequests.map((req) => {
                                                    const isPending = req.status === 'Pending';
                                                    const isApproved = req.status === 'Approved';
                                                    const isRejected = req.status === 'Rejected';

                                                    return (
                                                        <TableRow key={req.id} className="hover:bg-muted/20 transition-colors">
                                                            <TableCell className="py-3 px-4">
                                                                <span className="font-semibold text-xs text-foreground block">
                                                                    {req.leave_type} Leave
                                                                </span>
                                                                <span className="text-[11px] text-muted-foreground">
                                                                    Submitted {new Date(req.created_at).toLocaleDateString()}
                                                                </span>
                                                            </TableCell>

                                                            <TableCell className="py-3 px-4">
                                                                <span className="font-mono font-bold text-xs text-foreground block">
                                                                    {req.requested_days} {req.requested_days === 1 ? 'Day' : 'Days'}
                                                                </span>
                                                                <span className="text-[11px] text-muted-foreground font-mono">
                                                                    {req.start_date_ec || req.start_date} &rarr; {req.end_date_ec || req.end_date}
                                                                </span>
                                                            </TableCell>

                                                            <TableCell className="py-3 px-4 text-xs text-muted-foreground">
                                                                {req.handover_employee ? (
                                                                    <div>
                                                                        <span className="font-medium text-foreground block">
                                                                            {req.handover_employee.full_name}
                                                                        </span>
                                                                        <span className="text-[11px] text-muted-foreground">
                                                                            {req.handover_employee.position}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground/60 italic">None</span>
                                                                )}
                                                            </TableCell>

                                                            <TableCell className="py-3 px-4 text-xs text-muted-foreground max-w-[220px]">
                                                                <p className="line-clamp-2" title={req.reason}>
                                                                    {req.reason}
                                                                </p>
                                                                {req.attachment_path && (
                                                                    <a
                                                                        href={`/storage/${req.attachment_path}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
                                                                    >
                                                                        <Paperclip className="w-3 h-3" />
                                                                        <span>Document Attached</span>
                                                                    </a>
                                                                )}
                                                            </TableCell>

                                                            <TableCell className="py-3 px-4">
                                                                {isApproved && (
                                                                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[11px] font-semibold gap-1">
                                                                        <CheckCircle2 className="w-3 h-3" /> Approved
                                                                    </Badge>
                                                                )}
                                                                {isPending && (
                                                                    <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-[11px] font-semibold gap-1">
                                                                        <Clock className="w-3 h-3" /> Under Review
                                                                    </Badge>
                                                                )}
                                                                {isRejected && (
                                                                    <Badge variant="destructive" className="text-[11px] font-semibold gap-1">
                                                                        <XCircle className="w-3 h-3" /> Rejected
                                                                    </Badge>
                                                                )}
                                                                {!isApproved && !isPending && !isRejected && (
                                                                    <Badge variant="outline" className="text-[11px] font-semibold">
                                                                        {req.status}
                                                                    </Badge>
                                                                )}
                                                                {req.reviewer_notes && (
                                                                    <span className="text-[10px] text-muted-foreground block mt-1 line-clamp-1" title={req.reviewer_notes}>
                                                                        HR: {req.reviewer_notes}
                                                                    </span>
                                                                )}
                                                            </TableCell>

                                                            <TableCell className="py-3 px-4 text-right">
                                                                {isPending && (
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            setRequestToCancel(req);
                                                                            setCancelDialogOpen(true);
                                                                        }}
                                                                        className="h-8 px-3 text-xs rounded-full border-border text-destructive hover:bg-destructive/10"
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Cancel Request Confirmation Dialog */}
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent className="border-border bg-card shadow-xs rounded-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-foreground">
                            Cancel Leave Request?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground">
                            Are you sure you want to withdraw this pending leave request for {requestToCancel?.requested_days} days? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-2">
                        <AlertDialogCancel className="text-xs h-9 px-4 border-border rounded-xl">
                            Keep Request
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelLeave}
                            className="text-xs h-9 px-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-xl"
                        >
                            Confirm Cancel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthenticatedLayout>
    );
}
