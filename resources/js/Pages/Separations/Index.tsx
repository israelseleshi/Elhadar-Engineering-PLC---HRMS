import { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
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
    Calculator
} from 'lucide-react';
import axios from 'axios';

import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
interface SeparationItem {
    id: number;
    separation_type: string;
    effective_date: string;
    reason?: string;
    basic_salary_at_separation: number;
    completed_years_service: number;
    severance_amount: number;
    severance_paid: boolean;
    employee: {
        id: number;
        file_no: string;
        full_name: string;
        department?: { name: string };
    };
}

interface ActiveStaffOption {
    id: number;
    file_no: string;
    full_name: string;
    employment_date: string;
}

interface Props {
    separations: {
        data: SeparationItem[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search?: string;
        separation_type?: string;
    };
    stats: {
        total_separations: number;
        total_severance_paid: number;
        pending_severance_liability: number;
    };
    activeEmployees: ActiveStaffOption[];
}

export default function Index({ separations, filters, stats, activeEmployees }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [separationType, setSeparationType] = useState(filters.separation_type || '');
    const [viewMode, setViewMode] = useViewMode('separations');
    const [showModal, setShowModal] = useState(false);
    const [payoutToMarkPaid, setPayoutToMarkPaid] = useState<number | null>(null);
    const [previewCalc, setPreviewCalc] = useState<{
        years_service: number;
        basic_salary: number;
        first_year_amount: number;
        subsequent_amount: number;
        raw_total: number;
        statutory_cap: number;
        final_payout: number;
        is_capped: boolean;
    } | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        employee_id: activeEmployees.length > 0 ? String(activeEmployees[0].id) : '',
        separation_type: 'Termination_Without_Cause',
        effective_date: new Date().toISOString().split('T')[0],
        reason: '',
        severance_paid: false,
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2,
        }).format(val);
    };

    const handleFilter = (updates: Record<string, string>) => {
        router.get(
            route('separations.index'),
            {
                search,
                separation_type: separationType,
                ...updates,
            },
            { preserveState: true, replace: true }
        );
    };

    // Live calculate statutory severance when employee or date changes
    useEffect(() => {
        if (showModal && data.employee_id) {
            axios.get(route('separations.calculate', data.employee_id), {
                params: { effective_date: data.effective_date },
            })
            .then(res => setPreviewCalc(res.data))
            .catch(() => setPreviewCalc(null));
        }
    }, [data.employee_id, data.effective_date, showModal]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('separations.store'), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            },
        });
    };

    const handleMarkPaid = (id: number) => {
        setPayoutToMarkPaid(id);
    };

    const confirmMarkPaid = () => {
        if (!payoutToMarkPaid) return;
        router.patch(route('separations.mark-paid', payoutToMarkPaid), {}, {
            preserveScroll: true,
            onFinish: () => setPayoutToMarkPaid(null),
        });
    };

    const formatType = (typeStr: string) => {
        return typeStr.replace(/_/g, ' ');
    };

    const getSeparationVariant = (typeStr: string) => {
        if (typeStr.includes('Without_Cause') || typeStr === 'Layoff') {
            return 'destructive' as const;
        }
        if (typeStr === 'Retirement') {
            return 'mint' as const;
        }

        return 'secondary' as const;
    };

    return (
        <AuthenticatedLayout
            title="Separations & Severance Ledger"
            subtitle="Manage personnel exits and automated statutory severance calculations per Ethiopian Labour Proclamation 1156/2019 (Arts. 39â€“41)."
        >
            <Head title="Separations & Severance - Elhadar Engineering HRMS" />

            {/* Filter and Action Bar */}
            <Card className="border-[#d2d2d7] bg-white mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-[#6e6e73]" />
                                <Input
                                    placeholder="Search by name, file no..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleFilter({ search });
                                    }}
                                    className="pl-9 bg-[#f5f5f7] border-[#d2d2d7] text-xs h-11"
                                />
                            </div>

                            <Select value={separationType || '__all__'} onValueChange={(v) => { const next=v==='__all__'?'':v; setSeparationType(next); handleFilter({ separation_type: next }); }}><SelectTrigger className="h-11 rounded-xl border-[#d2d2d7] bg-[#f5f5f7] text-xs text-[#424245]"><SelectValue placeholder="All Separation Types" /></SelectTrigger><SelectContent><SelectItem value="__all__">All Separation Types</SelectItem>
                                <SelectItem value="Resignation">Resignation</SelectItem>
                                <SelectItem value="Termination_Without_Cause">Termination Without Cause</SelectItem>
                                <SelectItem value="Termination_With_Cause">Termination With Cause</SelectItem>
                                <SelectItem value="Layoff">Workforce Layoff</SelectItem>
                                <SelectItem value="Retirement">Statutory Retirement</SelectItem>
                                <SelectItem value="Probation_Failed">Probation Failed</SelectItem>
                                <SelectItem value="Contract_Expired">Contract Expired</SelectItem>
                            </SelectContent></Select>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <ViewToggle value={viewMode} onChange={setViewMode} />
                            <Button 
                                onClick={() => setShowModal(true)}
                                className="bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium rounded-full h-10 px-4 gap-2 shrink-0"
                            >
                                <Calculator className="w-4 h-4" />
                                Record Exit &amp; Estimate Severance
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Separations Table */}
            <Card className="border-[#d2d2d7] bg-white overflow-hidden shadow-sm">
                {viewMode === 'table' ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24">File no</TableHead>
                            <TableHead>Staff name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Separation type</TableHead>
                            <TableHead>Effective date</TableHead>
                            <TableHead className="text-center">Service (years)</TableHead>
                            <TableHead className="text-right">Severance pay</TableHead>
                            <TableHead className="text-center">Disbursement</TableHead>
                            <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {separations.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-12 text-[#6e6e73]">
                                    No employee separation records found matching your query.
                                </TableCell>
                            </TableRow>
                        ) : (
                            separations.data.map((item) => (
                                <TableRow key={item.id} className="hover:bg-[#f5f5f7]/50">
                                    <TableCell className="font-bold text-[#0066cc] text-xs">
                                        {item.employee.file_no}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-black text-sm">{item.employee.full_name}</div>
                                        <div className="text-xs text-[#6e6e73] truncate max-w-xs">{item.reason || 'No exit notes'}</div>
                                    </TableCell>
                                    <TableCell className="text-xs text-[#424245]">
                                        {item.employee.department?.name || 'Operations'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={
                                                item.separation_type.includes('Without_Cause') || item.separation_type === 'Layoff' ? 'destructive' :
                                                item.separation_type === 'Retirement' ? 'secondary' : 'outline'
                                            }
                                        >
                                            {formatType(item.separation_type)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs font-semibold text-black">
                                        {item.effective_date}
                                    </TableCell>
                                    <TableCell className="text-center text-xs font-bold text-black">
                                        {item.completed_years_service} Yrs
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-black text-sm">
                                        {item.severance_amount > 0 ? formatCurrency(item.severance_amount) : '0.00 ETB'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={item.severance_paid ? 'secondary' : 'outline'}>
                                            {item.severance_paid ? 'Disbursed' : 'Unpaid / Accrued'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                            {!item.severance_paid && item.severance_amount > 0 && (
                                                <Button
                                                    onClick={() => handleMarkPaid(item.id)}
                                                    size="sm"
                                                    className="bg-[#0066cc] hover:bg-[#0071e3] text-white font-medium text-xs h-9 px-3 rounded-full"
                                                >
                                                    Disburse
                                                </Button>
                                            )}
                                            <Link href={route('employees.show', item.employee.id)}>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="border-[#d2d2d7] hover:bg-[#f5f5f7] text-[#0066cc] font-medium text-xs h-9 px-3 rounded-full"
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
                        {separations.data.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-xs text-[#6e6e73]">
                                No employee separation records found matching your query.
                            </div>
                        ) : (
                            separations.data.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-xl border border-[#e8e8ed] bg-[#f5f5f7] p-4 transition-colors hover:border-[#d2d2d7] hover:bg-white"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-black">{item.employee.full_name}</p>
                                            <p className="text-[11px] font-semibold text-[#0066cc]">
                                                {item.employee.file_no} Â· {item.employee.department?.name || 'Operations'}
                                            </p>
                                        </div>
                                        <Badge variant={getSeparationVariant(item.separation_type)} className="shrink-0">
                                            {formatType(item.separation_type)}
                                        </Badge>
                                    </div>

                                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#e8e8ed] pt-3 text-center">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#6e6e73]">Service</p>
                                            <p className="text-sm font-bold text-black">{item.completed_years_service} Yrs</p>
                                        </div>
                                        <div className="border-x border-[#e8e8ed]">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#6e6e73]">Effective</p>
                                            <p className="text-[11px] font-bold text-[#424245]">{item.effective_date}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#6e6e73]">Payout</p>
                                            <p className="text-[11px] font-bold text-black">
                                                {item.severance_amount > 0 ? formatCurrency(item.severance_amount) : '0.00'}
                                            </p>
                                        </div>
                                    </div>

                                    {item.reason && (
                                        <p className="mt-2 line-clamp-2 text-[11px] text-[#6e6e73]">{item.reason}</p>
                                    )}

                                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#e8e8ed] pt-3">
                                        <Badge variant={item.severance_paid ? 'secondary' : 'outline'}>
                                            {item.severance_paid ? 'Disbursed' : 'Unpaid / Accrued'}
                                        </Badge>
                                    </div>

                                    <div className="mt-2 flex gap-2">
                                        {!item.severance_paid && item.severance_amount > 0 && (
                                            <Button
                                                onClick={() => handleMarkPaid(item.id)}
                                                size="sm"
                                                className="flex-1 bg-[#0066cc] hover:bg-[#0071e3] text-white font-medium text-xs h-9 rounded-full"
                                            >
                                                Disburse
                                            </Button>
                                        )}
                                        <Link href={route('employees.show', item.employee.id)} className="flex-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full border-[#d2d2d7] hover:bg-[#f5f5f7] text-[#0066cc] font-medium text-xs h-9 gap-1.5 rounded-full"
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
                {separations.last_page > 1 && (
                    <div className="p-4 border-t border-[#e8e8ed] bg-[#f5f5f7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[#6e6e73]">
                        <div>
                            Showing <strong>{separations.from || 0}</strong> to <strong>{separations.to || 0}</strong> of <strong>{separations.total}</strong> records
                        </div>
                        <div className="flex gap-1">
                            {separations.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveState
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                                        link.active
                                            ? 'bg-[#0066cc] text-white border-[#0066cc] font-bold'
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

            {/* Separation & Live Severance Calculator Modal (Shadcn Dialog) */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-xl bg-white border-[#d2d2d7] p-6 max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-black flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-[#0066cc]" />
                            Record Employee Separation
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#6e6e73]">
                            Calculates statutory severance per Ethiopian Labour Proclamation 1156/2019.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
                                Exiting Employee <span className="text-[#ff3b30]">*</span>
                            </label>
                            <Select value={String(data.employee_id)} onValueChange={(v) => setData('employee_id', v)}><SelectTrigger className="w-full h-11 rounded-xl border-[#d2d2d7] bg-[#f5f5f7] text-xs text-[#424245]"><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{activeEmployees.map((emp) => (<SelectItem key={emp.id} value={String(emp.id)}>{emp.file_no} â€” {emp.full_name}</SelectItem>))}</SelectContent></Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-black mb-1">
                                    Separation Type <span className="text-[#ff3b30]">*</span>
                                </label>
                                <Select value={data.separation_type} onValueChange={(v) => setData('separation_type', v)}><SelectTrigger className="w-full h-11 rounded-xl border-[#d2d2d7] bg-[#f5f5f7] text-xs text-[#424245]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Termination_Without_Cause">Termination Without Cause</SelectItem>
                                    <SelectItem value="Layoff">Workforce Layoff / Reduction</SelectItem>
                                    <SelectItem value="Retirement">Statutory Retirement (Age 60)</SelectItem>
                                    <SelectItem value="Resignation">Resignation</SelectItem>
                                    <SelectItem value="Termination_With_Cause">Termination With Cause (No Severance)</SelectItem>
                                    <SelectItem value="Probation_Failed">Probation Failed (No Severance)</SelectItem>
                                    <SelectItem value="Contract_Expired">Contract Expired</SelectItem>
                                </SelectContent></Select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-black mb-1">
                                    Effective Date <span className="text-[#ff3b30]">*</span>
                                </label>
                                <Input
                                    type="date"
                                    required
                                    value={data.effective_date}
                                    onChange={(e) => setData('effective_date', e.target.value)}
                                    className="bg-[#f5f5f7] border-[#d2d2d7] text-xs h-11"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
                                Exit Reason &amp; Reference Notes
                            </label>
                            <Textarea
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                                rows={2}
                                placeholder="Enter reference memo, board resolution or exit interview notes..."
                                className="w-full rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] p-2.5 text-xs text-[#424245] focus-visible:ring-[#0066cc]"
                            />
                        </div>

                        {/* Live Statutory Severance Pay Estimation Card */}
                        {previewCalc && (
                            <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7] space-y-2 text-xs">
                                <div className="flex justify-between items-center font-bold text-[#1d1d1f] border-b border-[#d2d2d7]/60 pb-1.5">
                                    <span className="flex items-center gap-1.5">
                                        <Calculator className="w-3.5 h-3.5" />
                                        Statutory Severance Pay Estimate (Arts. 39â€“41)
                                    </span>
                                    <span>{previewCalc.years_service} Years Service</span>
                                </div>
                                <div className="flex justify-between text-[#424245]">
                                    <span>Monthly Basic Wage:</span>
                                    <span className="font-semibold text-black">{formatCurrency(previewCalc.basic_salary)}</span>
                                </div>
                                <div className="flex justify-between text-[#424245]">
                                    <span>Year 1 Entitlement (1 Month):</span>
                                    <span>{formatCurrency(previewCalc.first_year_amount)}</span>
                                </div>
                                <div className="flex justify-between text-[#424245]">
                                    <span>Subsequent Years (1/3 Month/Yr):</span>
                                    <span>{formatCurrency(previewCalc.subsequent_amount)}</span>
                                </div>
                                <div className="flex justify-between text-[#424245]">
                                    <span>Legal Maximum Cap (12 Months):</span>
                                    <span>{formatCurrency(previewCalc.statutory_cap)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-[#d2d2d7] font-bold">
                                    <span className="text-[#1d1d1f] uppercase">Estimated Severance Payout:</span>
                                    <span className="text-[#0066cc] text-base">
                                        {formatCurrency(previewCalc.final_payout)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                            <Checkbox
                                id="severance_paid"
                                checked={data.severance_paid}
                                onCheckedChange={(checked) => setData('severance_paid', checked === true)}
                                className="rounded-xl border-[#d2d2d7] data-[state=checked]:bg-[#0066cc] data-[state=checked]:text-white"
                            />
                            <label htmlFor="severance_paid" className="text-xs text-black font-medium">
                                Severance payment has already been disbursed
                            </label>
                        </div>

                        <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-[#e8e8ed]">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowModal(false)}
                                className="text-xs border-[#d2d2d7] rounded-full"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium rounded-full"
                            >
                                {processing ? 'Processing...' : 'Confirm Separation'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Severance Payout Disbursement Confirmation Dialog */}
            <AlertDialog open={Boolean(payoutToMarkPaid)} onOpenChange={(open) => !open && setPayoutToMarkPaid(null)}>
                <AlertDialogContent className="bg-white border-[#d2d2d7]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-black flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-[#0066cc]" />
                            Disburse Severance Payout?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-[#6e6e73] space-y-2">
                            <p>
                                Are you sure you want to mark this severance payout as disbursed?
                            </p>
                            <p className="bg-[#f5f5f7] border border-[#d2d2d7] p-2.5 rounded-sm text-[#0066cc] font-medium text-[11px]">
                                This closes out the financial severance liability and marks the payment timestamp in the audit log.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="text-xs h-9 border-[#d2d2d7] hover:bg-[#f5f5f7] rounded-full">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmMarkPaid}
                            className="text-xs h-9 bg-[#0066cc] hover:bg-[#0071e3] text-white font-medium rounded-full"
                        >
                            Confirm Disbursement
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthenticatedLayout>
    );
}


