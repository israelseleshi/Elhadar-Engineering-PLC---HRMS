import { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InteractiveTour, { TourStep } from '@/Components/InteractiveTour';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Checkbox } from '@/Components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/Components/ui/dialog';
import ViewToggle, { useViewMode } from '@/Components/ViewToggle';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/Components/ui/table';
import { 
    Search, 
    Eye, 
    MinusCircle, 
    Compass,
    CalendarCheck,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    History,
    Paperclip,
    ShieldCheck,
    Check,
    Calendar
} from 'lucide-react';

const leaveTourSteps: TourStep[] = [
    {
        target: '[data-tour="leave-search"]',
        title: 'Search and leave cycle',
        content: 'Search staff members and check the active annual leave cycle.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="leave-table"]',
        title: 'Leave balance ledger',
        content: 'Track statutory entitlement, days taken, and remaining leave balances.',
        placement: 'top',
    },
    {
        target: '[data-tour="balance-badge"]',
        title: 'Balance health',
        content: 'Color tags indicate healthy, low, or exhausted leave balances at a glance.',
        placement: 'left',
    },
    {
        target: '[data-tour="first-deduct-btn"]',
        title: 'Deduct leave',
        content: 'Record approved leave days taken and adjust remaining balances instantly.',
        placement: 'left',
    },
];

interface StaffLeave {
    id: number;
    file_no: string;
    full_name: string;
    position: string;
    employment_date_ec: string;
    department?: { name: string };
    statutory_entitlement: number;
    display_taken: number;
    display_remaining: number;
}

interface LeaveRequest {
    id: number;
    employee_id: number;
    user_id: number;
    leave_type: string;
    start_date: string;
    start_date_ec: string;
    end_date: string;
    end_date_ec: string;
    requested_days: number;
    reason: string;
    handover_employee_id?: number | null;
    contact_phone?: string | null;
    attachment_path?: string | null;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
    is_deducted: boolean;
    days_deducted: number;
    reviewed_by?: number | null;
    reviewed_at?: string | null;
    reviewer_notes?: string | null;
    created_at: string;
    employee?: {
        id: number;
        full_name: string;
        file_no: string;
        position?: string;
        department?: { name: string };
        current_leave_balance?: { remaining_days: number };
    };
    handover_employee?: {
        id: number;
        full_name: string;
        file_no: string;
        position?: string;
    } | null;
    reviewer?: {
        id: number;
        name: string;
    } | null;
}

interface Props {
    employees: {
        data: StaffLeave[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search?: string;
    };
    stats: {
        total_leave_liability_days: number;
        average_entitlement: number;
        staff_tracked_count: number;
    };
    currentYear: number;
    pendingRequests?: LeaveRequest[];
    recentRequests?: LeaveRequest[];
    pendingCount?: number;
}

export default function Index({
    employees,
    filters,
    stats,
    currentYear,
    pendingRequests = [],
    recentRequests = [],
    pendingCount = 0,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStaff, setSelectedStaff] = useState<StaffLeave | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [viewMode, setViewMode] = useViewMode('leave');
    const [isTourOpen, setIsTourOpen] = useState(false);

    useEffect(() => {
        const handleOpenTour = () => setIsTourOpen(true);
        window.addEventListener('open-leave-ledger-tour', handleOpenTour);

        if (typeof window !== 'undefined') {
            if (window.location.search.includes('tour=true')) {
                setIsTourOpen(true);
            }
        }

        return () => window.removeEventListener('open-leave-ledger-tour', handleOpenTour);
    }, []);

    const { data, setData, post, processing, reset, errors } = useForm({
        days_deducted: '1',
        reason: 'Annual Leave Deduction',
    });

    const {
        data: reviewData,
        setData: setReviewData,
        post: postReview,
        processing: reviewProcessing,
        reset: resetReview,
        errors: reviewErrors,
    } = useForm<{
        decision: 'approve' | 'reject';
        deduct_balance: boolean;
        days_to_deduct: string;
        reviewer_notes: string;
    }>({
        decision: 'approve',
        deduct_balance: true,
        days_to_deduct: '1',
        reviewer_notes: '',
    });

    const openReviewModal = (req: LeaveRequest) => {
        setSelectedRequest(req);
        setReviewData({
            decision: 'approve',
            deduct_balance: true,
            days_to_deduct: String(req.requested_days),
            reviewer_notes: '',
        });
    };

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;

        postReview(route('leave.requests.review', selectedRequest.id), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedRequest(null);
                resetReview();
                toast.success('Leave review decision submitted successfully.');
            },
        });
    };

    const handleFilter = (updates: Record<string, string>) => {
        router.get(
            route('leave.index'),
            {
                search,
                ...updates,
            },
            { preserveState: true, replace: true }
        );
    };

    const openAdjustModal = (staff: StaffLeave) => {
        setSelectedStaff(staff);
        setData({
            days_deducted: '1',
            reason: 'Annual Rest Leave',
        });
    };

    const handleDeductSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStaff) return;

        post(route('leave.adjust', selectedStaff.id), {
            onSuccess: () => {
                setSelectedStaff(null);
                reset();
            },
        });
    };

    const getBalanceClass = (remaining: number) => {
        if (remaining <= 3) {
            return 'bg-destructive/10 text-destructive border border-destructive/25';
        }
        if (remaining <= 8) {
            return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25';
        }

        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    };

    return (
        <AuthenticatedLayout
            title="Leave Ledger"
            subtitle="Automated leave administration under Ethiopian Labour Proclamation 1156/2019 (Art. 77: 16 days + 1 day per 2 years of service)."
        >
            <Head title="Leave Ledger - Elhadar Engineering HRMS" />

            {/* Primary Ledger Navigation Tabs */}
            <Tabs defaultValue={pendingCount > 0 ? 'queue' : 'balances'} className="w-full">
                <TabsList className="w-full sm:w-auto grid grid-cols-3 p-1.5 bg-muted/60 dark:bg-muted/30 border border-border/80 rounded-xl mb-6 gap-1.5 h-auto">
                    <TabsTrigger
                        value="balances"
                        className="text-xs sm:text-sm font-medium py-2.5 px-4 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs transition-all"
                    >
                        <span>Staff Balances</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="queue"
                        className="text-xs sm:text-sm font-medium py-2.5 px-4 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                        <span>Pending Requests</span>
                        {pendingCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-destructive text-destructive-foreground font-bold animate-pulse">
                                {pendingCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="text-xs sm:text-sm font-medium py-2.5 px-4 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                        <History className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Decisions History</span>
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: STAFF LEAVE BALANCES LEDGER */}
                <TabsContent value="balances" className="space-y-6 focus-visible:outline-none">
                    {/* Filter and Search Bar */}
                    <Card data-tour="leave-search" className="border-border bg-card">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, file no..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleFilter({ search });
                                }}
                                className="pl-9 bg-muted/50 border-border text-xs h-10"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-xs text-muted-foreground">
                                Active Statutory Leave Cycle: <strong className="text-foreground">{currentYear}</strong> G.C.
                            </div>
                            <Button
                                type="button"
                                onClick={() => setIsTourOpen(true)}
                                variant="outline"
                                size="sm"
                                className="border-border bg-card text-foreground hover:bg-muted font-medium text-xs gap-1.5 rounded-md"
                            >
                                <Compass className="w-3.5 h-3.5 text-primary" />
                                <span>Tour Leave Ledger</span>
                            </Button>
                            <ViewToggle value={viewMode} onChange={setViewMode} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Leave Ledger Table */}
            <Card data-tour="leave-table" className="border-border bg-card shadow-xs overflow-hidden shadow-sm">
                {viewMode === 'table' ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24">File no</TableHead>
                            <TableHead>Staff name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Employment date (E.C)</TableHead>
                            <TableHead className="text-center" data-tour="col-entitlement">Statutory entitlement</TableHead>
                            <TableHead className="text-center">Days taken</TableHead>
                            <TableHead className="text-center">Remaining balance</TableHead>
                            <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                    No personnel records found matching your query.
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.data.map((emp, index) => (
                                <TableRow key={emp.id} className="hover:bg-muted/40/50">
                                    <TableCell className="font-bold text-primary text-xs">
                                        {emp.file_no}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-foreground text-sm">{emp.full_name}</div>
                                        <div className="text-xs text-muted-foreground">{emp.position}</div>
                                    </TableCell>
                                    <TableCell className="text-xs text-foreground/90">
                                        {emp.department?.name || 'General Operations'}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {emp.employment_date_ec}
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-foreground text-xs">
                                        {emp.statutory_entitlement} Days
                                    </TableCell>
                                    <TableCell className="text-center text-xs text-muted-foreground">
                                        {emp.display_taken} Days
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span 
                                            data-tour={index === 0 ? "balance-badge" : undefined}
                                            className={`inline-flex items-center px-2 py-0.5 rounded-xs text-xs font-bold ${
                                                emp.display_remaining <= 3 ? 'bg-destructive/10 text-destructive border border-destructive/25' :
                                                emp.display_remaining <= 8 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25' :
                                                'bg-muted/40 text-primary'
                                            }`}
                                        >
                                            {emp.display_remaining} Days
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                            <Button
                                                data-tour={index === 0 ? "first-deduct-btn" : undefined}
                                                onClick={() => openAdjustModal(emp)}
                                                size="sm"
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs font-bold text-xs h-8 px-2.5 rounded-xs"
                                            >
                                                <MinusCircle className="w-3.5 h-3.5 mr-1" />
                                                Deduct Leave
                                            </Button>
                                            <Link href={route('employees.show', emp.id)}>
                                                <Button 
                                                    data-tour={index === 0 ? "first-profile-btn" : undefined}
                                                    variant="outline" 
                                                    size="sm"
                                                    className="border-border bg-card hover:bg-muted text-primary font-semibold text-xs h-8 px-2.5 rounded-xs"
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                                    Profile
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                ) : (
                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                        {employees.data.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
                                No personnel records found matching your query.
                            </div>
                        ) : (
                            employees.data.map((emp, index) => (
                                <div
                                    key={emp.id}
                                    className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:shadow-xs"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-foreground">{emp.full_name}</p>
                                            <p className="text-[11px] font-semibold text-primary">{emp.file_no}</p>
                                            <p className="truncate text-[11px] text-muted-foreground">
                                                {emp.position} Â· {emp.department?.name || 'General Operations'}
                                            </p>
                                        </div>
                                        <span
                                            data-tour={index === 0 ? 'balance-badge' : undefined}
                                            className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${getBalanceClass(emp.display_remaining)}`}
                                        >
                                            {emp.display_remaining} Days
                                        </span>
                                    </div>

                                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Entitled</p>
                                            <p className="text-sm font-bold text-foreground">{emp.statutory_entitlement}</p>
                                        </div>
                                        <div className="border-x border-border/60">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Taken</p>
                                            <p className="text-sm font-bold text-foreground/90">{emp.display_taken}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Remaining</p>
                                            <p className="text-sm font-bold text-foreground">{emp.display_remaining}</p>
                                        </div>
                                    </div>

                                    <p className="mt-2 text-[11px] text-muted-foreground">
                                        Employed: {emp.employment_date_ec} E.C.
                                    </p>

                                    <div className="mt-3 flex gap-2">
                                        <Button
                                            data-tour={index === 0 ? 'first-deduct-btn' : undefined}
                                            onClick={() => openAdjustModal(emp)}
                                            size="sm"
                                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs font-bold text-xs h-8 gap-1.5 rounded-xs"
                                        >
                                            <MinusCircle className="w-3.5 h-3.5" />
                                            Deduct Leave
                                        </Button>
                                        <Link href={route('employees.show', emp.id)}>
                                            <Button
                                                data-tour={index === 0 ? 'first-profile-btn' : undefined}
                                                variant="outline"
                                                size="sm"
                                                className="border-border bg-card hover:bg-muted text-primary font-semibold text-xs h-8 gap-1.5 rounded-xs"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Profile
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Pagination */}
                {employees.last_page > 1 && (
                    <div data-tour="leave-pagination" className="p-4 border-t border-border/60 bg-muted/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
                        <div>
                            Showing <strong>{employees.from || 0}</strong> to <strong>{employees.to || 0}</strong> of <strong>{employees.total}</strong> records
                        </div>
                        <div className="flex gap-1">
                            {employees.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveState
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                                            : link.url
                                            ? 'bg-card text-foreground border-border hover:bg-muted'
                                            : 'bg-muted/40 text-muted-foreground/40 border-border/40 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </Card>
        </TabsContent>

        {/* TAB 2: PENDING LEAVE REQUESTS QUEUE */}
        <TabsContent value="queue" className="space-y-6 focus-visible:outline-none">
            <Card className="border-border bg-card shadow-xs overflow-hidden">
                <CardHeader className="py-4 px-6 border-b border-border/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                            <CalendarCheck className="w-5 h-5 text-primary" />
                            <span>Pending Leave Requests Queue</span>
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            Review staff leave applications, evaluate remaining balance, and approve with deduction or as excused leave
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono self-start sm:self-auto">
                        {pendingRequests.length} Waiting Review
                    </Badge>
                </CardHeader>

                <CardContent className="p-0">
                    {pendingRequests.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-3">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-semibold text-foreground">All Caught Up!</h4>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                There are no pending employee leave requests waiting for administrative review.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead>Staff Member</TableHead>
                                        <TableHead>Leave Type</TableHead>
                                        <TableHead>Duration &amp; Dates</TableHead>
                                        <TableHead>Handover &amp; Contact</TableHead>
                                        <TableHead className="text-center">Current Balance</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border/60">
                                    {pendingRequests.map((req) => (
                                        <TableRow key={req.id} className="hover:bg-muted/30">
                                            <TableCell>
                                                <div className="font-bold text-foreground text-sm">
                                                    {req.employee?.full_name || 'Staff Member'}
                                                </div>
                                                <div className="text-xs font-semibold text-primary">
                                                    {req.employee?.file_no}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    {req.employee?.department?.name || 'Operations'} · {req.employee?.position}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs font-semibold bg-primary/5 text-primary border-primary/20">
                                                    {req.leave_type} Leave
                                                </Badge>
                                                {req.attachment_path && (
                                                    <div className="mt-1">
                                                        <a
                                                            href={`/storage/${req.attachment_path}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                                                        >
                                                            <Paperclip className="w-3 h-3" />
                                                            <span>Attachment</span>
                                                        </a>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-mono font-bold text-foreground text-xs">
                                                    {req.requested_days} Working Day{req.requested_days > 1 ? 's' : ''}
                                                </div>
                                                <div className="text-xs font-mono text-muted-foreground">
                                                    {req.start_date_ec} – {req.end_date_ec}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    ({req.start_date} to {req.end_date})
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs font-medium text-foreground">
                                                    {req.handover_employee?.full_name || 'None'}
                                                </div>
                                                <div className="text-[11px] font-mono text-muted-foreground">
                                                    {req.contact_phone || '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold font-mono bg-muted text-primary">
                                                    {req.employee?.current_leave_balance?.remaining_days ?? 16} Days
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <p className="text-xs text-foreground/90 line-clamp-2" title={req.reason}>
                                                    {req.reason}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    Applied: {new Date(req.created_at).toLocaleDateString()}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() => openReviewModal(req)}
                                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-3 rounded-lg shadow-xs"
                                                >
                                                    Review &amp; Decide
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        {/* TAB 3: DECISIONS AUDIT HISTORY */}
        <TabsContent value="history" className="space-y-6 focus-visible:outline-none">
            <Card className="border-border bg-card shadow-xs overflow-hidden">
                <CardHeader className="py-4 px-6 border-b border-border/70">
                    <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        <span>Recent Leave Decisions History</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Audit trail of approved, rejected, and cancelled leave applications
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    {recentRequests.length === 0 ? (
                        <div className="py-16 text-center text-xs text-muted-foreground">
                            No historic leave decisions recorded yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead>Staff Member</TableHead>
                                        <TableHead>Type &amp; Period</TableHead>
                                        <TableHead>Balance Impact</TableHead>
                                        <TableHead>Decision</TableHead>
                                        <TableHead>Reviewed By</TableHead>
                                        <TableHead>Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border/60">
                                    {recentRequests.map((req) => (
                                                <TableRow key={req.id} className="hover:bg-muted/30">
                                                    <TableCell>
                                                        <div className="font-bold text-foreground text-sm">
                                                            {req.employee?.full_name || 'Staff Member'}
                                                        </div>
                                                        <div className="text-xs font-semibold text-primary">
                                                            {req.employee?.file_no}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs font-semibold text-foreground">
                                                            {req.leave_type} ({req.requested_days} Days)
                                                        </div>
                                                        <div className="text-[11px] font-mono text-muted-foreground">
                                                            {req.start_date_ec} to {req.end_date_ec}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {req.status === 'Approved' ? (
                                                            req.is_deducted ? (
                                                                <Badge variant="outline" className="text-xs font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                                                                    -{req.days_deducted} days
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                                                                    Excused (0 Deduction)
                                                                </Badge>
                                                            )
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                req.status === 'Approved'
                                                                    ? 'secondary'
                                                                    : req.status === 'Rejected'
                                                                    ? 'destructive'
                                                                    : 'outline'
                                                            }
                                                            className={`text-xs px-2.5 py-0.5 font-semibold ${
                                                                req.status === 'Approved'
                                                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                                                    : req.status === 'Rejected'
                                                                    ? 'bg-destructive/10 text-destructive border-destructive/25'
                                                                    : ''
                                                            }`}
                                                        >
                                                            {req.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs font-medium text-foreground">
                                                            {req.reviewer?.name || 'HR Administrator'}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-mono">
                                                            {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : '—'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="max-w-xs">
                                                        <p className="text-xs text-muted-foreground truncate" title={req.reviewer_notes || req.reason}>
                                                            {req.reviewer_notes || req.reason || '—'}
                                                        </p>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>

    {/* HR Review Decision Modal (Shadcn UI Dialog) */}
    <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-lg bg-card border-border text-card-foreground p-6 max-h-[90vh] overflow-y-auto rounded-2xl shadow-lg">
            <DialogHeader>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span>Review Employee Leave Application</span>
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Determine statutory eligibility, choose deduction treatment, or record rejection reason.
                </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
                <form onSubmit={handleReviewSubmit} className="space-y-4 pt-3">
                    {/* Staff Dossier Summary Banner */}
                    <div className="p-3.5 bg-muted/40 border border-border/80 rounded-xl space-y-2">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-bold text-foreground text-sm">{selectedRequest.employee?.full_name}</p>
                                <p className="text-xs font-semibold text-primary">{selectedRequest.employee?.file_no} · {selectedRequest.employee?.position}</p>
                                <p className="text-[11px] text-muted-foreground">{selectedRequest.employee?.department?.name || 'General Operations'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Current Balance</p>
                                <p className="text-sm font-extrabold text-primary font-mono">
                                    {selectedRequest.employee?.current_leave_balance?.remaining_days ?? 16} Working Days
                                </p>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-muted-foreground">Type: </span>
                                <strong className="text-foreground">{selectedRequest.leave_type} Leave</strong>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Duration: </span>
                                <strong className="text-foreground">{selectedRequest.requested_days} Days</strong>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Dates (E.C.): </span>
                                <span className="font-mono text-foreground font-medium">{selectedRequest.start_date_ec} – {selectedRequest.end_date_ec}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Dates (G.C.): </span>
                                <span className="font-mono text-muted-foreground">{selectedRequest.start_date} to {selectedRequest.end_date}</span>
                            </div>
                            {selectedRequest.handover_employee && (
                                <div className="col-span-2">
                                    <span className="text-muted-foreground">Handover: </span>
                                    <span className="text-foreground font-medium">{selectedRequest.handover_employee.full_name} ({selectedRequest.handover_employee.position})</span>
                                </div>
                            )}
                            {selectedRequest.contact_phone && (
                                <div className="col-span-2">
                                    <span className="text-muted-foreground">Contact Phone: </span>
                                    <span className="text-foreground font-mono">{selectedRequest.contact_phone}</span>
                                </div>
                            )}
                            <div className="col-span-2 pt-1">
                                <span className="text-muted-foreground">Reason: </span>
                                <span className="text-foreground">{selectedRequest.reason}</span>
                            </div>
                            {selectedRequest.attachment_path && (
                                <div className="col-span-2 pt-1">
                                    <a
                                        href={`/storage/${selectedRequest.attachment_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                                    >
                                        <Paperclip className="w-3.5 h-3.5" />
                                        <span>View Attached Supporting Document</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Decision Choice */}
                    <div>
                        <label className="block text-xs font-bold text-foreground mb-2">
                            Administrative Decision <span className="text-destructive">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setReviewData('decision', 'approve')}
                                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                                    reviewData.decision === 'approve'
                                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-xs'
                                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Approve Request</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setReviewData('decision', 'reject')}
                                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                                    reviewData.decision === 'reject'
                                        ? 'bg-destructive/15 border-destructive/40 text-destructive shadow-xs'
                                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                <XCircle className="w-4 h-4 text-destructive" />
                                <span>Reject Request</span>
                            </button>
                        </div>
                    </div>

                    {/* When Approved: Deduction Option */}
                    {reviewData.decision === 'approve' && (
                        <div className="space-y-3 p-3.5 rounded-xl border border-border/80 bg-muted/20">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="deduct_balance"
                                    checked={reviewData.deduct_balance}
                                    onCheckedChange={(checked) => setReviewData('deduct_balance', Boolean(checked))}
                                />
                                <label
                                    htmlFor="deduct_balance"
                                    className="text-xs font-bold text-foreground cursor-pointer select-none"
                                >
                                    Deduct from Annual Leave Balance
                                </label>
                            </div>

                            {reviewData.deduct_balance ? (
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">
                                        Days to Deduct from Annual Balance
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.5"
                                        min="0.5"
                                        max="60"
                                        value={reviewData.days_to_deduct}
                                        onChange={(e) => setReviewData('days_to_deduct', e.target.value)}
                                        className="bg-background border-border text-foreground text-xs h-9 rounded-xl font-mono"
                                    />
                                </div>
                            ) : (
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                                    <strong className="block font-semibold mb-0.5">Approved as Excused / Special Leave</strong>
                                    Zero days will be deducted from the employee&apos;s annual leave balance (Compassionate, statutory special leave, or extreme circumstance).
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">
                                    Reviewer Notes (Optional)
                                </label>
                                <Input
                                    value={reviewData.reviewer_notes}
                                    onChange={(e) => setReviewData('reviewer_notes', e.target.value)}
                                    placeholder="e.g. Approved per medical note / Art. 81"
                                    className="bg-background border-border text-foreground text-xs h-9 rounded-xl"
                                />
                            </div>
                        </div>
                    )}

                    {/* When Rejected: Mandatory Reason */}
                    {reviewData.decision === 'reject' && (
                        <div className="space-y-2 p-3.5 rounded-xl border border-destructive/20 bg-destructive/5">
                            <label className="block text-xs font-bold text-destructive">
                                Rejection Reason <span className="text-destructive">*</span>
                            </label>
                            <Textarea
                                required
                                rows={3}
                                value={reviewData.reviewer_notes}
                                onChange={(e) => setReviewData('reviewer_notes', e.target.value)}
                                placeholder="Explain to the employee why this leave request cannot be approved at this time..."
                                className="w-full rounded-xl border border-destructive/30 bg-background text-foreground p-3 text-xs leading-relaxed focus-visible:ring-1 focus-visible:ring-destructive"
                            />
                            {reviewErrors.reviewer_notes && (
                                <p className="text-xs text-destructive font-medium">{reviewErrors.reviewer_notes}</p>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex justify-end gap-2 pt-3 border-t border-border/70">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSelectedRequest(null)}
                            className="text-xs border-border rounded-xl h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={reviewProcessing}
                            className={`text-xs font-semibold rounded-xl h-9 shadow-xs text-white ${
                                reviewData.decision === 'approve'
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-destructive hover:bg-destructive/90'
                            }`}
                        >
                            {reviewProcessing ? 'Saving Decision...' : reviewData.decision === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                        </Button>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
    </Dialog>

            {/* Deduct Leave Modal (Shadcn Dialog) */}
            <Dialog open={Boolean(selectedStaff)} onOpenChange={(open) => !open && setSelectedStaff(null)}>
                <DialogContent className="max-w-md bg-card border-border text-card-foreground p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                            <MinusCircle className="w-4 h-4 text-primary" />
                            Record Taken Annual Leave
                        </DialogTitle>
                        <DialogDescription className="text-xs text-primary font-semibold">
                            {selectedStaff?.full_name} ({selectedStaff?.file_no})
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleDeductSubmit} className="space-y-4 pt-2">
                        <div className="p-3 bg-muted/40 border border-border rounded-xs text-xs flex justify-between">
                            <span className="text-muted-foreground">Current Remaining Balance:</span>
                            <span className="font-bold text-primary">{selectedStaff?.display_remaining} Working Days</span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-foreground mb-1">
                                Number of Days Deducted <span className="text-[#de2828]">*</span>
                            </label>
                            <Input
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="60"
                                required
                                value={data.days_deducted}
                                onChange={(e) => setData('days_deducted', e.target.value)}
                                className="bg-background border-input text-foreground text-xs h-10"
                            />
                            {errors.days_deducted && (
                                <p className="text-xs text-[#de2828] mt-1">{errors.days_deducted}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-foreground mb-1">
                                Leave Reason / Description
                            </label>
                            <Input
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                                placeholder="e.g. Annual Vacation, Family Affairs"
                                className="bg-background border-input text-foreground text-xs h-10"
                            />
                        </div>

                        <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-border/60">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSelectedStaff(null)}
                                className="text-xs border-border rounded-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs text-xs font-bold uppercase rounded-xs"
                            >
                                {processing ? 'Recording...' : 'Deduct Days'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Interactive Element-Spotlight Joyride Tour */}
            <InteractiveTour
                steps={leaveTourSteps}
                isOpen={isTourOpen}
                onClose={() => setIsTourOpen(false)}
                tourTitle="Leave ledger tour"
            />
        </AuthenticatedLayout>
    );
}


