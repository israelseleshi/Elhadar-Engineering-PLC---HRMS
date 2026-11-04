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
        if (!amount || amount <= 0) return '—';
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
                return <Badge variant="mint" className="gap-1 font-bold"><CheckCircle2 className="w-3 h-3 text-[#008254]" /> Permanent</Badge>;
            case 'Contract':
                return <Badge variant="secondary">Contract</Badge>;
            case 'Probation':
                return <Badge variant="lime">Under Probation</Badge>;
            case 'Separated':
                return <Badge variant="destructive">Separated</Badge>;
            default:
                return <Badge variant="outline">{empStatus}</Badge>;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">New Employees</h2>
                            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-xs bg-[#ddfa88] text-[#00482f] text-[11px] font-bold uppercase tracking-wide">
                                Hamle 1, 2018 E.C.
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-[#e3faf2] font-light max-w-2xl">
                            Onboarding roster of everyone hired on or after {formatDate(cutoff)}.
                            {stats.joined_this_month > 0 && ` ${stats.joined_this_month} joined this month.`}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {hasActiveFilters && (
                            <Button
                                type="button"
                                onClick={clearFilters}
                                variant="outline"
                                className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/25 gap-1.5 rounded-xs"
                            >
                                <X className="w-3.5 h-3.5 text-[#ddfa88]" />
                                <span>Clear Filters</span>
                            </Button>
                        )}
                        <Link href={route('employees.index')}>
                            <Button className="bg-[#ddfa88] hover:bg-[#cbf458] text-[#00482f] font-bold text-xs gap-1.5 rounded-xs shadow-sm">
                                <Users className="w-3.5 h-3.5" />
                                <span>Full Staff Directory</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="New Employees - Elhadar Engineering HRMS" />

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
                            className={`px-3 py-1.5 rounded-xs text-xs font-semibold flex items-center gap-2 transition-all border ${
                                isActive
                                    ? 'bg-[#008254] text-white border-[#008254] shadow-xs'
                                    : 'bg-white text-[#3d4045] border-[#d8d9da] hover:bg-[#effcf8] hover:text-[#008254]'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isActive ? 'bg-white/20 text-white' : 'bg-[#effcf8] text-[#008254]'
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
            <Card className="border-[#d8d9da] bg-white mb-6">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                        <div className="relative md:col-span-1">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-[#64666a]" />
                            <Input
                                placeholder="Search name, file no, phone, position..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleFilter({ search });
                                }}
                                className="pl-9 bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                            />
                        </div>

                        <div>
                            <select
                                value={departmentId}
                                onChange={(e) => {
                                    setDepartmentId(e.target.value);
                                    handleFilter({ department_id: e.target.value });
                                }}
                                className="w-full h-10 rounded-xs border border-[#d8d9da] bg-[#f7f7f7] px-3 text-xs text-[#3d4045] focus:outline-none focus:ring-1 focus:ring-[#008254]"
                            >
                                <option value="">All Departments ({departments.length})</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={workPlace}
                                onChange={(e) => {
                                    setWorkPlace(e.target.value);
                                    handleFilter({ work_place: e.target.value });
                                }}
                                className="w-full h-10 rounded-xs border border-[#d8d9da] bg-[#f7f7f7] px-3 text-xs text-[#3d4045] focus:outline-none focus:ring-1 focus:ring-[#008254]"
                            >
                                <option value="">All Workplaces ({workplaces.length > 0 ? workplaces.length : 'All'})</option>
                                <option value="H.O">Head Office (H.O)</option>
                                <option value="Project">All Project Sites</option>
                                {workplaces.filter(w => w !== 'H.O' && w !== 'Head Office').map((w) => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    handleFilter({ status: e.target.value });
                                }}
                                className="w-full h-10 rounded-xs border border-[#d8d9da] bg-[#f7f7f7] px-3 text-xs text-[#3d4045] focus:outline-none focus:ring-1 focus:ring-[#008254]"
                            >
                                <option value="">All Statuses</option>
                                <option value="Permanent">Permanent</option>
                                <option value="Contract">Contract</option>
                                <option value="Probation">Probation</option>
                                <option value="Separated">Separated</option>
                            </select>

                            <Button
                                onClick={() => handleFilter({ search })}
                                className="bg-[#008254] hover:bg-[#006642] text-white h-10 px-4 text-xs font-bold uppercase rounded-xs"
                            >
                                Filter
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* New Hires Table */}
            <Card className="border-[#d8d9da] bg-white overflow-hidden shadow-sm">
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
                                <TableCell colSpan={12} className="text-center py-12 text-[#64666a]">
                                    No new employees found on or after {formatDate(cutoff)} matching your filter criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            newHires.data.map((emp) => (
                                <TableRow key={emp.id} className="hover:bg-[#effcf8]/50">
                                    <TableCell className="w-14 text-center py-2.5">
                                        <EmployeeAvatar name={emp.full_name} src={emp.profile_photo_url} size="sm" className="mx-auto" />
                                    </TableCell>
                                    <TableCell className="font-bold text-[#008254] text-xs">
                                        {emp.file_no}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-bold text-black text-sm">{emp.full_name}</div>
                                            <div className="text-xs text-[#64666a]">{emp.gender}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-[#3d4045]">
                                        {emp.department?.name || 'General Operations'}
                                    </TableCell>
                                    <TableCell className="text-xs font-medium text-black">
                                        {emp.position}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                            emp.work_place === 'Project' ? 'text-[#008254]' : 'text-[#3d4045]'
                                        }`}>
                                            <MapPin className="w-3 h-3" />
                                            {emp.work_place}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs font-semibold text-black">
                                        {formatDate(emp.employment_date)}
                                    </TableCell>
                                    <TableCell className="text-xs text-[#64666a]">
                                        {emp.employment_date_ec}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-xs bg-[#effcf8] text-[#008254] border border-[#b7ecda] font-bold text-[11px] whitespace-nowrap">
                                            {formatTenure(emp.days_since_joining)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-black text-sm">
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
                                                className="border-[#d8d9da] hover:bg-[#effcf8] text-[#008254] font-semibold text-xs h-8 gap-1.5 rounded-xs"
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
                            <div className="col-span-full py-12 text-center text-xs text-[#64666a]">
                                No new employees found on or after {formatDate(cutoff)} matching your filter criteria.
                            </div>
                        ) : (
                            newHires.data.map((emp) => (
                                <div
                                    key={emp.id}
                                    className="rounded-xs border border-[#ebebec] bg-[#f7f7f7] p-4 transition-colors hover:border-[#b7ecda] hover:bg-white"
                                >
                                    <div className="flex items-start gap-3">
                                        <EmployeeAvatar name={emp.full_name} src={emp.profile_photo_url} size="md" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-black">{emp.full_name}</p>
                                            <p className="text-[11px] font-semibold text-[#008254]">
                                                {emp.file_no} · {emp.gender}
                                            </p>
                                            <p className="mt-1.5 truncate text-xs font-medium text-[#3d4045]">{emp.position}</p>
                                            <p className="truncate text-[11px] text-[#64666a]">
                                                {emp.department?.name || 'General Operations'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#64666a]">
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

                                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#ebebec] pt-3">
                                        {getStatusBadge(emp.status)}
                                        <span className="text-xs font-bold text-black">
                                            {formatCurrency(emp.current_salary?.total_salary || emp.current_salary?.basic_salary)}
                                        </span>
                                    </div>

                                    <Link href={route('employees.show', emp.id)} className="mt-3 block">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-[#d8d9da] hover:bg-[#effcf8] text-[#008254] font-semibold text-xs h-8 gap-1.5 rounded-xs"
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
                    <div className="p-4 border-t border-[#ebebec] bg-[#f7f7f7] flex items-center justify-between text-xs text-[#64666a]">
                        <div>
                            Showing <strong>{newHires.from || 0}</strong> to <strong>{newHires.to || 0}</strong> of <strong>{newHires.total}</strong> new hires
                        </div>
                        <div className="flex gap-1">
                            {newHires.links.map((link, idx) => (
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

            {/* Cutoff Notice */}
            <div className="mt-4 flex items-start gap-2 text-[11px] text-[#64666a]">
                <Briefcase className="w-3.5 h-3.5 text-[#008254] mt-0.5 shrink-0" />
                <p>
                    This roster is scoped to employees whose employment date is on or after{' '}
                    <strong className="text-[#3d4045]">{formatDate(cutoff)}</strong> (Hamle 1, 2018 E.C.).
                    Change the cutoff from <strong className="text-[#3d4045]">Statutory Settings</strong> by
                    editing the <code className="px-1 py-0.5 bg-[#f7f7f7] border border-[#ebebec] rounded-xs">new_hire_cutoff_date</code> parameter.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}
