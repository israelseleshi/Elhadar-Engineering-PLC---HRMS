import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import EmployeeAvatar from '@/Components/EmployeeAvatar';
import ViewToggle, { useViewMode } from '@/Components/ViewToggle';
import { formatDate } from '@/lib/utils';
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
    Users,
    MapPin,
    Eye,
    Search,
    CheckCircle2,
    Briefcase,
    Calendar,
    X
} from 'lucide-react';

interface NewHireItem {
    id: number;
    file_no: string;
    full_name: string;
    gender: 'Male' | 'Female';
    position: string;
    work_place: string;
    status: 'Permanent' | 'Contract' | 'Probation' | 'Separated';
    employment_date_ec: string;
    employment_date: string;
    days_since_joining: number;
    profile_photo_url?: string | null;
    department?: {
        id: number;
        name: string;
    };
    current_salary?: {
        basic_salary: number;
        total_salary: number;
    };
}

interface Props {
    newHires: {
        data: NewHireItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search?: string;
        department_id?: string;
        work_place?: string;
        status?: string;
    };
    stats: {
        total_new_hires: number;
        probation_count: number;
        permanent_count: number;
        contract_count: number;
        separated_count: number;
        head_office_count: number;
        project_count: number;
        joined_this_month: number;
        departments_represented: number;
    };
    departments: { id: number; name: string }[];
    workplaces?: string[];
    cutoff: string;
}

export default function Index({ newHires, filters, stats, departments, workplaces = [], cutoff }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [departmentId, setDepartmentId] = useState(filters.department_id || '');
    const [workPlace, setWorkPlace] = useState(filters.work_place || '');
    const [status, setStatus] = useState(filters.status || '');
    const [viewMode, setViewMode] = useViewMode('new-employees');

    const handleFilter = (updates: Record<string, string>) => {
        router.get(
            route('new-employees.index'),
            {
                search,
                department_id: departmentId,
                work_place: workPlace,
                status,
                ...updates,
            },
            { preserveState: true, replace: true }
        );
    };

    const clearFilters = () => {
        setSearch('');
        setDepartmentId('');
        setWorkPlace('');
        setStatus('');
        router.get(route('new-employees.index'), {}, { preserveState: false, replace: true });
    };

    const hasActiveFilters = Boolean(search || departmentId || workPlace || status);

    const formatCurrency = (amount?: number) => {
        if (!amount || amount <= 0) return 'â€”';
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatTenure = (days: number) => {
        if (days < 1) return 'Today';
        if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;
        const months = Math.floor(days / 30);
        const remainder = days % 30;
        return remainder > 0 ? `${months}m ${remainder}d` : `${months} month${months === 1 ? '' : 's'}`;
    };

    const getStatusBadge = (empStatus: string) => {
        switch (empStatus) {
            case 'Permanent':
                return <Badge className="gap-1 font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> Permanent</Badge>;
            case 'Contract':
                return <Badge variant="secondary">Contract</Badge>;
            case 'Probation':
                return <Badge className="font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20">Under Probation</Badge>;
            case 'Separated':
                return <Badge variant="destructive">Separated</Badge>;
            default:
                return <Badge variant="outline">{empStatus}</Badge>;
        }
    };

    return (
        <AuthenticatedLayout
            title="New Employees"
            subtitle={`Onboarding roster of personnel hired on or after ${formatDate(cutoff)}.${stats.joined_this_month > 0 ? ` ${stats.joined_this_month} joined this month.` : ''}`}
        >
            <Head title="New Employees - Elhadar Engineering HRMS" />

            {/* Quick Actions & Header Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                        Cutoff: Hamle 1, 2018 E.C.
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {hasActiveFilters && (
                        <Button
                            type="button"
                            onClick={clearFilters}
                            variant="outline"
                            size="sm"
                            className="border-border bg-card text-foreground hover:bg-muted font-medium text-xs gap-1.5 rounded-md"
                        >
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Clear Filters</span>
                        </Button>
                    )}
                    <Link href={route('employees.index')}>
                        <Button size="sm" variant="outline" className="border-border bg-card text-foreground hover:bg-muted font-medium text-xs gap-1.5 rounded-md">
                            <Users className="w-3.5 h-3.5 text-primary" />
                            <span>Full Staff Directory</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Lifecycle Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                {[
                    { label: 'All New Hires', val: '', count: stats.total_new_hires },
                    { label: 'Probation', val: 'Probation', count: stats.probation_count },
                    { label: 'Permanent', val: 'Permanent', count: stats.permanent_count },
                    { label: 'Contracts', val: 'Contract', count: stats.contract_count },
                    { label: 'Separated', val: 'Separated', count: stats.separated_count },
                ].map((tab) => {
                    const isActive = (status || '') === tab.val;
                    return (
                        <button
                            key={tab.label}
                            type="button"
                            onClick={() => {
                                setStatus(tab.val);
                                handleFilter({ status: tab.val });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                                isActive
                                    ? 'bg-primary text-white border-[#0066cc] shadow-sm'
                                    : 'bg-white text-foreground/90 border-border bg-card hover:bg-muted hover:text-primary'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isActive ? 'bg-white/20 text-white' : 'bg-muted/40 text-primary'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}

                <div className="ml-auto">
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                </div>
            </div>

            {/* Filter and Search Bar */}
            <Card className="border-border bg-card shadow-xs mb-6">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                        <div className="relative md:col-span-1">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input
                                placeholder="Search name, file no, phone, position..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleFilter({ search });
                                }}
                                className="pl-9 bg-background border-input text-foreground text-xs h-10"
                            />
                        </div>

                        <div>
                            <Select value={departmentId || '__all__'} onValueChange={(v) => { const next=v==='__all__'?'':v; setDepartmentId(next); handleFilter({ department_id: next }); }}><SelectTrigger className="w-full h-10 rounded-xl border-input bg-background text-foreground text-xs text-foreground/90"><SelectValue placeholder={`All Departments (${departments.length})`} /></SelectTrigger><SelectContent><SelectItem value="__all__">All Departments ({departments.length})</SelectItem>{departments.map((d) => (<SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>))}</SelectContent></Select>
                        </div>

                        <div>
                            <Select value={workPlace || '__all__'} onValueChange={(v) => { const next=v==='__all__'?'':v; setWorkPlace(next); handleFilter({ work_place: next }); }}><SelectTrigger className="w-full h-10 rounded-xl border-input bg-background text-foreground text-xs text-foreground/90"><SelectValue placeholder="All Workplaces" /></SelectTrigger><SelectContent><SelectItem value="__all__">All Workplaces ({workplaces.length > 0 ? workplaces.length : 'All'})</SelectItem><SelectItem value="H.O">Head Office (H.O)</SelectItem><SelectItem value="Project">All Project Sites</SelectItem>{workplaces.filter(w => w !== 'H.O' && w !== 'Head Office').map((w) => (<SelectItem key={w} value={w}>{w}</SelectItem>))}</SelectContent></Select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Select value={status || '__all__'} onValueChange={(v) => { const next = v === '__all__' ? '' : v; setStatus(next); handleFilter({ status: next }); }}>
                                <SelectTrigger className="w-full h-10 rounded-xl border-input bg-background text-foreground text-xs text-foreground/90"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Statuses</SelectItem>
                                    <SelectItem value="Permanent">Permanent</SelectItem>
                                    <SelectItem value="Contract">Contract</SelectItem>
                                    <SelectItem value="Probation">Probation</SelectItem>
                                    <SelectItem value="Separated">Separated</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={() => handleFilter({ search })}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs h-10 px-4 text-xs font-bold uppercase rounded-xl"
                            >
                                Filter
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* New Hires Table */}
            <Card className="border-border bg-card shadow-xs overflow-hidden shadow-sm">
                {viewMode === 'table' ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-14 text-center">Photo</TableHead>
                            <TableHead className="w-24">File no</TableHead>
                            <TableHead>Staff name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Work place</TableHead>
                            <TableHead>Joined (G.C)</TableHead>
                            <TableHead>Joined (E.C)</TableHead>
                            <TableHead className="text-center">Tenure</TableHead>
                            <TableHead className="text-right">Total salary</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {newHires.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                                    No new employees found on or after {formatDate(cutoff)} matching your filter criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            newHires.data.map((emp) => (
                                <TableRow key={emp.id} className="hover:bg-muted/40/50">
                                    <TableCell className="w-14 text-center py-2.5">
                                        <EmployeeAvatar name={emp.full_name} src={emp.profile_photo_url} size="sm" className="mx-auto" />
                                    </TableCell>
                                    <TableCell className="font-bold text-primary text-xs">
                                        {emp.file_no}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">{emp.full_name}</div>
                                            <div className="text-xs text-muted-foreground">{emp.gender}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-foreground/90">
                                        {emp.department?.name || 'General Operations'}
                                    </TableCell>
                                    <TableCell className="text-xs font-medium text-foreground">
                                        {emp.position}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                            emp.work_place === 'Project' ? 'text-primary' : 'text-foreground/90'
                                        }`}>
                                            <MapPin className="w-3 h-3" />
                                            {emp.work_place}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs font-semibold text-foreground">
                                        {formatDate(emp.employment_date)}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {emp.employment_date_ec}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-xl bg-muted/40 text-primary border border-border font-bold text-[11px] whitespace-nowrap">
                                            {formatTenure(emp.days_since_joining)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-foreground text-sm">
                                        {formatCurrency(emp.current_salary?.total_salary || emp.current_salary?.basic_salary)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(emp.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={route('employees.show', emp.id)}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-border bg-card hover:bg-muted text-primary font-semibold text-xs h-8 gap-1.5 rounded-xl"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>View Profile</span>
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                ) : (
                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                        {newHires.data.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
                                No new employees found on or after {formatDate(cutoff)} matching your filter criteria.
                            </div>
                        ) : (
                            newHires.data.map((emp) => (
                                <div
                                    key={emp.id}
                                    className="rounded-xl border border-border/60 bg-muted/40 p-4 transition-colors hover:border-border hover:bg-white"
                                >
                                    <div className="flex items-start gap-3">
                                        <EmployeeAvatar name={emp.full_name} src={emp.profile_photo_url} size="md" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-foreground">{emp.full_name}</p>
                                            <p className="text-[11px] font-semibold text-primary">
                                                {emp.file_no} Â· {emp.gender}
                                            </p>
                                            <p className="mt-1.5 truncate text-xs font-medium text-foreground/90">{emp.position}</p>
                                            <p className="truncate text-[11px] text-muted-foreground">
                                                {emp.department?.name || 'General Operations'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {emp.work_place}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(emp.employment_date)}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Briefcase className="h-3 w-3" />
                                            {formatTenure(emp.days_since_joining)}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                                        {getStatusBadge(emp.status)}
                                        <span className="text-xs font-bold text-foreground">
                                            {formatCurrency(emp.current_salary?.total_salary || emp.current_salary?.basic_salary)}
                                        </span>
                                    </div>

                                    <Link href={route('employees.show', emp.id)} className="mt-3 block">
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
                            ))
                        )}
                    </div>
                )}

                {/* Pagination */}
                {newHires.last_page > 1 && (
                    <div className="p-4 border-t border-border/60 bg-muted/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
                        <div>
                            Showing <strong>{newHires.from || 0}</strong> to <strong>{newHires.to || 0}</strong> of <strong>{newHires.total}</strong> new hires
                        </div>
                        <div className="flex gap-1">
                            {newHires.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveState
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                                        link.active
                                            ? 'bg-primary text-white border-[#0066cc] font-bold'
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

            {/* Cutoff Notice */}
            <div className="mt-4 flex items-start gap-2 text-[11px] text-muted-foreground">
                <Briefcase className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <p>
                    This roster is scoped to employees whose employment date is on or after{' '}
                    <strong className="text-foreground/90">{formatDate(cutoff)}</strong> (Hamle 1, 2018 E.C.).
                    Change the cutoff from <strong className="text-foreground/90">Statutory Settings</strong> by
                    editing the <code className="px-1 py-0.5 bg-muted/40 border border-border/60 rounded-xl">new_hire_cutoff_date</code> parameter.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}


