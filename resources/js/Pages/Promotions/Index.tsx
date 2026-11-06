import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import ViewToggle, { useViewMode } from '@/Components/ViewToggle';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/Components/ui/table';
import { 
    ArrowRight, 
    Search, 
    Eye, 
    Plus
} from 'lucide-react';

interface PromotionItem {
    id: number;
    promotion_date: string;
    promotion_date_ec: string;
    previous_position: string;
    previous_grade?: string;
    previous_basic_salary: number;
    previous_total_salary: number;
    new_position: string;
    new_grade?: string;
    new_basic_salary: number;
    new_total_salary: number;
    remarks?: string;
    employee: {
        id: number;
        file_no: string;
        full_name: string;
        department?: { name: string };
    };
}

interface ActiveEmployee {
    id: number;
    file_no: string;
    full_name: string;
    position: string;
    grade?: string;
    current_salary?: { basic_salary: number; total_salary: number };
}

interface Props {
    promotions: {
        data: PromotionItem[];
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
        total_promotions: number;
        promotions_this_year: number;
        average_wage_hike: number;
    };
    activeEmployees: ActiveEmployee[];
}

export default function Index({ promotions, filters, stats, activeEmployees }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [viewMode, setViewMode] = useViewMode('promotions');
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        employee_id: activeEmployees.length > 0 ? String(activeEmployees[0].id) : '',
        promotion_date: new Date().toISOString().split('T')[0],
        promotion_date_ec: '',
        new_position: '',
        new_grade: '',
        new_basic_salary: '',
        new_total_salary: '',
        remarks: '',
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
            route('promotions.index'),
            {
                search,
                ...updates,
            },
            { preserveState: true, replace: true }
        );
    };

    const selectedEmployeeObj = activeEmployees.find(e => String(e.id) === data.employee_id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('promotions.store'), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            title="Internal Career Progression & Promotions"
            subtitle="Track salary scale advancements, position adjustments, and historical compensation milestones across the workforce."
        >
            <Head title="Promotions & Career Ledger - Elhadar Engineering HRMS" />

            {/* Filter and Action Bar */}
            <Card className="border-border bg-card shadow-xs mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input
                                placeholder="Search by staff name, title..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleFilter({ search });
                                }}
                                className="pl-9 bg-background border-input text-foreground text-xs h-10"
                            />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <ViewToggle value={viewMode} onChange={setViewMode} />
                            <Button 
                                onClick={() => setShowModal(true)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs text-xs font-medium rounded-full h-10 px-4 gap-2 shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                                Record Career Promotion
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Promotions Table */}
            <Card className="border-border bg-card shadow-xs overflow-hidden shadow-sm">
                {viewMode === 'table' ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24">File no</TableHead>
                            <TableHead>Staff name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Career transition</TableHead>
                            <TableHead>Salary adjustment</TableHead>
                            <TableHead className="text-center">Wage hike</TableHead>
                            <TableHead>Effective date (E.C)</TableHead>
                            <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {promotions.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                    No promotional records found matching your filter criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            promotions.data.map((item) => {
                                const diff = item.new_basic_salary - item.previous_basic_salary;
                                return (
                                    <TableRow key={item.id} className="hover:bg-muted/40/50">
                                        <TableCell className="font-bold text-primary text-xs">
                                            {item.employee.file_no}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold text-foreground text-sm">{item.employee.full_name}</div>
                                            <div className="text-xs text-muted-foreground truncate max-w-xs">{item.remarks || 'Standard promotion'}</div>
                                        </TableCell>
                                        <TableCell className="text-xs text-foreground/90">
                                            {item.employee.department?.name || 'Operations'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span className="text-muted-foreground line-through">{item.previous_position}</span>
                                                <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                                                <span className="font-bold text-foreground">{item.new_position}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs">
                                                <span className="text-muted-foreground">{formatCurrency(item.previous_basic_salary)}</span>
                                                <span className="mx-1 text-muted-foreground">â†’</span>
                                                <span className="font-bold text-primary">{formatCurrency(item.new_basic_salary)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-xl bg-muted/40 text-primary border border-border font-bold text-xs">
                                                +{formatCurrency(diff)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs font-semibold text-foreground">
                                            {item.promotion_date_ec}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={route('employees.show', item.employee.id)}>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="border-border bg-card hover:bg-muted text-primary font-semibold text-xs h-8 px-2.5 rounded-xl"
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                                    Profile
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                ) : (
                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                        {promotions.data.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
                                No promotional records found matching your filter criteria.
                            </div>
                        ) : (
                            promotions.data.map((item) => {
                                const diff = item.new_basic_salary - item.previous_basic_salary;

                                return (
                                    <div
                                        key={item.id}
                                        className="rounded-xl border border-border/60 bg-muted/40 p-4 transition-colors hover:border-border hover:bg-white"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-foreground">{item.employee.full_name}</p>
                                                <p className="text-[11px] font-semibold text-primary">
                                                    {item.employee.file_no} Â· {item.employee.department?.name || 'Operations'}
                                                </p>
                                            </div>
                                            <span className="inline-flex shrink-0 items-center rounded-xl border border-input bg-background text-foreground px-2 py-0.5 text-[11px] font-bold text-primary">
                                                +{formatCurrency(diff)}
                                            </span>
                                        </div>

                                        <div className="mt-3 rounded-xl border border-border/60 bg-white p-2.5 text-[11px]">
                                            <div className="flex items-center gap-1.5">
                                                <span className="truncate text-muted-foreground line-through">{item.previous_position}</span>
                                                <ArrowRight className="h-3 w-3 shrink-0 text-primary" />
                                                <span className="truncate font-bold text-foreground">{item.new_position}</span>
                                            </div>
                                            <div className="mt-1.5 flex items-center justify-between gap-2">
                                                <span className="text-muted-foreground">{formatCurrency(item.previous_basic_salary)}</span>
                                                <span className="font-bold text-primary">{formatCurrency(item.new_basic_salary)}</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                                            <span>Effective: <strong className="text-foreground/90">{item.promotion_date_ec}</strong> E.C.</span>
                                            {item.new_grade && <span className="truncate">Grade: {item.new_grade}</span>}
                                        </div>

                                        {item.remarks && (
                                            <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">{item.remarks}</p>
                                        )}

                                        <Link href={route('employees.show', item.employee.id)} className="mt-3 block">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full border-border bg-card hover:bg-muted text-primary font-semibold text-xs h-8 gap-1.5 rounded-xl"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                View Profile
                                            </Button>
                                        </Link>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Pagination */}
                {promotions.last_page > 1 && (
                    <div className="p-4 border-t border-border/60 bg-muted/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
                        <div>
                            Showing <strong>{promotions.from || 0}</strong> to <strong>{promotions.to || 0}</strong> of <strong>{promotions.total}</strong> promotions
                        </div>
                        <div className="flex gap-1">
                            {promotions.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveState
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                        link.active
                                            ? 'bg-primary text-white border-[#0066cc] font-semibold rounded-full'
                                            : link.url
                                            ? 'bg-white text-foreground/90 border-border bg-card hover:bg-muted'
                                            : 'bg-white/50 text-muted-foreground/60 border-border/60 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Record Promotion Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-lg border border-border shadow-lg max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-base font-bold text-foreground">Record Career Promotion</h3>
                                <p className="text-xs text-muted-foreground">
                                    Promote an active employee, update salary scale, and maintain an immutable audit trail.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="text-muted-foreground hover:text-foreground text-sm font-bold"
                            >
                                âœ•
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1">
                                    Promoted Employee <span className="text-[#de2828]">*</span>
                                </label>
                                <Select value={String(data.employee_id)} onValueChange={(v) => { setData('employee_id', v); const found = activeEmployees.find(emp => String(emp.id) === v); if (found?.current_salary) { setData(prev => ({ ...prev, employee_id: v, new_basic_salary: String(found.current_salary?.basic_salary ? found.current_salary.basic_salary + 2000 : ''), })); } }}><SelectTrigger className="w-full h-10 rounded-xl border-input bg-background text-foreground text-xs text-foreground/90"><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{activeEmployees.map((emp) => (<SelectItem key={emp.id} value={String(emp.id)}>{emp.file_no} â€” {emp.full_name} ({emp.position})</SelectItem>))}</SelectContent></Select>
                            </div>

                            {selectedEmployeeObj && (
                                <div className="p-3 bg-muted/40 border border-border/60 rounded-xl text-xs flex justify-between">
                                    <span className="text-muted-foreground">Current Role: <strong>{selectedEmployeeObj.position}</strong></span>
                                    <span className="text-primary font-bold">
                                        Current Basic: {formatCurrency(selectedEmployeeObj.current_salary?.basic_salary || 0)}
                                    </span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        New Position Title <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Input
                                        required
                                        value={data.new_position}
                                        onChange={(e) => setData('new_position', e.target.value)}
                                        placeholder="e.g. Senior Project Manager"
                                        className="bg-background border-input text-foreground text-xs h-10"
                                    />
                                    {errors.new_position && (
                                        <p className="text-xs text-[#de2828] mt-1">{errors.new_position}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        New Salary Grade
                                    </label>
                                    <Input
                                        value={data.new_grade}
                                        onChange={(e) => setData('new_grade', e.target.value)}
                                        placeholder="e.g. Grade VIII / Step 2"
                                        className="bg-background border-input text-foreground text-xs h-10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        New Monthly Basic Salary (ETB) <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={data.new_basic_salary}
                                        onChange={(e) => setData('new_basic_salary', e.target.value)}
                                        placeholder="35000.00"
                                        className="bg-background border-input text-foreground text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        New Gross Total Salary (Optional)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.new_total_salary}
                                        onChange={(e) => setData('new_total_salary', e.target.value)}
                                        placeholder="Leave empty to use basic"
                                        className="bg-background border-input text-foreground text-xs h-10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        Effective Date (Gregorian) <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        required
                                        value={data.promotion_date}
                                        onChange={(e) => setData('promotion_date', e.target.value)}
                                        className="bg-background border-input text-foreground text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        Effective Date (Ethiopian E.C)
                                    </label>
                                    <Input
                                        value={data.promotion_date_ec}
                                        onChange={(e) => setData('promotion_date_ec', e.target.value)}
                                        placeholder="e.g. 20/02/2018 (Auto-calculated if blank)"
                                        className="bg-background border-input text-foreground text-xs h-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1">
                                    Promotional Remarks / Executive Resolution
                                </label>
                                <Textarea
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    rows={2}
                                    placeholder="Approved during Q3 performance appraisal review..."
                                    className="w-full rounded-xl border border-input bg-background text-foreground p-2.5 text-xs text-foreground/90 focus-visible:ring-[#0066cc]"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowModal(false)}
                                    className="text-xs border-border rounded-full"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs text-xs font-medium rounded-full"
                                >
                                    {processing ? 'Registering...' : 'Confirm Promotion'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}


