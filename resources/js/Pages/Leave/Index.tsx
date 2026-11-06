import { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InteractiveTour, { TourStep } from '@/Components/InteractiveTour';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
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
    Compass
} from 'lucide-react';

const leaveTourSteps: TourStep[] = [
    {
        target: '[data-tour="leave-header"]',
        title: 'Statutory Annual Leave Ledger',
        content: 'Welcome to the Statutory Leave Administration Center. This module automates continuous entitlement calculations according to Ethiopian Labour Proclamation No. 1156/2019 (Articles 77â€“80), safeguarding statutory rest rights for all personnel across project sites and head office.',
        badge: 'Labour Proc. 1156/2019',
        placement: 'bottom',
        tip: 'The statutory baseline is 16 working days for the first full year of service, scaling upward with continuous tenure.',
    },
    {
        target: '[data-tour="leave-search"]',
        title: 'Multi-Field Search & Active Cycle',
        content: 'Instantly find any employee by typing their full name, filing cabinet code (e.g. A-001), or department. It also displays the active Gregorian statutory calculation cycle (e.g. 2026 G.C.).',
        badge: 'Filter & Cycle',
        placement: 'bottom',
        tip: 'Press Enter to submit search queries; pagination and active filters are preserved in the URL state.',
    },
    {
        target: '[data-tour="leave-table"]',
        title: 'Comprehensive Leave Ledger',
        content: 'The central ledger displays employee identifiers, verified hiring date in Ethiopian Calendar (E.C.), statutory entitlement days, recorded days taken, and current net remaining balance.',
        badge: 'Compliance Table',
        placement: 'top',
    },
    {
        target: '[data-tour="col-entitlement"]',
        title: 'Automated Entitlement Formula',
        content: 'Every entitlement is computed strictly via Article 77: 16 working days for year 1, plus 1 additional working day for every subsequent 2 completed years of continuous service. No manual calculations or spreadsheets needed.',
        badge: 'Art. 77 Formula',
        placement: 'top',
        tip: 'A technician with 6 years tenure automatically receives 16 + (6/2) = 19 working days.',
    },
    {
        target: '[data-tour="balance-badge"]',
        title: 'Visual Balance Health Alerts',
        content: 'Color-coded tags provide immediate compliance alerts: Green indicates a healthy balance (>8 days), Amber signals caution (4â€“8 days), and Red indicates critical / exhausted balance (â‰¤3 days).',
        badge: 'Health Alerts',
        placement: 'left',
    },
    {
        target: '[data-tour="first-deduct-btn"]',
        title: 'Record Taken Annual Leave',
        content: 'Click "Deduct Leave" to record taken rest or personal leave. The modal validates that deducted days do not exceed remaining balance, supports half-day increments (0.5), and documents the operational reason.',
        badge: 'Leave Deductions',
        placement: 'left',
        tip: 'All leave deductions automatically record an immutable entry in the system audit log.',
    },
    {
        target: '[data-tour="first-profile-btn"]',
        title: '360Â° Employee Profile Access',
        content: 'Click "Profile" to jump straight to the staff member\'s complete profileâ€”showing their full multi-year leave balance history, itemized monthly wage breakdown, allowances, and identity credentials.',
        badge: 'Employee Profile',
        placement: 'left',
    },
    {
        target: '[data-tour="leave-pagination"]',
        title: 'Ledger Pagination & Filter State',
        content: 'Easily navigate through pages of workforce records while keeping your search keywords preserved across pages.',
        badge: 'Navigation',
        placement: 'top',
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
}

export default function Index({ employees, filters, stats, currentYear }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStaff, setSelectedStaff] = useState<StaffLeave | null>(null);
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
            return 'bg-[#fee2e2] text-[#de2828]';
        }
        if (remaining <= 8) {
            return 'bg-[#fef9c3] text-[#854d0e]';
        }

        return 'bg-[#e8f5e9] text-[#1f7a3d]';
    };

    return (
        <AuthenticatedLayout
            title="Leave Ledger"
            subtitle="Automated leave administration under Ethiopian Labour Proclamation 1156/2019 (Art. 77: 16 days + 1 day per 2 years of service)."
        >
            <Head title="Leave Ledger - Elhadar Engineering HRMS" />

            {/* Filter and Search Bar */}
            <Card data-tour="leave-search" className="border-border bg-card mb-6">
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
            <Card data-tour="leave-table" className="border-[#d2d2d7] bg-white overflow-hidden shadow-sm">
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
                                <TableCell colSpan={8} className="text-center py-12 text-[#6e6e73]">
                                    No personnel records found matching your query.
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.data.map((emp, index) => (
                                <TableRow key={emp.id} className="hover:bg-[#f5f5f7]/50">
                                    <TableCell className="font-bold text-[#0066cc] text-xs">
                                        {emp.file_no}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-black text-sm">{emp.full_name}</div>
                                        <div className="text-xs text-[#6e6e73]">{emp.position}</div>
                                    </TableCell>
                                    <TableCell className="text-xs text-[#424245]">
                                        {emp.department?.name || 'General Operations'}
                                    </TableCell>
                                    <TableCell className="text-xs text-[#6e6e73]">
                                        {emp.employment_date_ec}
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-black text-xs">
                                        {emp.statutory_entitlement} Days
                                    </TableCell>
                                    <TableCell className="text-center text-xs text-[#6e6e73]">
                                        {emp.display_taken} Days
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span 
                                            data-tour={index === 0 ? "balance-badge" : undefined}
                                            className={`inline-flex items-center px-2 py-0.5 rounded-xs text-xs font-bold ${
                                                emp.display_remaining <= 3 ? 'bg-[#fee2e2] text-[#de2828]' :
                                                emp.display_remaining <= 8 ? 'bg-[#fef9c3] text-[#854d0e]' :
                                                'bg-[#f5f5f7] text-[#0066cc]'
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
                                                className="bg-[#0066cc] hover:bg-[#0071e3] text-white font-bold text-xs h-8 px-2.5 rounded-xs"
                                            >
                                                <MinusCircle className="w-3.5 h-3.5 mr-1" />
                                                Deduct Leave
                                            </Button>
                                            <Link href={route('employees.show', emp.id)}>
                                                <Button 
                                                    data-tour={index === 0 ? "first-profile-btn" : undefined}
                                                    variant="outline" 
                                                    size="sm"
                                                    className="border-[#d2d2d7] hover:bg-[#f5f5f7] text-[#0066cc] font-semibold text-xs h-8 px-2.5 rounded-xs"
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
                            <div className="col-span-full py-12 text-center text-xs text-[#6e6e73]">
                                No personnel records found matching your query.
                            </div>
                        ) : (
                            employees.data.map((emp, index) => (
                                <div
                                    key={emp.id}
                                    className="rounded-xs border border-[#e8e8ed] bg-[#f5f5f7] p-4 transition-colors hover:border-[#d2d2d7] hover:bg-white"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-black">{emp.full_name}</p>
                                            <p className="text-[11px] font-semibold text-[#0066cc]">{emp.file_no}</p>
                                            <p className="truncate text-[11px] text-[#6e6e73]">
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

                                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#e8e8ed] pt-3 text-center">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#6e6e73]">Entitled</p>
                                            <p className="text-sm font-bold text-black">{emp.statutory_entitlement}</p>
                                        </div>
                                        <div className="border-x border-[#e8e8ed]">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#6e6e73]">Taken</p>
                                            <p className="text-sm font-bold text-[#424245]">{emp.display_taken}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#6e6e73]">Remaining</p>
                                            <p className="text-sm font-bold text-black">{emp.display_remaining}</p>
                                        </div>
                                    </div>

                                    <p className="mt-2 text-[11px] text-[#6e6e73]">
                                        Employed: {emp.employment_date_ec} E.C.
                                    </p>

                                    <div className="mt-3 flex gap-2">
                                        <Button
                                            data-tour={index === 0 ? 'first-deduct-btn' : undefined}
                                            onClick={() => openAdjustModal(emp)}
                                            size="sm"
                                            className="flex-1 bg-[#0066cc] hover:bg-[#0071e3] text-white font-bold text-xs h-8 gap-1.5 rounded-xs"
                                        >
                                            <MinusCircle className="w-3.5 h-3.5" />
                                            Deduct Leave
                                        </Button>
                                        <Link href={route('employees.show', emp.id)}>
                                            <Button
                                                data-tour={index === 0 ? 'first-profile-btn' : undefined}
                                                variant="outline"
                                                size="sm"
                                                className="border-[#d2d2d7] hover:bg-[#f5f5f7] text-[#0066cc] font-semibold text-xs h-8 gap-1.5 rounded-xs"
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
                    <div data-tour="leave-pagination" className="p-4 border-t border-[#e8e8ed] bg-[#f5f5f7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[#6e6e73]">
                        <div>
                            Showing <strong>{employees.from || 0}</strong> to <strong>{employees.to || 0}</strong> of <strong>{employees.total}</strong> records
                        </div>
                        <div className="flex gap-1">
                            {employees.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveState
                                    className={`px-3 py-1.5 rounded-xs text-xs font-medium border transition-colors ${
                                        link.active
                                            ? 'bg-[#0066cc] text-white border-[#0066cc] font-semibold'
                                            : link.url
                                            ? 'bg-white text-[#424245] border-[#d2d2d7] hover:bg-[#f5f5f7]'
                                            : 'bg-white/50 text-[#b1b3b5] border-[#e8e8ed] cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Deduct Leave Modal (Shadcn Dialog) */}
            <Dialog open={Boolean(selectedStaff)} onOpenChange={(open) => !open && setSelectedStaff(null)}>
                <DialogContent className="max-w-md bg-white border-[#d2d2d7] p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-black flex items-center gap-2">
                            <MinusCircle className="w-4 h-4 text-[#0066cc]" />
                            Record Taken Annual Leave
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#0066cc] font-semibold">
                            {selectedStaff?.full_name} ({selectedStaff?.file_no})
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleDeductSubmit} className="space-y-4 pt-2">
                        <div className="p-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xs text-xs flex justify-between">
                            <span className="text-[#6e6e73]">Current Remaining Balance:</span>
                            <span className="font-bold text-[#0066cc]">{selectedStaff?.display_remaining} Working Days</span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
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
                                className="bg-[#f5f5f7] border-[#d2d2d7] text-xs h-10"
                            />
                            {errors.days_deducted && (
                                <p className="text-xs text-[#de2828] mt-1">{errors.days_deducted}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
                                Leave Reason / Description
                            </label>
                            <Input
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                                placeholder="e.g. Annual Vacation, Family Affairs"
                                className="bg-[#f5f5f7] border-[#d2d2d7] text-xs h-10"
                            />
                        </div>

                        <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-[#e8e8ed]">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSelectedStaff(null)}
                                className="text-xs border-[#d2d2d7] rounded-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold uppercase rounded-xs"
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
                tourTitle="Statutory Leave Ledger Guided Tour"
            />
        </AuthenticatedLayout>
    );
}


