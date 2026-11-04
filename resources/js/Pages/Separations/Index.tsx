import { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
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
        if (confirm('Mark this severance payout as disbursed?')) {
            router.patch(route('separations.mark-paid', id));
        }
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
            subtitle="Manage personnel exits and automated statutory severance calculations per Ethiopian Labour Proclamation 1156/2019 (Arts. 39–41)."
        >
            <Head title="Separations & Severance - Elhadar Engineering HRMS" />

            {/* Filter and Action Bar */}
            <Card className="border-[#d8d9da] bg-white mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-[#64666a]" />
                                <Input
                                    placeholder="Search by name, file no..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleFilter({ search });
                                    }}
                                    className="pl-9 bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                />
                            </div>

                            <select
                                value={separationType}
                                onChange={(e) => {
                                    setSeparationType(e.target.value);
                                    handleFilter({ separation_type: e.target.value });
                                }}
                                className="h-10 rounded-xs border border-[#d8d9da] bg-[#f7f7f7] px-3 text-xs text-[#3d4045] focus:outline-none focus:ring-1 focus:ring-[#008254]"
                            >
                                <option value="">All Separation Types</option>
                                <option value="Resignation">Resignation</option>
                                <option value="Termination_Without_Cause">Termination Without Cause</option>
                                <option value="Termination_With_Cause">Termination With Cause</option>
                                <option value="Layoff">Workforce Layoff</option>
                                <option value="Retirement">Statutory Retirement</option>
                                <option value="Probation_Failed">Probation Failed</option>
                                <option value="Contract_Expired">Contract Expired</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <ViewToggle value={viewMode} onChange={setViewMode} />
                            <Button 
                                onClick={() => setShowModal(true)}
                                className="bg-[#008254] hover:bg-[#006642] text-white text-xs font-bold uppercase rounded-xs h-10 px-4 gap-2 shrink-0"
                            >
                                <Calculator className="w-4 h-4" />
                                Record Exit &amp; Estimate Severance
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Separations Table */}
            <Card className="border-[#d8d9da] bg-white overflow-hidden shadow-sm">
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
                                <TableCell colSpan={9} className="text-center py-12 text-[#64666a]">
                                    No employee separation records found matching your query.
                                </TableCell>
                            </TableRow>
                        ) : (
                            separations.data.map((item) => (
                                <TableRow key={item.id} className="hover:bg-[#effcf8]/50">
                                    <TableCell className="font-bold text-[#008254] text-xs">
                                        {item.employee.file_no}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-black text-sm">{item.employee.full_name}</div>
                                        <div className="text-xs text-[#64666a] truncate max-w-xs">{item.reason || 'No exit notes'}</div>
                                    </TableCell>
                                    <TableCell className="text-xs text-[#3d4045]">
                                        {item.employee.department?.name || 'Operations'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={
                                                item.separation_type.includes('Without_Cause') || item.separation_type === 'Layoff' ? 'destructive' :
                                                item.separation_type === 'Retirement' ? 'mint' : 'secondary'
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
                                        <Badge variant={item.severance_paid ? 'mint' : 'outline'}>
                                            {item.severance_paid ? 'Disbursed' : 'Unpaid / Accrued'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {!item.severance_paid && item.severance_amount > 0 && (
                                                <Button
                                                    onClick={() => handleMarkPaid(item.id)}
                                                    size="sm"
                                                    className="bg-[#008254] hover:bg-[#006642] text-white font-bold text-xs h-8 px-2.5 rounded-xs"
                                                >
                                                    Disburse
                                                </Button>
                                            )}
                                            <Link href={route('employees.show', item.employee.id)}>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="border-[#d8d9da] hover:bg-[#effcf8] text-[#008254] font-semibold text-xs h-8 px-2.5 rounded-xs"
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
                            <div className="col-span-full py-12 text-center text-xs text-[#64666a]">
                                No employee separation records found matching your query.
                            </div>
                        ) : (
                            separations.data.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-xs border border-[#ebebec] bg-[#f7f7f7] p-4 transition-colors hover:border-[#b7ecda] hover:bg-white"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-black">{item.employee.full_name}</p>
                                            <p className="text-[11px] font-semibold text-[#008254]">
                                                {item.employee.file_no} · {item.employee.department?.name || 'Operations'}
                                            </p>
                                        </div>
                                        <Badge variant={getSeparationVariant(item.separation_type)} className="shrink-0">
                                            {formatType(item.separation_type)}
                                        </Badge>
                                    </div>

                                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#ebebec] pt-3 text-center">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#64666a]">Service</p>
                                            <p className="text-sm font-bold text-black">{item.completed_years_service} Yrs</p>
                                        </div>
                                        <div className="border-x border-[#ebebec]">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#64666a]">Effective</p>
                                            <p className="text-[11px] font-bold text-[#3d4045]">{item.effective_date}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#64666a]">Payout</p>
                                            <p className="text-[11px] font-bold text-black">
                                                {item.severance_amount > 0 ? formatCurrency(item.severance_amount) : '0.00'}
                                            </p>
                                        </div>
                                    </div>

                                    {item.reason && (
                                        <p className="mt-2 line-clamp-2 text-[11px] text-[#64666a]">{item.reason}</p>
                                    )}

                                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#ebebec] pt-3">
                                        <Badge variant={item.severance_paid ? 'mint' : 'outline'}>
                                            {item.severance_paid ? 'Disbursed' : 'Unpaid / Accrued'}
                                        </Badge>
                                    </div>

                                    <div className="mt-2 flex gap-2">
                                        {!item.severance_paid && item.severance_amount > 0 && (
                                            <Button
                                                onClick={() => handleMarkPaid(item.id)}
                                                size="sm"
                                                className="flex-1 bg-[#008254] hover:bg-[#006642] text-white font-bold text-xs h-8 rounded-xs"
                                            >
                                                Disburse
                                            </Button>
                                        )}
                                        <Link href={route('employees.show', item.employee.id)} className="flex-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full border-[#d8d9da] hover:bg-[#effcf8] text-[#008254] font-semibold text-xs h-8 gap-1.5 rounded-xs"
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
                    <div className="p-4 border-t border-[#ebebec] bg-[#f7f7f7] flex items-center justify-between text-xs text-[#64666a]">
                        <div>
                            Showing <strong>{separations.from || 0}</strong> to <strong>{separations.to || 0}</strong> of <strong>{separations.total}</strong> records
                        </div>
                        <div className="flex gap-1">
                            {separations.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveState
                                    className={`px-3 py-1.5 rounded-xs text-xs font-medium border transition-colors ${
                                        link.active
                                            ? 'bg-[#008254] text-white border-[#008254] font-bold'
                                            : link.url
                                            ? 'bg-white text-[#3d4045] border-[#d8d9da] hover:bg-[#effcf8]'
                                            : 'bg-white/50 text-[#b1b3b5] border-[#ebebec] cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Separation & Live Severance Calculator Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-lg border border-[#d8d9da] shadow-lg max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-base font-bold text-black">Record Employee Separation</h3>
                                <p className="text-xs text-[#64666a]">
                                    Calculates statutory severance per Ethiopian Labour Proclamation 1156/2019.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="text-[#64666a] hover:text-black text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-black mb-1">
                                    Exiting Employee <span className="text-[#de2828]">*</span>
                                </label>
                                <select
                                    required
                                    value={data.employee_id}
                                    onChange={(e) => setData('employee_id', e.target.value)}
                                    className="w-full h-10 rounded-xs border border-[#d8d9da] bg-[#f7f7f7] px-3 text-xs text-[#3d4045] focus:outline-none focus:ring-1 focus:ring-[#008254]"
                                >
                                    {activeEmployees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.file_no} — {emp.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Separation Type <span className="text-[#de2828]">*</span>
                                    </label>
                                    <select
                                        required
                                        value={data.separation_type}
                                        onChange={(e) => setData('separation_type', e.target.value)}
                                        className="w-full h-10 rounded-xs border border-[#d8d9da] bg-[#f7f7f7] px-3 text-xs text-[#3d4045] focus:outline-none focus:ring-1 focus:ring-[#008254]"
                                    >
                                        <option value="Termination_Without_Cause">Termination Without Cause</option>
                                        <option value="Layoff">Workforce Layoff / Reduction</option>
                                        <option value="Retirement">Statutory Retirement (Age 60)</option>
                                        <option value="Resignation">Resignation</option>
                                        <option value="Termination_With_Cause">Termination With Cause (No Severance)</option>
                                        <option value="Probation_Failed">Probation Failed (No Severance)</option>
                                        <option value="Contract_Expired">Contract Expired</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Effective Date <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        required
                                        value={data.effective_date}
                                        onChange={(e) => setData('effective_date', e.target.value)}
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-black mb-1">
                                    Exit Reason &amp; Reference Notes
                                </label>
                                <textarea
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    rows={2}
                                    placeholder="Enter reference memo, board resolution or exit interview notes..."
                                    className="w-full rounded-xs border border-[#d8d9da] bg-[#f7f7f7] p-2.5 text-xs text-[#3d4045] focus:outline-none focus:ring-1 focus:ring-[#008254]"
                                />
                            </div>

                            {/* Live Statutory Severance Pay Estimation Card */}
                            {previewCalc && (
                                <div className="p-4 rounded-xs bg-[#effcf8] border border-[#b7ecda] space-y-2 text-xs">
                                    <div className="flex justify-between items-center font-bold text-[#00482f] border-b border-[#b7ecda]/60 pb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <Calculator className="w-3.5 h-3.5" />
                                            Statutory Severance Pay Estimate (Arts. 39–41)
                                        </span>
                                        <span>{previewCalc.years_service} Years Service</span>
                                    </div>
                                    <div className="flex justify-between text-[#3d4045]">
                                        <span>Monthly Basic Wage:</span>
                                        <span className="font-semibold text-black">{formatCurrency(previewCalc.basic_salary)}</span>
                                    </div>
                                    <div className="flex justify-between text-[#3d4045]">
                                        <span>Year 1 Entitlement (1 Month):</span>
                                        <span>{formatCurrency(previewCalc.first_year_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-[#3d4045]">
                                        <span>Subsequent Years (1/3 Month/Yr):</span>
                                        <span>{formatCurrency(previewCalc.subsequent_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-[#3d4045]">
                                        <span>Legal Maximum Cap (12 Months):</span>
                                        <span>{formatCurrency(previewCalc.statutory_cap)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-[#b7ecda] font-bold">
                                        <span className="text-[#00482f] uppercase">Estimated Severance Payout:</span>
                                        <span className="text-[#008254] text-base">
                                            {formatCurrency(previewCalc.final_payout)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="severance_paid"
                                    checked={data.severance_paid}
                                    onChange={(e) => setData('severance_paid', e.target.checked)}
                                    className="rounded-xs border-[#d8d9da] text-[#008254] focus:ring-[#008254]"
                                />
                                <label htmlFor="severance_paid" className="text-xs text-black font-medium">
                                    Severance payment has already been disbursed
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-[#ebebec]">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowModal(false)}
                                    className="text-xs border-[#d8d9da] rounded-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[#008254] hover:bg-[#006642] text-white text-xs font-bold uppercase rounded-xs"
                                >
                                    {processing ? 'Processing...' : 'Confirm Separation'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
