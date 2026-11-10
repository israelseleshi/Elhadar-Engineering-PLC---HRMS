import { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InteractiveTour, { TourStep } from '@/Components/InteractiveTour';
import { toast } from 'sonner';
import { useViewMode } from '@/Components/ViewToggle';
import {
    Avatar,
    Button,
    IconButton,
    Chip,
    StatusDot,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    NumberField,
    Input,
    Textarea,
    Checkbox,
    SearchField,
    PillTabList,
    PillTab,
    SegmentedControl,
    SegmentedControlItem,
    Pagination,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    cx,
} from '@/Components/boardui';
import {
    RiCompass3Line,
    RiTimeLine,
    RiHistoryLine,
    RiUserLine,
    RiSubtractLine,
    RiShieldCheckLine,
    RiCheckboxCircleLine,
    RiCloseCircleLine,
    RiAttachment2,
    RiTableLine,
    RiLayoutGridLine,
    RiCalendarLine,
    RiInformationLine,
    RiPhoneLine,
    RiArrowRightLine,
} from '@remixicon/react';

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

function getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

function BalanceHealthBadge({ remaining, entitled }: { remaining: number; entitled: number }) {
    const isExhausted = remaining <= 3;
    const isLow = remaining > 3 && remaining <= 8;

    const color = isExhausted ? 'rose' : isLow ? 'yellow' : 'lime';
    const dotColor = isExhausted ? 'yellow' : isLow ? 'yellow' : 'green';
    const total = Math.max(entitled, remaining, 16);
    const pct = Math.min(100, Math.max(0, Math.round((remaining / total) * 100)));

    return (
        <div className="flex flex-col items-center justify-center gap-1.5 min-w-[90px]">
            <Chip color={color} variant="bold" className="gap-1.5 px-2 py-0.5 text-caption-1-semibold">
                <StatusDot color={dotColor} />
                <span>{remaining} Days</span>
            </Chip>
            <div className="w-16 h-1 rounded-full bg-background-tertiary-default overflow-hidden">
                <div
                    className={cx(
                        'h-full rounded-full transition-all duration-300',
                        isExhausted ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export default function Index({
    employees,
    filters,
    currentYear,
    pendingRequests = [],
    recentRequests = [],
    pendingCount = 0,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [activeTab, setActiveTab] = useState<'balances' | 'queue' | 'history'>(
        pendingCount > 0 ? 'queue' : 'balances'
    );
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
                toast.success('Leave deducted successfully.');
            },
        });
    };

    return (
        <AuthenticatedLayout
            title="Leave Ledger"
            subtitle="Statutory annual leave tracking under Ethiopian Labour Proclamation 1156/2019 (Art. 77: 16 base days + 1 day per 2 years of service)."
        >
            <Head title="Leave Ledger - Elhadar Engineering HRMS" />

            {/* Top Navigation Pill Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-2 border-b border-separator-border">
                <PillTabList className="p-1 rounded-full bg-background-secondary-default border border-border-button-default">
                    <PillTab
                        variant="blue"
                        isSelected={activeTab === 'balances'}
                        onSelect={() => setActiveTab('balances')}
                        icon={RiUserLine}
                    >
                        <span>Staff Balances</span>
                        <span className="ms-1.5 px-2 py-0.5 rounded-full text-caption-1-medium bg-background-tertiary-default text-text-secondary">
                            {employees.total}
                        </span>
                    </PillTab>
                    <PillTab
                        variant="blue"
                        isSelected={activeTab === 'queue'}
                        onSelect={() => setActiveTab('queue')}
                        icon={RiTimeLine}
                    >
                        <span>Pending Requests</span>
                        {pendingCount > 0 ? (
                            <span className="ms-1.5 px-2 py-0.5 rounded-full text-caption-1-semibold bg-status-rose-background text-status-rose-text animate-pulse">
                                {pendingCount}
                            </span>
                        ) : null}
                    </PillTab>
                    <PillTab
                        variant="blue"
                        isSelected={activeTab === 'history'}
                        onSelect={() => setActiveTab('history')}
                        icon={RiHistoryLine}
                    >
                        <span>Decisions History</span>
                        {recentRequests.length > 0 ? (
                            <span className="ms-1.5 px-2 py-0.5 rounded-full text-caption-1-medium bg-background-tertiary-default text-text-secondary">
                                {recentRequests.length}
                            </span>
                        ) : null}
                    </PillTab>
                </PillTabList>

                {/* Subtitle pill informing statutory cycle */}
                <div className="hidden lg:flex items-center gap-2 text-caption-1-medium text-text-secondary bg-background-secondary-default px-3 py-1.5 rounded-full border border-border-button-default">
                    <RiCalendarLine className="size-3.5 text-accent-500" />
                    <span>Statutory Cycle: <strong className="text-text-primary font-mono">{currentYear} G.C.</strong></span>
                </div>
            </div>

            {/* TAB 1: STAFF LEAVE BALANCES */}
            {activeTab === 'balances' && (
                <div className="space-y-4">
                    {/* Controls & Filter Toolbar */}
                    <div
                        data-tour="leave-search"
                        className="rounded-2xl border border-border-button-default bg-background-primary-default p-3 sm:p-4 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between"
                    >
                        <div className="w-full lg:w-96">
                            <SearchField
                                aria-label="Search personnel records"
                                placeholder="Search by name, file no, position..."
                                value={search}
                                onChange={(val) => setSearch(val)}
                                onSubmit={() => handleFilter({ search })}
                                shape="pill"
                                size="medium"
                                className="w-full"
                            />
                        </div>

                        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5">
                            <div className="text-caption-1-medium text-text-tertiary sm:me-1">
                                Cycle: <span className="font-semibold text-text-primary">{currentYear} G.C.</span>
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                size="small"
                                leadingIcon={RiCompass3Line}
                                onClick={() => setIsTourOpen(true)}
                                className="rounded-full text-caption-1-medium"
                            >
                                Tour Ledger
                            </Button>

                            <SegmentedControl
                                variant="solid"
                                aria-label="Display mode"
                                selectedKeys={[viewMode]}
                                onSelectionChange={(keys) => {
                                    const next = Array.from(keys)[0] as 'table' | 'grid';
                                    if (next) setViewMode(next);
                                }}
                            >
                                <SegmentedControlItem id="table" aria-label="Table view">
                                    <RiTableLine className="size-4 me-1" />
                                    <span>Table</span>
                                </SegmentedControlItem>
                                <SegmentedControlItem id="grid" aria-label="Grid view">
                                    <RiLayoutGridLine className="size-4 me-1" />
                                    <span>Grid</span>
                                </SegmentedControlItem>
                            </SegmentedControl>
                        </div>
                    </div>

                    {/* Table View */}
                    {viewMode === 'table' ? (
                        <div
                            data-tour="leave-table"
                            className="rounded-2xl border border-border-button-default bg-background-primary-default shadow-xs overflow-hidden"
                        >
                            <Table aria-label="Staff Leave Balances" size="md">
                                <TableHeader>
                                    <TableColumn id="file_no" isRowHeader className="w-24">
                                        File No
                                    </TableColumn>
                                    <TableColumn id="staff">Staff Member</TableColumn>
                                    <TableColumn id="department">Department</TableColumn>
                                    <TableColumn id="employed">Employment (E.C)</TableColumn>
                                    <TableColumn id="entitlement" className="text-center">
                                        Statutory Entitlement
                                    </TableColumn>
                                    <TableColumn id="taken" className="text-center">
                                        Days Taken
                                    </TableColumn>
                                    <TableColumn id="remaining" className="text-center">
                                        Remaining Balance
                                    </TableColumn>
                                    <TableColumn id="actions" className="text-end">
                                        <span className="sr-only">Actions</span>
                                    </TableColumn>
                                </TableHeader>
                                <TableBody
                                    renderEmptyState={() => (
                                        <div className="flex h-44 flex-col items-center justify-center text-center p-6 text-text-tertiary">
                                            <RiUserLine className="size-8 text-foreground-icon-quaternary mb-2" />
                                            <p className="text-body-medium font-medium text-text-secondary">
                                                No personnel records found
                                            </p>
                                            <p className="text-caption-1-regular text-text-tertiary mt-0.5">
                                                Try adjusting your search query or clear filters.
                                            </p>
                                        </div>
                                    )}
                                >
                                    {employees.data.map((emp, index) => (
                                        <TableRow
                                            key={emp.id}
                                            id={emp.id}
                                            className="hover:bg-background-secondary-default/60 transition-colors"
                                        >
                                            <TableCell>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-caption-1-semibold font-mono bg-background-tertiary-default text-accent-600 border border-border-button-default">
                                                    {emp.file_no}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        size="md"
                                                        color="blue"
                                                        initials={getInitials(emp.full_name)}
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-text-primary text-body-medium truncate">
                                                            {emp.full_name}
                                                        </div>
                                                        <div className="text-caption-1-regular text-text-tertiary truncate">
                                                            {emp.position}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    color="neutral"
                                                    variant="caption"
                                                    className="font-normal text-text-secondary"
                                                >
                                                    {emp.department?.name || 'General Operations'}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-caption-1-medium text-text-secondary">
                                                    {emp.employment_date_ec}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="font-semibold text-text-primary text-body-medium font-mono">
                                                    {emp.statutory_entitlement}
                                                </span>
                                                <span className="text-caption-1-regular text-text-tertiary ms-1">Days</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="font-medium text-text-secondary text-body-medium font-mono">
                                                    {emp.display_taken}
                                                </span>
                                                <span className="text-caption-1-regular text-text-tertiary ms-1">Days</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div data-tour={index === 0 ? 'balance-badge' : undefined}>
                                                    <BalanceHealthBadge
                                                        remaining={emp.display_remaining}
                                                        entitled={emp.statutory_entitlement}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-end">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        size="small"
                                                        variant="primary"
                                                        leadingIcon={RiSubtractLine}
                                                        onClick={() => openAdjustModal(emp)}
                                                        data-tour={index === 0 ? 'first-deduct-btn' : undefined}
                                                        className="rounded-full shadow-xs text-caption-1-semibold"
                                                    >
                                                        Deduct
                                                    </Button>
                                                    <Link href={route('employees.show', emp.id)}>
                                                        <IconButton
                                                            size="small"
                                                            icon={RiUserLine}
                                                            aria-label={`View profile for ${emp.full_name}`}
                                                            title="View Profile"
                                                            data-tour={index === 0 ? 'first-profile-btn' : undefined}
                                                            className="rounded-full hover:text-accent-500"
                                                        />
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* BoardUI Pagination */}
                            {employees.last_page > 1 && (
                                <div
                                    data-tour="leave-pagination"
                                    className="p-3.5 border-t border-separator-border bg-background-secondary-default/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-caption-1-medium text-text-secondary"
                                >
                                    <div>
                                        Showing <strong className="text-text-primary font-mono">{employees.from || 0}</strong> to <strong className="text-text-primary font-mono">{employees.to || 0}</strong> of <strong className="text-text-primary font-mono">{employees.total}</strong> personnel
                                    </div>
                                    <Pagination
                                        page={employees.current_page}
                                        totalPages={employees.last_page}
                                        onChange={(newPage) => {
                                            router.get(
                                                route('leave.index'),
                                                { search, page: newPage },
                                                { preserveState: true, replace: true }
                                            );
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Card Grid View */
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {employees.data.length === 0 ? (
                                    <div className="col-span-full rounded-2xl border border-border-button-default bg-background-primary-default py-16 text-center text-text-tertiary">
                                        <RiUserLine className="size-8 mx-auto mb-2 text-foreground-icon-quaternary" />
                                        <p className="text-body-medium font-medium text-text-secondary">
                                            No personnel records found
                                        </p>
                                    </div>
                                ) : (
                                    employees.data.map((emp, index) => (
                                        <div
                                            key={emp.id}
                                            className="rounded-2xl border border-border-button-default bg-background-primary-default p-4 transition-all duration-200 hover:border-accent-500/40 hover:shadow-xs flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2.5">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <Avatar
                                                            size="md"
                                                            color="blue"
                                                            initials={getInitials(emp.full_name)}
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-body-medium font-semibold text-text-primary">
                                                                {emp.full_name}
                                                            </p>
                                                            <p className="truncate text-caption-1-regular text-text-tertiary">
                                                                {emp.position}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="shrink-0 font-mono text-caption-1-semibold px-2 py-0.5 rounded-full bg-background-tertiary-default text-accent-600 border border-border-button-default">
                                                        {emp.file_no}
                                                    </span>
                                                </div>

                                                <div className="mt-2.5 flex items-center justify-between text-caption-1-regular text-text-secondary">
                                                    <Chip color="neutral" variant="caption">
                                                        {emp.department?.name || 'General Operations'}
                                                    </Chip>
                                                    <span className="font-mono text-text-tertiary text-caption-1-regular">
                                                        E.C. {emp.employment_date_ec}
                                                    </span>
                                                </div>

                                                {/* Metrics 3-box */}
                                                <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-separator-border pt-3 text-center">
                                                    <div className="bg-background-secondary-default/50 rounded-xl py-2">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                                                            Entitled
                                                        </p>
                                                        <p className="text-headline-semibold text-text-primary font-mono mt-0.5">
                                                            {emp.statutory_entitlement}
                                                        </p>
                                                    </div>
                                                    <div className="bg-background-secondary-default/50 rounded-xl py-2">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                                                            Taken
                                                        </p>
                                                        <p className="text-headline-semibold text-text-secondary font-mono mt-0.5">
                                                            {emp.display_taken}
                                                        </p>
                                                    </div>
                                                    <div className="bg-background-secondary-default/50 rounded-xl py-2 flex flex-col items-center justify-center">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                                                            Remaining
                                                        </p>
                                                        <div className="mt-0.5" data-tour={index === 0 ? 'balance-badge' : undefined}>
                                                            <BalanceHealthBadge
                                                                remaining={emp.display_remaining}
                                                                entitled={emp.statutory_entitlement}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex gap-2 pt-3 border-t border-separator-border">
                                                <Button
                                                    data-tour={index === 0 ? 'first-deduct-btn' : undefined}
                                                    onClick={() => openAdjustModal(emp)}
                                                    size="small"
                                                    variant="primary"
                                                    leadingIcon={RiSubtractLine}
                                                    className="flex-1 rounded-full text-caption-1-semibold"
                                                >
                                                    Deduct
                                                </Button>
                                                <Link href={route('employees.show', emp.id)} className="flex-1">
                                                    <Button
                                                        data-tour={index === 0 ? 'first-profile-btn' : undefined}
                                                        variant="secondary"
                                                        size="small"
                                                        leadingIcon={RiUserLine}
                                                        className="w-full rounded-full text-caption-1-semibold"
                                                    >
                                                        Profile
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Grid View Pagination */}
                            {employees.last_page > 1 && (
                                <div className="p-3.5 rounded-2xl border border-border-button-default bg-background-primary-default flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-caption-1-medium text-text-secondary">
                                    <div>
                                        Showing <strong className="text-text-primary font-mono">{employees.from || 0}</strong> to <strong className="text-text-primary font-mono">{employees.to || 0}</strong> of <strong className="text-text-primary font-mono">{employees.total}</strong> personnel
                                    </div>
                                    <Pagination
                                        page={employees.current_page}
                                        totalPages={employees.last_page}
                                        onChange={(newPage) => {
                                            router.get(
                                                route('leave.index'),
                                                { search, page: newPage },
                                                { preserveState: true, replace: true }
                                            );
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: PENDING LEAVE REQUESTS QUEUE */}
            {activeTab === 'queue' && (
                <div className="rounded-2xl border border-border-button-default bg-background-primary-default shadow-xs overflow-hidden">
                    <div className="py-4 px-6 border-b border-separator-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-background-secondary-default/40">
                        <div>
                            <h3 className="text-title-3-semibold text-text-primary flex items-center gap-2">
                                <RiShieldCheckLine className="size-5 text-accent-500" />
                                <span>Pending Leave Requests Queue</span>
                            </h3>
                            <p className="text-body-regular text-text-secondary mt-0.5">
                                Review staff leave applications, evaluate balance liability, and approve with deduction or grant statutory excused leave.
                            </p>
                        </div>
                        <Chip color={pendingRequests.length > 0 ? 'rose' : 'lime'} variant="bold" className="self-start sm:self-auto font-mono">
                            {pendingRequests.length} Waiting Review
                        </Chip>
                    </div>

                    {pendingRequests.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                            <div className="size-14 rounded-full bg-status-lime-background flex items-center justify-center text-green-600 mb-3 shadow-xs">
                                <RiCheckboxCircleLine className="size-8" />
                            </div>
                            <h4 className="text-title-3-semibold text-text-primary">All Caught Up!</h4>
                            <p className="text-body-regular text-text-secondary mt-1 max-w-md">
                                There are no pending employee leave applications awaiting administrative HR review.
                            </p>
                        </div>
                    ) : (
                        <Table aria-label="Pending Leave Requests" size="md">
                            <TableHeader>
                                <TableColumn id="staff" isRowHeader>Staff Member</TableColumn>
                                <TableColumn id="type">Leave Type</TableColumn>
                                <TableColumn id="dates">Duration &amp; Dates</TableColumn>
                                <TableColumn id="handover">Handover &amp; Contact</TableColumn>
                                <TableColumn id="balance" className="text-center">Current Balance</TableColumn>
                                <TableColumn id="reason">Reason</TableColumn>
                                <TableColumn id="action" className="text-end">Action</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {pendingRequests.map((req) => (
                                    <TableRow key={req.id} id={req.id} className="hover:bg-background-secondary-default/60">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    size="md"
                                                    color="blue"
                                                    initials={getInitials(req.employee?.full_name || 'Staff')}
                                                />
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-text-primary text-body-medium">
                                                        {req.employee?.full_name || 'Staff Member'}
                                                    </div>
                                                    <div className="text-caption-1-medium text-accent-600 font-mono">
                                                        {req.employee?.file_no}
                                                    </div>
                                                    <div className="text-[11px] text-text-tertiary">
                                                        {req.employee?.department?.name || 'Operations'} · {req.employee?.position}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip color="blue" variant="bold">
                                                {req.leave_type} Leave
                                            </Chip>
                                            {req.attachment_path && (
                                                <div className="mt-1">
                                                    <a
                                                        href={`/storage/${req.attachment_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] text-accent-600 hover:underline font-semibold"
                                                    >
                                                        <RiAttachment2 className="size-3" />
                                                        <span>Attachment</span>
                                                    </a>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-mono font-bold text-text-primary text-caption-1-semibold">
                                                {req.requested_days} Working Day{req.requested_days > 1 ? 's' : ''}
                                            </div>
                                            <div className="text-caption-1-regular font-mono text-text-secondary">
                                                {req.start_date_ec} – {req.end_date_ec} (E.C.)
                                            </div>
                                            <div className="text-[10px] text-text-tertiary font-mono">
                                                {req.start_date} to {req.end_date}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-caption-1-medium text-text-primary">
                                                {req.handover_employee?.full_name || 'None designated'}
                                            </div>
                                            <div className="text-[11px] font-mono text-text-tertiary flex items-center gap-1 mt-0.5">
                                                <RiPhoneLine className="size-3" />
                                                <span>{req.contact_phone || '—'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Chip color="lime" variant="bold" className="font-mono">
                                                {req.employee?.current_leave_balance?.remaining_days ?? 16} Days
                                            </Chip>
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            <p className="text-caption-1-regular text-text-primary line-clamp-2" title={req.reason}>
                                                {req.reason}
                                            </p>
                                            <p className="text-[10px] text-text-tertiary mt-1 font-mono">
                                                Applied: {new Date(req.created_at).toLocaleDateString()}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <Button
                                                size="small"
                                                variant="primary"
                                                leadingIcon={RiShieldCheckLine}
                                                onClick={() => openReviewModal(req)}
                                                className="rounded-full shadow-xs text-caption-1-semibold"
                                            >
                                                Review &amp; Decide
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            )}

            {/* TAB 3: DECISIONS HISTORY */}
            {activeTab === 'history' && (
                <div className="rounded-2xl border border-border-button-default bg-background-primary-default shadow-xs overflow-hidden">
                    <div className="py-4 px-6 border-b border-separator-border bg-background-secondary-default/40">
                        <h3 className="text-title-3-semibold text-text-primary flex items-center gap-2">
                            <RiHistoryLine className="size-5 text-accent-500" />
                            <span>Recent Leave Decisions Audit History</span>
                        </h3>
                        <p className="text-body-regular text-text-secondary mt-0.5">
                            Comprehensive audit trail of reviewed, approved, and rejected personnel leave applications.
                        </p>
                    </div>

                    {recentRequests.length === 0 ? (
                        <div className="py-16 text-center text-body-regular text-text-tertiary">
                            No historic leave decisions recorded yet.
                        </div>
                    ) : (
                        <Table aria-label="Decisions History" size="md">
                            <TableHeader>
                                <TableColumn id="staff" isRowHeader>Staff Member</TableColumn>
                                <TableColumn id="type">Type &amp; Period</TableColumn>
                                <TableColumn id="impact">Balance Impact</TableColumn>
                                <TableColumn id="decision">Decision</TableColumn>
                                <TableColumn id="reviewer">Reviewed By</TableColumn>
                                <TableColumn id="notes">Notes</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {recentRequests.map((req) => (
                                    <TableRow key={req.id} id={req.id} className="hover:bg-background-secondary-default/60">
                                        <TableCell>
                                            <div className="font-semibold text-text-primary text-body-medium">
                                                {req.employee?.full_name || 'Staff Member'}
                                            </div>
                                            <div className="text-caption-1-semibold text-accent-600 font-mono">
                                                {req.employee?.file_no}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-caption-1-semibold text-text-primary">
                                                {req.leave_type} ({req.requested_days} Days)
                                            </div>
                                            <div className="text-[11px] font-mono text-text-tertiary">
                                                {req.start_date_ec} to {req.end_date_ec} (E.C.)
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {req.status === 'Approved' ? (
                                                req.is_deducted ? (
                                                    <Chip color="yellow" variant="bold" className="font-mono">
                                                        -{req.days_deducted} days
                                                    </Chip>
                                                ) : (
                                                    <Chip color="lime" variant="bold">
                                                        Excused (0 Deduction)
                                                    </Chip>
                                                )
                                            ) : (
                                                <span className="text-caption-1-regular text-text-tertiary">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                color={req.status === 'Approved' ? 'lime' : req.status === 'Rejected' ? 'rose' : 'neutral'}
                                                variant="bold"
                                            >
                                                {req.status}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-caption-1-medium text-text-primary">
                                                {req.reviewer?.name || 'HR Administrator'}
                                            </div>
                                            <div className="text-[10px] text-text-tertiary font-mono">
                                                {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : '—'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            <p className="text-caption-1-regular text-text-secondary truncate" title={req.reviewer_notes || req.reason}>
                                                {req.reviewer_notes || req.reason || '—'}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            )}

            {/* HR Review Decision Modal (BoardUI Modal) */}
            <Modal
                isOpen={Boolean(selectedRequest)}
                onOpenChange={(isOpen) => !isOpen && setSelectedRequest(null)}
                size="lg"
            >
                {({ close }) => (
                    <>
                        <ModalHeader
                            title="Review Employee Leave Application"
                            description="Evaluate remaining statutory balance, decide deduction treatment, or record formal justification."
                            icon={RiShieldCheckLine}
                        />

                        {selectedRequest && (
                            <form onSubmit={handleReviewSubmit}>
                                <ModalBody className="space-y-4 py-2">
                                    {/* Staff Dossier Summary Banner */}
                                    <div className="p-4 bg-background-secondary-default/70 border border-border-button-default rounded-2xl space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    size="lg"
                                                    color="blue"
                                                    initials={getInitials(selectedRequest.employee?.full_name || 'Staff')}
                                                />
                                                <div>
                                                    <p className="font-semibold text-text-primary text-title-3-semibold">
                                                        {selectedRequest.employee?.full_name}
                                                    </p>
                                                    <p className="text-caption-1-semibold text-accent-600 font-mono">
                                                        {selectedRequest.employee?.file_no} · {selectedRequest.employee?.position}
                                                    </p>
                                                    <p className="text-caption-1-regular text-text-tertiary">
                                                        {selectedRequest.employee?.department?.name || 'General Operations'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-end">
                                                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                                                    Current Balance
                                                </p>
                                                <p className="text-headline-semibold text-accent-600 font-mono mt-0.5">
                                                    {selectedRequest.employee?.current_leave_balance?.remaining_days ?? 16} Days
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-separator-border grid grid-cols-2 gap-2.5 text-caption-1-regular">
                                            <div>
                                                <span className="text-text-tertiary">Leave Type: </span>
                                                <strong className="text-text-primary font-semibold">{selectedRequest.leave_type} Leave</strong>
                                            </div>
                                            <div>
                                                <span className="text-text-tertiary">Duration: </span>
                                                <strong className="text-text-primary font-mono font-semibold">{selectedRequest.requested_days} Working Days</strong>
                                            </div>
                                            <div>
                                                <span className="text-text-tertiary">Dates (E.C.): </span>
                                                <span className="font-mono text-text-primary">{selectedRequest.start_date_ec} – {selectedRequest.end_date_ec}</span>
                                            </div>
                                            <div>
                                                <span className="text-text-tertiary">Dates (G.C.): </span>
                                                <span className="font-mono text-text-secondary">{selectedRequest.start_date} to {selectedRequest.end_date}</span>
                                            </div>
                                            {selectedRequest.handover_employee && (
                                                <div className="col-span-2">
                                                    <span className="text-text-tertiary">Handover: </span>
                                                    <span className="text-text-primary font-medium">{selectedRequest.handover_employee.full_name} ({selectedRequest.handover_employee.position})</span>
                                                </div>
                                            )}
                                            {selectedRequest.contact_phone && (
                                                <div className="col-span-2">
                                                    <span className="text-text-tertiary">Contact: </span>
                                                    <span className="text-text-primary font-mono">{selectedRequest.contact_phone}</span>
                                                </div>
                                            )}
                                            <div className="col-span-2 pt-1">
                                                <span className="text-text-tertiary">Reason: </span>
                                                <span className="text-text-primary italic">&quot;{selectedRequest.reason}&quot;</span>
                                            </div>
                                            {selectedRequest.attachment_path && (
                                                <div className="col-span-2 pt-1">
                                                    <a
                                                        href={`/storage/${selectedRequest.attachment_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-caption-1-semibold text-accent-600 hover:underline"
                                                    >
                                                        <RiAttachment2 className="size-3.5" />
                                                        <span>View Attached Document</span>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Decision Switcher */}
                                    <div className="space-y-1.5">
                                        <label className="block text-caption-1-semibold text-text-primary">
                                            Administrative Review Decision <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setReviewData('decision', 'approve')}
                                                className={cx(
                                                    'p-3.5 rounded-2xl border text-body-medium font-semibold flex items-center justify-center gap-2.5 cursor-pointer transition-all',
                                                    reviewData.decision === 'approve'
                                                        ? 'bg-status-lime-background border-green-500 text-status-lime-text shadow-xs ring-2 ring-green-500/20'
                                                        : 'border-border-button-default bg-background-primary-default text-text-secondary hover:bg-background-secondary-default'
                                                )}
                                            >
                                                <RiCheckboxCircleLine className="size-5 text-green-600" />
                                                <span>Approve Request</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setReviewData('decision', 'reject')}
                                                className={cx(
                                                    'p-3.5 rounded-2xl border text-body-medium font-semibold flex items-center justify-center gap-2.5 cursor-pointer transition-all',
                                                    reviewData.decision === 'reject'
                                                        ? 'bg-status-rose-background border-red-500 text-status-rose-text shadow-xs ring-2 ring-red-500/20'
                                                        : 'border-border-button-default bg-background-primary-default text-text-secondary hover:bg-background-secondary-default'
                                                )}
                                            >
                                                <RiCloseCircleLine className="size-5 text-red-600" />
                                                <span>Reject Request</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* When Approved */}
                                    {reviewData.decision === 'approve' && (
                                        <div className="space-y-3 p-4 rounded-2xl border border-border-button-default bg-background-secondary-default/50">
                                            <Checkbox
                                                isSelected={reviewData.deduct_balance}
                                                onChange={(checked) => setReviewData('deduct_balance', checked)}
                                            >
                                                <span className="font-semibold text-text-primary text-body-medium">
                                                    Deduct from Annual Leave Balance
                                                </span>
                                            </Checkbox>

                                            {reviewData.deduct_balance ? (
                                                <NumberField
                                                    label="Days to Deduct from Annual Balance"
                                                    step={0.5}
                                                    minValue={0.5}
                                                    maxValue={60}
                                                    value={Number(reviewData.days_to_deduct) || 1}
                                                    onChange={(val) => setReviewData('days_to_deduct', String(val))}
                                                    hint="Supports full or half-day (0.5) deductions"
                                                />
                                            ) : (
                                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-caption-1-regular text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                                    <RiInformationLine className="size-4 shrink-0 mt-0.5" />
                                                    <div>
                                                        <strong className="block font-semibold">Approved as Excused / Special Leave</strong>
                                                        Zero days will be deducted from the annual balance (e.g. bereavement, statutory wedding, or medical).
                                                    </div>
                                                </div>
                                            )}

                                            <Input
                                                label="Reviewer Notes (Optional)"
                                                placeholder="e.g. Approved per medical cert / Art. 81"
                                                value={reviewData.reviewer_notes}
                                                onChange={(val) => setReviewData('reviewer_notes', val)}
                                            />
                                        </div>
                                    )}

                                    {/* When Rejected */}
                                    {reviewData.decision === 'reject' && (
                                        <div className="space-y-2 p-4 rounded-2xl border border-red-500/30 bg-status-rose-background/40">
                                            <Textarea
                                                label="Formal Rejection Reason"
                                                isRequired
                                                rows={3}
                                                autoResize
                                                value={reviewData.reviewer_notes}
                                                onChange={(val) => setReviewData('reviewer_notes', val)}
                                                placeholder="Explain why this leave request cannot be approved..."
                                                isInvalid={Boolean(reviewErrors.reviewer_notes)}
                                                hint={reviewErrors.reviewer_notes}
                                            />
                                        </div>
                                    )}
                                </ModalBody>

                                <ModalFooter>
                                    <Button type="button" variant="secondary" onClick={close}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant={reviewData.decision === 'approve' ? 'primary' : 'danger'}
                                        disabled={reviewProcessing}
                                    >
                                        {reviewProcessing
                                            ? 'Submitting...'
                                            : reviewData.decision === 'approve'
                                            ? 'Confirm Approval'
                                            : 'Confirm Rejection'}
                                    </Button>
                                </ModalFooter>
                            </form>
                        )}
                    </>
                )}
            </Modal>

            {/* Deduct Leave Quick Modal (BoardUI Modal) */}
            <Modal
                isOpen={Boolean(selectedStaff)}
                onOpenChange={(isOpen) => !isOpen && setSelectedStaff(null)}
                size="md"
            >
                {({ close }) => (
                    <>
                        <ModalHeader
                            title="Record Annual Leave Deduction"
                            description={`Manually deduct taken leave for ${selectedStaff?.full_name} (${selectedStaff?.file_no})`}
                            icon={RiSubtractLine}
                        />

                        <form onSubmit={handleDeductSubmit}>
                            <ModalBody className="space-y-4 py-2">
                                <div className="p-3.5 bg-background-secondary-default/80 border border-border-button-default rounded-xl flex items-center justify-between">
                                    <span className="text-caption-1-medium text-text-secondary">Current Balance:</span>
                                    <Chip color="lime" variant="bold" className="font-mono">
                                        {selectedStaff?.display_remaining} Working Days
                                    </Chip>
                                </div>

                                <NumberField
                                    label="Number of Days Deducted"
                                    isRequired
                                    step={0.5}
                                    minValue={0.5}
                                    maxValue={60}
                                    value={Number(data.days_deducted) || 1}
                                    onChange={(val) => setData('days_deducted', String(val))}
                                    hint="Input days taken (supports 0.5 increments)"
                                />

                                <Input
                                    label="Leave Reason / Description"
                                    placeholder="e.g. Annual Vacation, Family Affairs"
                                    value={data.reason}
                                    onChange={(val) => setData('reason', val)}
                                />
                            </ModalBody>

                            <ModalFooter>
                                <Button type="button" variant="secondary" onClick={close}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={processing}
                                    leadingIcon={RiSubtractLine}
                                >
                                    {processing ? 'Recording...' : 'Deduct Days'}
                                </Button>
                            </ModalFooter>
                        </form>
                    </>
                )}
            </Modal>

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
