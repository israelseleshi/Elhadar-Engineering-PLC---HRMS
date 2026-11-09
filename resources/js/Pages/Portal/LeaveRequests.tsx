import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Label } from '@/Components/ui/label';
import {
    SegmentedControl,
    SegmentedControlItem,
} from '@/Components/boardui/components/base/segmented-control/segmented-control';
import { Button as BoardUIButton } from '@/Components/boardui/components/base/buttons/button';
import { Chip as BoardUIChip } from '@/Components/boardui/components/base/badges/chip';
import { StatusDot as BoardUIStatusDot } from '@/Components/boardui/components/base/badges/status-dot';
import { Textarea as BoardUITextarea } from '@/Components/boardui/components/base/textarea/textarea';
import { NumberField as BoardUINumberField } from '@/Components/boardui/components/base/number-field/number-field';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/Components/ui/dialog';
import {
    CheckCircle2,
    XCircle,
    Clock,
    CalendarCheck,
    Calendar,
    Users,
    Shield,
    Phone,
    FileText,
    Paperclip,
    AlertCircle,
    UserCheck,
    Building2,
    Check,
    X,
    ExternalLink,
    Eye,
    Copy,
    ChevronRight,
    Printer,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatEthPhone } from '@/lib/utils';

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    try {
        const cleanStr = String(dateStr).includes('T') ? String(dateStr).split('T')[0] : String(dateStr);
        const parts = cleanStr.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts.map(Number);
            if (year && month && day) {
                return new Date(year, month - 1, day).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                });
            }
        }
        return cleanStr;
    } catch {
        return String(dateStr).split('T')[0] || String(dateStr);
    }
}

function formatDateTime(dateTimeStr?: string | null): string {
    if (!dateTimeStr) return '—';
    try {
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) return dateTimeStr;
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return dateTimeStr;
    }
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
    is_deducted: boolean;
    days_deducted: number;
    contact_phone?: string | null;
    attachment_path?: string | null;
    reviewed_at?: string | null;
    reviewer_notes?: string | null;
    created_at: string;
    employee: {
        id: number;
        full_name: string;
        file_no: string;
        position: string;
        department?: {
            id: number;
            name: string;
        } | null;
        available_annual_days?: number;
        statutory_entitlement?: number;
    };
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
}

interface ManagerInfo {
    name: string;
    position: string;
    level: string;
    scope: 'company' | 'department' | 'none';
    department: string;
}

interface Props {
    managerInfo: ManagerInfo;
    pendingRequests: LeaveRequestItem[];
    recentReviews: LeaveRequestItem[];
    stats: {
        pending_count: number;
        approved_this_year: number;
        rejected_this_year: number;
    };
}

export default function LeaveRequests({ managerInfo, pendingRequests = [], recentReviews = [], stats }: Props) {
    const [selectedTab, setSelectedTab] = useState<'pending' | 'history'>('pending');

    // Approve Dialog State
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [requestToApprove, setRequestToApprove] = useState<LeaveRequestItem | null>(null);
    const [deductBalance, setDeductBalance] = useState(true);
    const [daysToDeduct, setDaysToDeduct] = useState<number>(0);
    const [approvalNotes, setApprovalNotes] = useState('');
    const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);

    // Reject Dialog State
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [requestToReject, setRequestToReject] = useState<LeaveRequestItem | null>(null);
    const [rejectionNotes, setRejectionNotes] = useState('');
    const [isSubmittingReject, setIsSubmittingReject] = useState(false);

    // Decision Record Detail Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedDetailRequest, setSelectedDetailRequest] = useState<LeaveRequestItem | null>(null);

    const openDetailModal = (req: LeaveRequestItem) => {
        setSelectedDetailRequest(req);
        setDetailModalOpen(true);
    };

    const handleCopySummary = () => {
        if (!selectedDetailRequest) return;
        const req = selectedDetailRequest;
        const lines = [
            '========================================',
            'LEAVE DECISION RECORD — EL-HADAR HRMS',
            '========================================',
            `Staff Member: ${req.employee.full_name} (${req.employee.file_no})`,
            `Position: ${req.employee.position}`,
            `Department: ${req.employee.department?.name || '—'}`,
            `Leave Type: ${req.leave_type} Leave`,
            `Absence Schedule: ${formatDate(req.start_date)} to ${formatDate(req.end_date)} (${req.requested_days} Working Days)`,
            req.start_date_ec ? `Ethiopian Calendar: ${req.start_date_ec} to ${req.end_date_ec || req.start_date_ec}` : null,
            `Status: ${req.status}`,
            req.status === 'Approved'
                ? `Balance Deduction: ${req.is_deducted ? `${req.days_deducted} days deducted from statutory balance` : 'Excused / Special (0 days deducted)'}`
                : null,
            req.reviewer ? `Reviewed By: ${req.reviewer.name}` : null,
            req.reviewed_at ? `Reviewed At: ${formatDateTime(req.reviewed_at)}` : null,
            req.reviewer_notes ? `Reviewer Notes: ${req.reviewer_notes}` : null,
            `Relief Handover: ${req.handover_employee ? `${req.handover_employee.full_name} (${req.handover_employee.position})` : 'None designated'}`,
            req.contact_phone ? `Emergency Phone: ${formatEthPhone(req.contact_phone) || req.contact_phone}` : null,
            `Reason / Handover: ${req.reason}`,
            '========================================',
        ].filter(Boolean).join('\n');

        navigator.clipboard.writeText(lines);
        toast.success('Decision record summary copied to clipboard');
    };

    const openApproveModal = (req: LeaveRequestItem) => {
        setRequestToApprove(req);
        setDeductBalance(req.leave_type === 'Annual');
        setDaysToDeduct(req.requested_days);
        setApprovalNotes('');
        setApproveModalOpen(true);
    };

    const handleConfirmApprove = () => {
        if (!requestToApprove) return;
        setIsSubmittingApprove(true);

        router.post(
            route('portal.leave-requests.review', requestToApprove.id),
            {
                decision: 'approve',
                deduct_balance: deductBalance,
                days_to_deduct: deductBalance ? daysToDeduct : 0,
                reviewer_notes: approvalNotes || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setApproveModalOpen(false);
                    setRequestToApprove(null);
                    toast.success(`Leave request for ${requestToApprove.employee.full_name} approved successfully.`);
                },
                onError: (errors) => {
                    toast.error(errors.decision || errors.reviewer_notes || 'Failed to approve leave request.');
                },
                onFinish: () => setIsSubmittingApprove(false),
            }
        );
    };

    const openRejectModal = (req: LeaveRequestItem) => {
        setRequestToReject(req);
        setRejectionNotes('');
        setRejectModalOpen(true);
    };

    const handleConfirmReject = () => {
        if (!requestToReject) return;
        if (!rejectionNotes.trim()) {
            toast.error('A rejection reason is required.');
            return;
        }

        setIsSubmittingReject(true);

        router.post(
            route('portal.leave-requests.review', requestToReject.id),
            {
                decision: 'reject',
                reviewer_notes: rejectionNotes.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRejectModalOpen(false);
                    setRequestToReject(null);
                    toast.info(`Leave request for ${requestToReject.employee.full_name} has been rejected.`);
                },
                onError: (errors) => {
                    toast.error(errors.reviewer_notes || errors.decision || 'Failed to reject leave request.');
                },
                onFinish: () => setIsSubmittingReject(false),
            }
        );
    };

    const getLeaveTypeBadge = (type: string) => {
        switch (type) {
            case 'Annual':
                return (
                    <BoardUIChip variant="subtle" color="blue" className="font-semibold text-xs">
                        Annual Rest (Art. 77)
                    </BoardUIChip>
                );
            case 'Sick':
                return (
                    <BoardUIChip variant="subtle" color="rose" className="font-semibold text-xs">
                        Sick Leave
                    </BoardUIChip>
                );
            case 'Maternity':
            case 'Paternity':
                return (
                    <BoardUIChip variant="subtle" color="purple" className="font-semibold text-xs">
                        {type} Leave
                    </BoardUIChip>
                );
            default:
                return (
                    <BoardUIChip variant="subtle" color="neutral" className="font-semibold text-xs">
                        {type} Leave
                    </BoardUIChip>
                );
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        <BoardUIStatusDot color="yellow" />
                        <span>Pending Decision</span>
                    </div>
                );
            case 'Approved':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <BoardUIStatusDot color="green" />
                        <span>Approved</span>
                    </div>
                );
            case 'Rejected':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span>Rejected</span>
                    </div>
                );
            case 'Cancelled':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
                        <span>Cancelled by Staff</span>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Leave Requests — Managerial Approval Inbox" />

            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                {/* Header & Authority Scope Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/30 p-6 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0066cc]/10 text-[#0066cc] dark:text-[#2997ff] border border-[#0066cc]/20">
                                    <Shield className="w-3 h-3" />
                                    <span>Managerial Authority: {managerInfo.level}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                    <Building2 className="w-3 h-3" />
                                    <span>{managerInfo.department}</span>
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                Leave Requests Inbox
                            </h1>
                            <p className="text-sm text-muted-foreground max-w-2xl">
                                Review, verify relief coverage, and render statutory leave approval decisions for personnel under your supervision under Ethiopian Labour Proclamation No. 1156/2019.
                            </p>
                        </div>

                        {/* Fast Stats */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
                            <div className="bg-card/90 rounded-xl p-3 border border-border text-center min-w-[90px]">
                                <div className="text-xl sm:text-2xl font-bold text-[#0066cc] dark:text-[#2997ff]">
                                    {stats.pending_count}
                                </div>
                                <div className="text-[11px] font-medium text-muted-foreground">Pending</div>
                            </div>
                            <div className="bg-card/90 rounded-xl p-3 border border-border text-center min-w-[90px]">
                                <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {stats.approved_this_year}
                                </div>
                                <div className="text-[11px] font-medium text-muted-foreground">Approved YTD</div>
                            </div>
                            <div className="bg-card/90 rounded-xl p-3 border border-border text-center min-w-[90px]">
                                <div className="text-xl sm:text-2xl font-bold text-muted-foreground">
                                    {stats.rejected_this_year}
                                </div>
                                <div className="text-[11px] font-medium text-muted-foreground">Rejected YTD</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Segmented Control Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <SegmentedControl
                        aria-label="Leave Approval Filter"
                        selectedKeys={[selectedTab]}
                        onSelectionChange={(keys) => {
                            const next = [...(keys as Set<string>)][0] as 'pending' | 'history' | undefined;
                            if (next) setSelectedTab(next);
                        }}
                        className="p-1 rounded-xl bg-muted/80 dark:bg-card border border-border/80 shadow-2xs"
                    >
                        <SegmentedControlItem
                            id="pending"
                            className="px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-lg cursor-pointer"
                        >
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>Pending Review</span>
                            {pendingRequests.length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#0066cc] text-white">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </SegmentedControlItem>
                        <SegmentedControlItem
                            id="history"
                            className="px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-lg cursor-pointer"
                        >
                            <CalendarCheck className="w-3.5 h-3.5 text-primary" />
                            <span>Decision History</span>
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary">
                                {recentReviews.length}
                            </span>
                        </SegmentedControlItem>
                    </SegmentedControl>

                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-primary" />
                        <span>
                            Reviewing as: <strong className="text-foreground">{managerInfo.name}</strong> ({managerInfo.position})
                        </span>
                    </div>
                </div>

                {/* Tab 1: Pending Leave Applications */}
                {selectedTab === 'pending' && (
                    <div className="space-y-4">
                        {pendingRequests.length === 0 ? (
                            <Card className="rounded-2xl border-dashed border-border/80">
                                <CardContent className="py-16 text-center space-y-3">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                                        <CheckCircle2 className="w-7 h-7" strokeWidth={2.2} />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground tracking-tight">
                                        All Clear! No Pending Requests
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                        There are currently no leave requests awaiting managerial review in your designated operational scope.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {pendingRequests.map((req) => (
                                    <Card
                                        key={req.id}
                                        className="rounded-2xl border border-border/70 hover:border-[#0066cc]/40 transition-all shadow-xs overflow-hidden"
                                    >
                                        <div className="p-5 sm:p-6 space-y-4">
                                            {/* Top Row: Applicant Profile & Badges */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
                                                        {req.employee.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-base font-bold text-foreground tracking-tight">
                                                                {req.employee.full_name}
                                                            </h3>
                                                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                                                {req.employee.file_no}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                                            <span>{req.employee.position}</span>
                                                            <span>•</span>
                                                            <span>{req.employee.department?.name || 'Department'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {getLeaveTypeBadge(req.leave_type)}
                                                    {getStatusBadge(req.status)}
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                                {/* Column 1: Dates & Duration */}
                                                <div className="bg-muted/30 dark:bg-muted/10 p-3.5 rounded-xl border border-border/50 space-y-2">
                                                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-primary" />
                                                        <span>Absence Schedule</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-muted-foreground">
                                                            Commencement:{' '}
                                                            <strong className="text-foreground">
                                                                {formatDate(req.start_date)}
                                                            </strong>{' '}
                                                            {req.start_date_ec && (
                                                                <span className="text-[11px] text-primary">
                                                                    ({req.start_date_ec})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-muted-foreground">
                                                            Conclusion:{' '}
                                                            <strong className="text-foreground">
                                                                {formatDate(req.end_date)}
                                                            </strong>{' '}
                                                            {req.end_date_ec && (
                                                                <span className="text-[11px] text-primary">
                                                                    ({req.end_date_ec})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="pt-1 flex items-center gap-1.5 text-sm font-bold text-[#0066cc] dark:text-[#2997ff]">
                                                            <span>Duration:</span>
                                                            <span>{req.requested_days} Working Days</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 2: Relief Coverage & Contact */}
                                                <div className="bg-muted/30 dark:bg-muted/10 p-3.5 rounded-xl border border-border/50 space-y-2">
                                                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                        <span>Relief Handover & Contact</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-muted-foreground">
                                                            Handover Officer:{' '}
                                                            <strong className="text-foreground">
                                                                {req.handover_employee
                                                                    ? `${req.handover_employee.full_name} (${req.handover_employee.file_no})`
                                                                    : 'None Designated'}
                                                            </strong>
                                                        </div>
                                                        {req.handover_employee && (
                                                            <div className="text-[11px] text-muted-foreground">
                                                                Role: {req.handover_employee.position}
                                                            </div>
                                                        )}
                                                        <div className="text-muted-foreground flex items-center gap-1 pt-0.5">
                                                            <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                                                            <span>
                                                                Emergency:{' '}
                                                                <strong className="text-foreground">
                                                                    {formatEthPhone(req.contact_phone) || req.contact_phone || '—'}
                                                                </strong>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 3: Statutory Entitlement / Balance */}
                                                <div className="bg-muted/30 dark:bg-muted/10 p-3.5 rounded-xl border border-border/50 space-y-2">
                                                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                                                        <Shield className="w-3.5 h-3.5 text-amber-500" />
                                                        <span>Annual Leave Balance</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-muted-foreground">
                                                            Remaining Balance:{' '}
                                                            <strong className="text-foreground">
                                                                {req.employee.available_annual_days ?? 16.0} Days
                                                            </strong>
                                                        </div>
                                                        <div className="text-muted-foreground">
                                                            Statutory Entitlement:{' '}
                                                            <span>
                                                                {req.employee.statutory_entitlement ?? 16} Days/Year
                                                            </span>
                                                        </div>
                                                        <div className="pt-1 text-[11px]">
                                                            {(req.employee.available_annual_days ?? 16) >= req.requested_days ? (
                                                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                                                    <Check className="w-3 h-3" /> Sufficient annual balance available
                                                                </span>
                                                            ) : (
                                                                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" /> Exceeds current balance by{' '}
                                                                    {round(req.requested_days - (req.employee.available_annual_days ?? 16), 1)} days
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reason & Handover Notes */}
                                            <div className="bg-card p-3 rounded-xl border border-border/70 space-y-1">
                                                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                    <FileText className="w-3 h-3" />
                                                    <span>Reason for Absence & Operational Handover Notes:</span>
                                                </div>
                                                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                                                    {req.reason}
                                                </p>
                                                {req.attachment_path && (
                                                    <div className="pt-2">
                                                        <a
                                                            href={`/storage/${req.attachment_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                                                        >
                                                            <Paperclip className="w-3.5 h-3.5" />
                                                            <span>View Attached Supporting Document</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                                <BoardUIButton
                                                    variant="secondary"
                                                    size="small"
                                                    onClick={() => openRejectModal(req)}
                                                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
                                                >
                                                    <X className="w-3.5 h-3.5 mr-1" />
                                                    <span>Reject Application</span>
                                                </BoardUIButton>

                                                <BoardUIButton
                                                    variant="primary"
                                                    size="small"
                                                    onClick={() => openApproveModal(req)}
                                                    className="bg-[#0066cc] hover:bg-[#0071e3] text-white shadow-xs"
                                                >
                                                    <Check className="w-3.5 h-3.5 mr-1" />
                                                    <span>Approve Leave</span>
                                                </BoardUIButton>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Decision History */}
                {selectedTab === 'history' && (
                    <div className="space-y-4">
                        {recentReviews.length === 0 ? (
                            <Card className="rounded-2xl border-dashed border-border/80">
                                <CardContent className="py-16 text-center space-y-2">
                                    <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                                        <CalendarCheck className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-base font-bold text-foreground">No Decision History</h3>
                                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                        Leave requests that have been approved or rejected in your scope will appear here.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {recentReviews.map((req) => (
                                    <div
                                        key={req.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => openDetailModal(req)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                openDetailModal(req);
                                            }
                                        }}
                                        className="group p-4 sm:p-4.5 rounded-2xl border border-border/70 bg-card hover:bg-muted/30 hover:border-[#0066cc]/40 dark:hover:border-[#2997ff]/40 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs select-none"
                                    >
                                        <div className="space-y-1.5 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <strong className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                                    {req.employee.full_name}
                                                </strong>
                                                <span className="font-mono text-[11px] text-muted-foreground">
                                                    ({req.employee.file_no})
                                                </span>
                                                {getLeaveTypeBadge(req.leave_type)}
                                                {getStatusBadge(req.status)}
                                            </div>
                                            <div className="text-muted-foreground flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-foreground">
                                                    {formatDate(req.start_date)} → {formatDate(req.end_date)}
                                                </span>
                                                <span className="font-semibold text-primary">
                                                    ({req.requested_days} {Number(req.requested_days) === 1 ? 'day' : 'days'})
                                                </span>
                                                {req.start_date_ec && (
                                                    <span className="text-[11px] text-muted-foreground font-mono">
                                                        ({req.start_date_ec} &rarr; {req.end_date_ec || req.start_date_ec})
                                                    </span>
                                                )}
                                                <span>•</span>
                                                <span>Dept: {req.employee.department?.name || '—'}</span>
                                                {req.reviewer && (
                                                    <>
                                                        <span>•</span>
                                                        <span>
                                                            Reviewed by: <strong className="text-foreground">{req.reviewer.name}</strong>
                                                        </span>
                                                    </>
                                                )}
                                                {req.reviewed_at && (
                                                    <span>on {formatDate(req.reviewed_at)}</span>
                                                )}
                                            </div>
                                            {req.reviewer_notes && (
                                                <div className="text-[11px] italic text-muted-foreground pt-0.5 line-clamp-1">
                                                    Remarks: "{req.reviewer_notes}"
                                                </div>
                                            )}
                                        </div>

                                        <div className="shrink-0 flex items-center gap-2.5 self-start md:self-center">
                                            {req.status === 'Approved' && req.is_deducted && (
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                                    {req.days_deducted} days deducted
                                                </span>
                                            )}
                                            {req.status === 'Approved' && !req.is_deducted && (
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                                                    Excused / Special
                                                </span>
                                            )}
                                            {req.status === 'Rejected' && (
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
                                                    Declined
                                                </span>
                                            )}

                                            <div className="flex items-center gap-1 text-[11px] font-semibold text-primary group-hover:text-primary transition-colors pl-1">
                                                <span>View Record</span>
                                                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal 1: Approve Leave Dialog */}
            <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
                <DialogContent className="max-w-md rounded-2xl p-6">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            <span>Approve Leave Application</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Render an official managerial approval for{' '}
                            <strong className="text-foreground">
                                {requestToApprove?.employee.full_name}
                            </strong>{' '}
                            under statutory regulations.
                        </DialogDescription>
                    </DialogHeader>

                    {requestToApprove && (
                        <div className="space-y-4 py-2 text-xs">
                            <div className="bg-muted/40 p-3 rounded-xl border border-border/60 space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Leave Classification:</span>
                                    <span className="font-semibold text-foreground">
                                        {requestToApprove.leave_type} Leave
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Schedule:</span>
                                    <span className="font-semibold text-foreground">
                                        {formatDate(requestToApprove.start_date)} → {formatDate(requestToApprove.end_date)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Requested:</span>
                                    <span className="font-bold text-[#0066cc]">
                                        {requestToApprove.requested_days} Working Days
                                    </span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-border/40">
                                    <span className="text-muted-foreground">Available Annual Balance:</span>
                                    <span className="font-semibold text-foreground">
                                        {requestToApprove.employee.available_annual_days ?? 16.0} Days
                                    </span>
                                </div>
                            </div>

                            {/* Deduct Balance Toggle */}
                            <div className="space-y-2">
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={deductBalance}
                                        onChange={(e) => setDeductBalance(e.target.checked)}
                                        className="mt-0.5 rounded border-border text-[#0066cc] focus:ring-[#0066cc]"
                                    />
                                    <div>
                                        <span className="font-semibold text-foreground text-xs block">
                                            Deduct from Annual Statutory Rest Balance (Art. 77)
                                        </span>
                                        <span className="text-[11px] text-muted-foreground block">
                                            Uncheck to mark as Excused / Special / Discretionary leave with zero balance deduction.
                                        </span>
                                    </div>
                                </label>
                            </div>

                            {/* Days to deduct input */}
                            {deductBalance && (
                                <div className="space-y-1.5 pl-6">
                                    <Label className="text-xs font-medium">Days to Deduct</Label>
                                    <BoardUINumberField
                                        value={daysToDeduct}
                                        onChange={(val) => setDaysToDeduct(val ?? requestToApprove.requested_days)}
                                        minValue={0.5}
                                        maxValue={60}
                                        step={0.5}
                                        className="w-full"
                                    />
                                </div>
                            )}

                            {/* Approval Remarks */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Approval Notes / Remarks (Optional)</Label>
                                <BoardUITextarea
                                    value={approvalNotes}
                                    onChange={(val) => setApprovalNotes(val)}
                                    placeholder="Add any instructions, handover acknowledgments, or remarks..."
                                    rows={2}
                                    className="text-xs"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <BoardUIButton
                            variant="secondary"
                            size="small"
                            onClick={() => setApproveModalOpen(false)}
                            disabled={isSubmittingApprove}
                        >
                            Cancel
                        </BoardUIButton>
                        <BoardUIButton
                            variant="primary"
                            size="small"
                            onClick={handleConfirmApprove}
                            disabled={isSubmittingApprove}
                            className="bg-[#0066cc] hover:bg-[#0071e3] text-white"
                        >
                            {isSubmittingApprove ? 'Approving...' : 'Confirm Approval'}
                        </BoardUIButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal 2: Reject Leave Dialog */}
            <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent className="max-w-md rounded-2xl p-6">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-destructive" />
                            <span>Reject Leave Application</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Specify the operational reason for rejecting the leave request from{' '}
                            <strong className="text-foreground">
                                {requestToReject?.employee.full_name}
                            </strong>
                            . This reason will be shared with the employee and recorded in the audit trail.
                        </DialogDescription>
                    </DialogHeader>

                    {requestToReject && (
                        <div className="space-y-4 py-2 text-xs">
                            <div className="bg-red-500/10 dark:bg-red-950/20 p-3 rounded-xl border border-red-500/20 text-red-900 dark:text-red-300">
                                <strong>Request:</strong> {requestToReject.leave_type} Leave ({requestToReject.requested_days} days from {formatDate(requestToReject.start_date)} to {formatDate(requestToReject.end_date)}).
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Operational Rejection Reason <span className="text-destructive">*</span>
                                </Label>
                                <BoardUITextarea
                                    value={rejectionNotes}
                                    onChange={(val) => setRejectionNotes(val)}
                                    placeholder="e.g. Critical project milestone overlapping dates; inadequate handover coverage; please reschedule..."
                                    rows={3}
                                    className="text-xs"
                                    isRequired
                                />
                                <span className="text-[10px] text-muted-foreground block text-right">
                                    {rejectionNotes.length} / 1000 characters
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <BoardUIButton
                            variant="secondary"
                            size="small"
                            onClick={() => setRejectModalOpen(false)}
                            disabled={isSubmittingReject}
                        >
                            Cancel
                        </BoardUIButton>
                        <BoardUIButton
                            variant="primary"
                            size="small"
                            onClick={handleConfirmReject}
                            disabled={isSubmittingReject || !rejectionNotes.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isSubmittingReject ? 'Rejecting...' : 'Confirm Rejection'}
                        </BoardUIButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal 3: Decision Record Detail Modal */}
            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-7 pr-10">
                    <DialogHeader className="space-y-1.5 pb-3 border-b border-border/60">
                        <div className="flex items-center gap-2 flex-wrap">
                            {selectedDetailRequest && getStatusBadge(selectedDetailRequest.status)}
                            {selectedDetailRequest && getLeaveTypeBadge(selectedDetailRequest.leave_type)}
                            {selectedDetailRequest?.reviewed_at && (
                                <span className="text-[11px] text-muted-foreground ml-auto">
                                    Reviewed {formatDateTime(selectedDetailRequest.reviewed_at)}
                                </span>
                            )}
                        </div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#0066cc] dark:text-[#2997ff]" />
                            <span>Leave Application &amp; Review Record</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Official statutory audit record for managerial decision rendered under Ethiopian Labour Proclamation No. 1156/2019.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDetailRequest && (
                        <div className="space-y-4 py-2 text-xs">
                            {/* 1. Applicant Profile Card */}
                            <div className="p-4 rounded-xl border border-border/70 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-base font-bold shadow-xs shrink-0">
                                        {selectedDetailRequest.employee.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-base font-bold text-foreground">
                                                {selectedDetailRequest.employee.full_name}
                                            </h4>
                                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                                {selectedDetailRequest.employee.file_no}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                            <span>{selectedDetailRequest.employee.position}</span>
                                            <span>•</span>
                                            <span>{selectedDetailRequest.employee.department?.name || 'Department'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right sm:border-l sm:border-border/60 sm:pl-4 space-y-0.5">
                                    <div className="text-[11px] text-muted-foreground">Available Annual Balance</div>
                                    <div className="text-base font-bold text-[#0066cc] dark:text-[#2997ff]">
                                        {selectedDetailRequest.employee.available_annual_days ?? 16.0} Days
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                        Entitlement: {selectedDetailRequest.employee.statutory_entitlement ?? 16} Days/Yr
                                    </div>
                                </div>
                            </div>

                            {/* 2. Schedule & Duration Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Gregorian & Ethiopian Schedule */}
                                <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-2">
                                    <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                                        <Calendar className="w-3.5 h-3.5 text-[#0066cc] dark:text-[#2997ff]" />
                                        <span>Absence Period</span>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Gregorian:</span>
                                            <span className="font-semibold text-foreground">
                                                {formatDate(selectedDetailRequest.start_date)} → {formatDate(selectedDetailRequest.end_date)}
                                            </span>
                                        </div>
                                        {(selectedDetailRequest.start_date_ec || selectedDetailRequest.end_date_ec) && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Ethiopian:</span>
                                                <span className="font-medium text-primary">
                                                    {selectedDetailRequest.start_date_ec || '—'} → {selectedDetailRequest.end_date_ec || '—'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-1 border-t border-border/40 font-bold">
                                            <span className="text-muted-foreground">Total Duration:</span>
                                            <span className="text-[#0066cc] dark:text-[#2997ff]">
                                                {selectedDetailRequest.requested_days} Working Days
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Relief Handover & Emergency Contact */}
                                <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-2">
                                    <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                                        <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span>Relief Handover &amp; Contact</span>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-muted-foreground shrink-0">Handover:</span>
                                            <span className="font-medium text-foreground text-right truncate">
                                                {selectedDetailRequest.handover_employee
                                                    ? `${selectedDetailRequest.handover_employee.full_name} (${selectedDetailRequest.handover_employee.position})`
                                                    : 'None Designated'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center gap-2 pt-1 border-t border-border/40">
                                            <span className="text-muted-foreground">Emergency Contact:</span>
                                            {selectedDetailRequest.contact_phone ? (
                                                <a
                                                    href={`tel:${selectedDetailRequest.contact_phone}`}
                                                    className="font-mono font-semibold text-[#0066cc] dark:text-[#2997ff] hover:underline flex items-center gap-1"
                                                >
                                                    <Phone className="w-3 h-3" />
                                                    <span>
                                                        {formatEthPhone(selectedDetailRequest.contact_phone) || selectedDetailRequest.contact_phone}
                                                    </span>
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Operational Reason & Handover Notes */}
                            <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1.5">
                                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Absence Reason &amp; Operational Handover Notes</span>
                                </div>
                                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/40">
                                    {selectedDetailRequest.reason}
                                </p>

                                {selectedDetailRequest.attachment_path && (
                                    <div className="pt-1.5">
                                        <a
                                            href={`/storage/${selectedDetailRequest.attachment_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
                                        >
                                            <Paperclip className="w-3.5 h-3.5" />
                                            <span>View / Download Supporting Attachment</span>
                                            <ExternalLink className="w-3 h-3 ml-1" />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* 4. Managerial Review Outcome Banner */}
                            <div
                                className={`p-4 rounded-xl border space-y-2 ${
                                    selectedDetailRequest.status === 'Approved'
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-100'
                                        : selectedDetailRequest.status === 'Rejected'
                                        ? 'bg-red-500/10 border-red-500/20 text-red-950 dark:text-red-100'
                                        : 'bg-muted/40 border-border text-foreground'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-bold text-sm">
                                        {selectedDetailRequest.status === 'Approved' && (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                <span>Decision: Approved</span>
                                            </>
                                        )}
                                        {selectedDetailRequest.status === 'Rejected' && (
                                            <>
                                                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                <span>Decision: Rejected</span>
                                            </>
                                        )}
                                        {selectedDetailRequest.status === 'Cancelled' && (
                                            <>
                                                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                                <span>Application Cancelled by Staff</span>
                                            </>
                                        )}
                                    </div>

                                    {selectedDetailRequest.reviewed_at && (
                                        <span className="text-[11px] opacity-80">
                                            {formatDateTime(selectedDetailRequest.reviewed_at)}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                    <div>
                                        <span className="opacity-70">Reviewing Manager: </span>
                                        <strong className="opacity-95">
                                            {selectedDetailRequest.reviewer?.name || 'Authorized Manager'}
                                        </strong>
                                    </div>
                                    {selectedDetailRequest.status === 'Approved' && (
                                        <div>
                                            <span className="opacity-70">Balance Treatment: </span>
                                            <strong className="opacity-95">
                                                {selectedDetailRequest.is_deducted
                                                    ? `${selectedDetailRequest.days_deducted} days deducted from annual rest`
                                                    : 'Excused / Special leave (No deduction)'}
                                            </strong>
                                        </div>
                                    )}
                                </div>

                                {selectedDetailRequest.reviewer_notes && (
                                    <div className="pt-2 border-t border-current/10">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider block opacity-70 mb-0.5">
                                            Manager Remarks / Operational Notes:
                                        </span>
                                        <p className="text-xs italic whitespace-pre-wrap opacity-90">
                                            "{selectedDetailRequest.reviewer_notes}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-border/60">
                        <div className="flex items-center gap-2">
                            <BoardUIButton
                                variant="secondary"
                                size="small"
                                onClick={handleCopySummary}
                                className="flex items-center gap-1.5 text-xs"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Summary</span>
                            </BoardUIButton>

                            <BoardUIButton
                                variant="secondary"
                                size="small"
                                onClick={() => window.print()}
                                className="flex items-center gap-1.5 text-xs"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print Record</span>
                            </BoardUIButton>
                        </div>

                        <BoardUIButton
                            variant="primary"
                            size="small"
                            onClick={() => setDetailModalOpen(false)}
                            className="bg-[#0066cc] hover:bg-[#0071e3] text-white"
                        >
                            Close Record
                        </BoardUIButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}

function round(val: number, precision: number) {
    const factor = Math.pow(10, precision);
    return Math.round(val * factor) / factor;
}
