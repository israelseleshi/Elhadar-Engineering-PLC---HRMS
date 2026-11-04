import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/Components/ui/table';
import { 
    Briefcase, 
    AlertTriangle, 
    CheckCircle2, 
    Search, 
    Eye, 
    Calendar,
    Repeat,
    MapPin
} from 'lucide-react';

interface ContractStaff {
    id: number;
    file_no: string;
    full_name: string;
    position: string;
    work_place: string;
    contract_end_date?: string;
    status: string;
    days_until_expiration: number | null;
    is_expired: boolean;
    is_critical: boolean;
    department?: { name: string };
    current_salary?: { basic_salary: number; total_salary: number };
}

interface Props {
    contracts: {
        data: ContractStaff[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        urgency?: string;
        search?: string;
    };
    stats: {
        total_contracts: number;
        expiring_soon: number;
        expired: number;
    };
}

export default function Index({ contracts, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [urgency, setUrgency] = useState(filters.urgency || 'all');
    const [selectedStaff, setSelectedStaff] = useState<ContractStaff | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        project_name: '',
        agreed_salary: '',
        terms_summary: '',
    });

    const handleFilter = (updates: Record<string, string>) => {
        router.get(
            route('contracts.index'),
            {
                urgency,
                search,
                ...updates,
            },
            { preserveState: true, replace: true }
        );
    };

    const openRenewalModal = (staff: ContractStaff) => {
        setSelectedStaff(staff);
        setData({
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            project_name: staff.work_place === 'Project' ? 'Lalibela Project' : 'Head Office Construction Management',
            agreed_salary: staff.current_salary?.basic_salary ? String(staff.current_salary.basic_salary) : '20000',
            terms_summary: 'Fixed-term project extension agreement.',
        });
    };

    const handleRenewalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStaff) return;

        post(route('contracts.renew', selectedStaff.id), {
            onSuccess: () => {
                setSelectedStaff(null);
                reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            title="Project Contract Renewal Pipeline"
            subtitle="Manage fixed-term construction project contracts, track 30-day expiration alerts, and execute contract renewals."
        >
            <Head title="Contracts Pipeline - Elhadar Engineering HRMS" />

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="border-[#d8d9da] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">
                                Active Contract Staff
                            </p>
                            <p className="text-2xl font-bold text-black mt-0.5">
                                {stats.total_contracts}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#effcf8] text-[#008254] flex items-center justify-center font-bold">
                            <Briefcase className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#d8d9da] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">
                                Expiring (&lt;30 Days)
                            </p>
                            <p className="text-2xl font-bold text-[#b45309] mt-0.5">
                                {stats.expiring_soon}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#fef3c7] text-[#b45309] flex items-center justify-center font-bold">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#d8d9da] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">
                                Expired / Needs Renewal
                            </p>
                            <p className="text-2xl font-bold text-[#de2828] mt-0.5">
                                {stats.expired}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#fee2e2] text-[#de2828] flex items-center justify-center font-bold">
                            <Repeat className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <Card className="border-[#d8d9da] bg-white mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
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

                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="inline-flex rounded-xs border border-[#d8d9da] p-1 bg-[#f7f7f7]">
                                <button
                                    onClick={() => {
                                        setUrgency('all');
                                        handleFilter({ urgency: 'all' });
                                    }}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-colors ${
                                        urgency === 'all'
                                            ? 'bg-white text-[#008254] shadow-xs'
                                            : 'text-[#64666a] hover:text-black'
                                    }`}
                                >
                                    All Contracts
                                </button>
                                <button
                                    onClick={() => {
                                        setUrgency('expiring_30');
                                        handleFilter({ urgency: 'expiring_30' });
                                    }}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-colors ${
                                        urgency === 'expiring_30'
                                            ? 'bg-white text-[#008254] shadow-xs'
                                            : 'text-[#64666a] hover:text-black'
                                    }`}
                                >
                                    &lt; 30 Days
                                </button>
                                <button
                                    onClick={() => {
                                        setUrgency('expiring_15');
                                        handleFilter({ urgency: 'expiring_15' });
                                    }}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-colors ${
                                        urgency === 'expiring_15'
                                            ? 'bg-white text-[#008254] shadow-xs'
                                            : 'text-[#64666a] hover:text-black'
                                    }`}
                                >
                                    &lt; 15 Days
                                </button>
                                <button
                                    onClick={() => {
                                        setUrgency('expired');
                                        handleFilter({ urgency: 'expired' });
                                    }}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-colors ${
                                        urgency === 'expired'
                                            ? 'bg-white text-[#008254] shadow-xs'
                                            : 'text-[#64666a] hover:text-black'
                                    }`}
                                >
                                    Expired
                                </button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contracts Table */}
            <Card className="border-[#d8d9da] bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24">File no</TableHead>
                            <TableHead>Staff name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Work place</TableHead>
                            <TableHead>Expiration date</TableHead>
                            <TableHead className="text-center">Days left</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contracts.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-[#64666a]">
                                    No contract staff found matching your filter criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            contracts.data.map((emp) => (
                                <TableRow key={emp.id} className="hover:bg-[#effcf8]/50">
                                    <TableCell className="font-bold text-[#008254] text-xs">
                                        {emp.file_no}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-black text-sm">{emp.full_name}</div>
                                        <div className="text-xs text-[#64666a]">{emp.position}</div>
                                    </TableCell>
                                    <TableCell className="text-xs text-[#3d4045]">
                                        {emp.department?.name || 'General Operations'}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                            emp.work_place === 'Project' ? 'text-[#008254]' : 'text-[#3d4045]'
                                        }`}>
                                            <MapPin className="w-3 h-3" />
                                            {emp.work_place}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs font-bold text-black">
                                        {emp.contract_end_date || 'Project completion'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {emp.days_until_expiration !== null ? (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-xs font-bold ${
                                                emp.is_expired ? 'bg-[#fee2e2] text-[#de2828]' :
                                                emp.is_critical ? 'bg-[#fef9c3] text-[#854d0e]' :
                                                'bg-[#effcf8] text-[#008254]'
                                            }`}>
                                                {emp.is_expired ? 'Expired' : `${emp.days_until_expiration} Days`}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-[#64666a]">Continuous</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={
                                                emp.is_expired ? 'destructive' :
                                                emp.is_critical ? 'lime' : 'secondary'
                                            }
                                        >
                                            {emp.is_expired ? 'Expired' : emp.is_critical ? 'Urgent Renewal' : 'Active Contract'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                onClick={() => openRenewalModal(emp)}
                                                size="sm"
                                                className="bg-[#008254] hover:bg-[#006642] text-white font-bold text-xs h-8 px-2.5 rounded-xs"
                                            >
                                                <Repeat className="w-3.5 h-3.5 mr-1" />
                                                Renew
                                            </Button>
                                            <Link href={route('employees.show', emp.id)}>
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

                {/* Pagination */}
                {contracts.last_page > 1 && (
                    <div className="p-4 border-t border-[#ebebec] bg-[#f7f7f7] flex items-center justify-between text-xs text-[#64666a]">
                        <div>
                            Showing <strong>{contracts.from || 0}</strong> to <strong>{contracts.to || 0}</strong> of <strong>{contracts.total}</strong> contracts
                        </div>
                        <div className="flex gap-1">
                            {contracts.links.map((link, idx) => (
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

            {/* Contract Renewal Modal */}
            {selectedStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-lg border border-[#d8d9da] shadow-lg max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-base font-bold text-black">Renew Project Contract</h3>
                                <p className="text-xs text-[#008254] font-semibold">
                                    {selectedStaff.full_name} ({selectedStaff.file_no})
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedStaff(null)}
                                className="text-[#64666a] hover:text-black text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleRenewalSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Commence Date <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        required
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        New End Date <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        required
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                    />
                                    {errors.end_date && (
                                        <p className="text-xs text-[#de2828] mt-1">{errors.end_date}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-black mb-1">
                                    Project Assignment Name <span className="text-[#de2828]">*</span>
                                </label>
                                <Input
                                    required
                                    value={data.project_name}
                                    onChange={(e) => setData('project_name', e.target.value)}
                                    placeholder="e.g. Lalibela Water Works Project"
                                    className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-black mb-1">
                                    Agreed Monthly Basic Wage (ETB) <span className="text-[#de2828]">*</span>
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={data.agreed_salary}
                                    onChange={(e) => setData('agreed_salary', e.target.value)}
                                    placeholder="20000.00"
                                    className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-black mb-1">
                                    Summary Terms & Conditions
                                </label>
                                <textarea
                                    value={data.terms_summary}
                                    onChange={(e) => setData('terms_summary', e.target.value)}
                                    rows={2}
                                    placeholder="Special project site obligations, perdiem, or responsibilities..."
                                    className="w-full rounded-xs border border-[#d8d9da] bg-[#f7f7f7] p-2.5 text-xs text-[#3d4045] focus:outline-none focus:ring-1 focus:ring-[#008254]"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-[#ebebec]">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedStaff(null)}
                                    className="text-xs border-[#d8d9da] rounded-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[#008254] hover:bg-[#006642] text-white text-xs font-bold uppercase rounded-xs"
                                >
                                    {processing ? 'Saving...' : 'Confirm Renewal'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
