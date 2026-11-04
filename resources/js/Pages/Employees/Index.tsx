import { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InteractiveTour, { TourStep } from '@/Components/InteractiveTour';
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
    MapPin, 
    Eye, 
    Search, 
    ShieldCheck, 
    Filter, 
    CheckCircle2, 
    Calendar,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    Compass,
    Download,
    FileSpreadsheet,
    UploadCloud,
    X,
    RefreshCw,
    ChevronDown,
    Loader2
} from 'lucide-react';

interface EmployeeItem {
    id: number;
    file_no: string;
    full_name: string;
    gender: 'Male' | 'Female';
    position: string;
    work_place: string;
    status: 'Permanent' | 'Contract' | 'Probation' | 'Separated';
    employment_date_ec: string;
    employment_date: string;
    probation_end_date?: string;
    contract_end_date?: string;
    profile_photo_url?: string | null;
    department?: {
        id: number;
        name: string;
    };
    current_salary?: {
        basic_salary: number;
        total_salary: number;
        net_salary?: number;
    };
}

interface Props {
    employees: {
        data: EmployeeItem[];
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
        total_headcount: number;
        permanent_count: number;
        project_count: number;
        head_office_count: number;
        probation_count: number;
        contract_count: number;
        separated_count: number;
    };
    departments: { id: number; name: string }[];
    workplaces?: string[];
}

const staffDirectoryTourSteps: TourStep[] = [
    {
        target: '[data-tour="page-header"]',
        title: 'Staff Directory Command',
        content: 'This is the master personnel directory for Elhadar Engineering. It consolidates all 106 confirmed staff records across regional project sites and the Addis Ababa Head Office.',
        badge: 'Staff Registry',
        placement: 'bottom',
        tip: 'Centralizes the "All Permanent Employees" and "Project Employees" master spreadsheets.'
    },
    {
        target: '[data-tour="onboard-btn"]',
        title: 'Recruitment & Onboarding Wizard',
        content: 'Click here to launch the 4-step new hire wizard. Easily capture employee identity, workplace assignment, Kebele address hierarchy, 8 distinct statutory allowances, and physical filing codes.',
        badge: 'New Hire Wizard',
        placement: 'bottom',
        tip: 'Automatically calculates 7% employee and 11% employer pension obligations.'
    },
    {
        target: '[data-tour="search-input"]',
        title: 'Instant Multi-Field Search',
        content: 'Search by Ethiopian tripartite name (e.g. "Abay Sewmehon"), mobile phone number, or physical filing cabinet code (e.g. "A-001", "B-010"). Press Enter to filter.',
        badge: 'Indexed Search',
        placement: 'bottom',
        tip: 'Filing codes match physical paper folders in the HR archive.'
    },
    {
        target: '[data-tour="department-filter"]',
        title: 'Departmental Filter',
        content: 'Narrow down personnel by department—such as Engineering Dept, Electro-Mechanical, Procurement, Finance, or General Operations.',
        badge: 'Department',
        placement: 'bottom',
    },
    {
        target: '[data-tour="workplace-filter"]',
        title: 'Workplace Division',
        content: 'Filter between remote construction Project Sites and the Head Office. This workplace distinction determines site allowance eligibility and field perdiem rules.',
        badge: 'Workplace Rules',
        placement: 'bottom',
    },
    {
        target: '[data-tour="status-filter"]',
        title: 'Employment Lifecycle Filter',
        content: 'Narrow your view to Permanent staff, Fixed-term Contracts, active Probationers, or historical Resigned/Separated records.',
        badge: 'Lifecycle Stage',
        placement: 'bottom',
    },
    {
        target: '[data-tour="data-table"]',
        title: 'Master Employee Table',
        content: 'Presents standardized columns: File No, Staff Member name and gender, Department, Position, Workplace, Ethiopian Calendar (E.C.) start date, Total Gross Monthly Salary, and Status.',
        badge: 'Master Ledger',
        placement: 'top',
        tip: 'Total Salary includes basic salary plus all 8 allowances according to company compensation rules.'
    },
    {
        target: '[data-tour="first-dossier-btn"]',
        title: '360° Employee Profile',
        content: 'Click the "View Profile" button on any employee row to open their complete personnel file—revealing all allowance breakdowns, residence, pension number, and career increments.',
        badge: 'Profile View',
        placement: 'left',
        tip: 'From the employee profile, you can also edit details or log statutory salary adjustments.'
    },
    {
        target: '[data-tour="pagination"]',
        title: 'Server-Side Pagination & Counts',
        content: 'Navigate through records while keeping your search keywords and filter criteria preserved in the URL query state.',
        badge: 'Navigation',
        placement: 'top',
    }
];

export default function Index({ employees, filters, stats, departments, workplaces = [] }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [departmentId, setDepartmentId] = useState(filters.department_id || '');
    const [workPlace, setWorkPlace] = useState(filters.work_place || '');
    const [status, setStatus] = useState(filters.status || '');
    const [viewMode, setViewMode] = useViewMode('employees');
    const [isTourOpen, setIsTourOpen] = useState(false);

    // Export & Excel Sync Modal State
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewData, setPreviewData] = useState<any | null>(null);
    const [importError, setImportError] = useState<string | null>(null);

    // Contract Renewal Modal State
    const [renewEmployee, setRenewEmployee] = useState<EmployeeItem | null>(null);
    const renewForm = useForm({
        start_date: '',
        end_date: '',
        project_name: '',
        agreed_salary: '',
        terms_summary: '',
    });

    useEffect(() => {
        const handleOpenTour = () => setIsTourOpen(true);
        window.addEventListener('open-staff-directory-tour', handleOpenTour);

        if (typeof window !== 'undefined') {
            if (window.location.search.includes('tour=true')) {
                setIsTourOpen(true);
            }
            if (window.location.search.includes('openImport=true')) {
                setShowImportModal(true);
            }
        }

        return () => window.removeEventListener('open-staff-directory-tour', handleOpenTour);
    }, []);

    const handleFilter = (updates: Record<string, string>) => {
        router.get(
            route('employees.index'),
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

    const handleConfirmPermanency = (emp: EmployeeItem) => {
        if (confirm(`Confirm ${emp.full_name} (${emp.file_no}) as a Permanent employee under Ethiopian Labour Proclamation No. 1156/2019?`)) {
            router.post(route('probation.confirm', emp.id), {}, { preserveScroll: true });
        }
    };

    const handleRenewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!renewEmployee) return;
        renewForm.post(route('contracts.renew', renewEmployee.id), {
            onSuccess: () => {
                setRenewEmployee(null);
                renewForm.reset();
            },
        });
    };

    const handleUploadPreview = async () => {
        if (!importFile) return;
        setIsUploading(true);
        setImportError(null);
        try {
            const formData = new FormData();
            formData.append('file', importFile);
            const res = await fetch(route('import.preview'), {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: formData,
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.message || errJson.errors?.file?.[0] || 'Spreadsheet validation failed.');
            }
            const data = await res.json();
            setPreviewData(data);
        } catch (err: any) {
            setImportError(err.message || 'Failed to process spreadsheet.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleExecuteImport = () => {
        if (!previewData?.all_valid_payload) return;
        router.post(
            route('import.execute'),
            { records: previewData.all_valid_payload },
            {
                onSuccess: () => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setPreviewData(null);
                },
            }
        );
    };

    const formatCurrency = (amount?: number) => {
        if (!amount || amount <= 0) return '—';
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            maximumFractionDigits: 0,
        }).format(amount);
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
                    <div data-tour="page-header">
                        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Staff Directory</h2>
                        <p className="mt-1 text-sm text-[#e3faf2] font-light max-w-2xl">
                            Search and filter personnel records across Head Office and active project sites.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Excel Export Dropdown */}
                        <div className="relative">
                            <Button
                                type="button"
                                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                                variant="outline"
                                className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/25 gap-1.5 rounded-xs"
                            >
                                <Download className="w-3.5 h-3.5 text-[#ddfa88]" />
                                <span>Export</span>
                                <ChevronDown className="w-3 h-3 text-white/70" />
                            </Button>
                            {exportMenuOpen && (
                                <div className="absolute right-0 mt-1 w-56 bg-white border border-[#d8d9da] rounded-xs shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <a
                                        href={route('export.employees', { search, department_id: departmentId, work_place: workPlace, status })}
                                        className="flex items-center gap-2 px-3 py-2 text-xs text-[#3d4045] hover:bg-[#effcf8] hover:text-[#008254]"
                                        onClick={() => setExportMenuOpen(false)}
                                    >
                                        <Download className="w-3.5 h-3.5 text-[#008254]" />
                                        <span>Export Filtered View (CSV)</span>
                                    </a>
                                    <a
                                        href={route('export.employees', { status: 'Permanent' })}
                                        className="flex items-center gap-2 px-3 py-2 text-xs text-[#3d4045] hover:bg-[#effcf8] hover:text-[#008254]"
                                        onClick={() => setExportMenuOpen(false)}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-[#008254]" />
                                        <span>Export All Active Staff (CSV)</span>
                                    </a>
                                    <div className="border-t border-[#ebebec] my-1" />
                                    <a
                                        href={route('import.template')}
                                        className="flex items-center gap-2 px-3 py-2 text-xs text-[#3d4045] hover:bg-[#effcf8] hover:text-[#008254]"
                                        onClick={() => setExportMenuOpen(false)}
                                    >
                                        <FileSpreadsheet className="w-3.5 h-3.5 text-[#008254]" />
                                        <span>Download Blank Template (CSV)</span>
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Excel Sync Modal Trigger */}
                        <Button
                            type="button"
                            onClick={() => setShowImportModal(true)}
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/25 gap-1.5 rounded-xs"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-[#ddfa88]" />
                            <span>Excel Sync</span>
                        </Button>

                        <Button
                            type="button"
                            onClick={() => setIsTourOpen(true)}
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/25 gap-1.5 rounded-xs transition-colors"
                        >
                            <Compass className="w-3.5 h-3.5 text-[#ddfa88]" />
                            <span>Tour Directory</span>
                        </Button>

                        <Link href={route('employees.create')}>
                            <Button data-tour="onboard-btn" className="bg-[#ddfa88] hover:bg-[#cbf458] text-[#00482f] font-bold text-xs gap-1.5 rounded-xs shadow-sm">
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Onboard Employee</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Staff Directory - Elhadar Engineering HRMS" />

            {/* Consolidated Lifecycle Filter Tabs */}
            <div data-tour="lifecycle-tabs" className="flex flex-wrap items-center gap-2 mb-4">
                {[
                    { label: 'All Staff', val: '', count: stats.total_headcount },
                    { label: 'Permanent', val: 'Permanent', count: stats.permanent_count },
                    { label: 'Probation Pipeline', val: 'Probation', count: stats.probation_count },
                    { label: 'Project Contracts', val: 'Contract', count: stats.contract_count },
                    { label: 'Separated Archive', val: 'Separated', count: stats.separated_count },
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
            <Card data-tour="filters-bar" className="border-[#d8d9da] bg-white mb-6">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                        <div data-tour="search-input" className="relative md:col-span-1">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-[#64666a]" />
                            <Input
                                placeholder="Search name, file no, phone, TIN, POESSA..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleFilter({ search });
                                }}
                                className="pl-9 bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                            />
                        </div>

                        <div data-tour="department-filter">
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

                        <div data-tour="workplace-filter">
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

                        <div data-tour="status-filter" className="flex gap-2">
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

            {/* Comparison Data Table (Strictly Styled per NerdWallet DESIGN.md) */}
            <Card data-tour="data-table" className="border-[#d8d9da] bg-white overflow-hidden shadow-sm">
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
                            <TableHead>Employment date (E.C)</TableHead>
                            <TableHead className="text-right">Total salary</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-12 text-[#64666a]">
                                    No personnel records found matching your filter criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.data.map((emp, idx) => (
                                <TableRow 
                                    key={emp.id} 
                                    className="hover:bg-[#effcf8]/50"
                                    {...(idx === 0 ? { 'data-tour': 'first-employee-row' } : {})}
                                >
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
                                    <TableCell className="text-xs text-[#64666a]">
                                        {emp.employment_date_ec}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-black text-sm">
                                        {formatCurrency(emp.current_salary?.total_salary || emp.current_salary?.basic_salary)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(emp.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {emp.status === 'Probation' && (
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleConfirmPermanency(emp)}
                                                    className="bg-[#008254] hover:bg-[#006642] text-white font-bold text-[11px] h-8 px-2.5 rounded-xs gap-1"
                                                    title="Confirm permanent employment status"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Confirm Permanent
                                                </Button>
                                            )}
                                            {emp.status === 'Contract' && (
                                                <Button 
                                                    size="sm"
                                                    onClick={() => {
                                                        setRenewEmployee(emp);
                                                        renewForm.setData({
                                                            start_date: emp.contract_end_date ? emp.contract_end_date.split('T')[0] : new Date().toISOString().split('T')[0],
                                                            end_date: '',
                                                            project_name: emp.work_place !== 'Head Office' ? emp.work_place : 'General Project Operations',
                                                            agreed_salary: emp.current_salary?.basic_salary?.toString() || '15000',
                                                            terms_summary: '',
                                                        });
                                                    }}
                                                    className="bg-[#00482f] hover:bg-[#003824] text-white font-bold text-[11px] h-8 px-2.5 rounded-xs gap-1"
                                                    title="Renew fixed-term project contract"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                    Renew Contract
                                                </Button>
                                            )}
                                            <Link href={route('employees.show', emp.id)}>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    {...(idx === 0 ? { 'data-tour': 'first-dossier-btn' } : {})}
                                                    className="border-[#d8d9da] hover:bg-[#effcf8] text-[#008254] font-semibold text-xs h-8 gap-1.5 rounded-xs"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>View Profile</span>
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
                            <div className="col-span-full py-12 text-center text-xs text-[#64666a]">
                                No personnel records found matching your filter criteria.
                            </div>
                        ) : (
                            employees.data.map((emp) => (
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
                                            {emp.employment_date_ec} E.C.
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
                {employees.last_page > 1 && (
                    <div data-tour="pagination" className="p-4 border-t border-[#ebebec] bg-[#f7f7f7] flex items-center justify-between text-xs text-[#64666a]">
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

            {/* Excel Sync & Ingestion Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-lg border border-[#d8d9da] shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#ebebec]">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-[#008254]" />
                                <div>
                                    <h3 className="text-base font-bold text-black">Excel Master List Sync & Ingestion</h3>
                                    <p className="text-xs text-[#64666a]">Ingest or update staff records directly from official master spreadsheet.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setShowImportModal(false);
                                    setPreviewData(null);
                                    setImportFile(null);
                                    setImportError(null);
                                }}
                                className="text-[#64666a] hover:text-black p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!previewData ? (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-[#b7ecda] bg-[#effcf8]/50 rounded-lg p-6 text-center hover:border-[#008254] transition-colors">
                                    <UploadCloud className="w-10 h-10 text-[#008254] mx-auto mb-2" />
                                    <p className="text-xs font-bold text-black mb-1">
                                        Select an Excel (.xlsx, .xls) or CSV spreadsheet file
                                    </p>
                                    <p className="text-[11px] text-[#64666a] mb-4">
                                        Accepts 2019/2025 E.C. Master List formats with column mapping.
                                    </p>
                                    <input 
                                        type="file" 
                                        accept=".xlsx,.xls,.csv" 
                                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                        className="text-xs text-[#3d4045] file:mr-3 file:py-1.5 file:px-3 file:rounded-xs file:border-0 file:text-xs file:font-semibold file:bg-[#008254] file:text-white hover:file:bg-[#006642] cursor-pointer"
                                    />
                                    {importFile && (
                                        <p className="mt-3 text-xs font-semibold text-[#008254]">
                                            Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                                        </p>
                                    )}
                                </div>

                                {importError && (
                                    <div className="p-3 bg-[#fdf2f2] border border-[#f8b4b4] rounded-xs text-xs text-[#de2828]">
                                        {importError}
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-3 border-t border-[#ebebec]">
                                    <a
                                        href={route('import.template')}
                                        className="text-xs font-semibold text-[#008254] hover:underline flex items-center gap-1"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download Sample Template
                                    </a>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowImportModal(false)}
                                            className="text-xs border-[#d8d9da]"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            disabled={!importFile || isUploading}
                                            onClick={handleUploadPreview}
                                            className="bg-[#008254] hover:bg-[#006642] text-white text-xs font-bold gap-1.5"
                                        >
                                            {isUploading ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    Parsing &amp; Validating...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Upload &amp; Preview
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Summary Stats */}
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div className="p-2.5 bg-[#effcf8] border border-[#b7ecda] rounded-xs">
                                        <p className="text-[10px] font-bold uppercase text-[#008254]">Total Scanned</p>
                                        <p className="text-xl font-bold text-black">{previewData.summary.total_scanned}</p>
                                    </div>
                                    <div className="p-2.5 bg-[#effcf8] border border-[#b7ecda] rounded-xs">
                                        <p className="text-[10px] font-bold uppercase text-[#008254]">New Staff</p>
                                        <p className="text-xl font-bold text-[#008254]">{previewData.summary.new_count}</p>
                                    </div>
                                    <div className="p-2.5 bg-[#f7f7f7] border border-[#d8d9da] rounded-xs">
                                        <p className="text-[10px] font-bold uppercase text-[#64666a]">Updates</p>
                                        <p className="text-xl font-bold text-[#3d4045]">{previewData.summary.update_count}</p>
                                    </div>
                                    <div className={`p-2.5 border rounded-xs ${previewData.summary.error_count > 0 ? 'bg-[#fdf2f2] border-[#f8b4b4]' : 'bg-[#f7f7f7] border-[#d8d9da]'}`}>
                                        <p className="text-[10px] font-bold uppercase text-[#de2828]">Errors</p>
                                        <p className={`text-xl font-bold ${previewData.summary.error_count > 0 ? 'text-[#de2828]' : 'text-[#64666a]'}`}>
                                            {previewData.summary.error_count}
                                        </p>
                                    </div>
                                </div>

                                {/* Preview Samples Table */}
                                <div className="border border-[#d8d9da] rounded-xs overflow-hidden max-h-56 overflow-y-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-[#f7f7f7] text-[#64666a] border-b border-[#d8d9da]">
                                            <tr>
                                                <th className="p-2 font-bold">File no</th>
                                                <th className="p-2 font-bold">Full name</th>
                                                <th className="p-2 font-bold">Department</th>
                                                <th className="p-2 font-bold">Position</th>
                                                <th className="p-2 font-bold">Salary</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#ebebec]">
                                            {previewData.all_valid_payload.slice(0, 8).map((r: any, i: number) => (
                                                <tr key={i} className="hover:bg-[#effcf8]/40">
                                                    <td className="p-2 font-bold text-[#008254]">{r.file_no}</td>
                                                    <td className="p-2 font-semibold text-black">{r.full_name}</td>
                                                    <td className="p-2 text-[#3d4045]">{r.department_name}</td>
                                                    <td className="p-2 text-[#64666a]">{r.position}</td>
                                                    <td className="p-2 font-bold text-black">{formatCurrency(r.basic_salary)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {previewData.summary.error_count > 0 && (
                                    <div className="p-3 bg-[#fdf2f2] border border-[#f8b4b4] rounded-xs text-xs text-[#de2828]">
                                        <p className="font-bold mb-1">Rows with Validation Issues (Skipped):</p>
                                        <ul className="list-disc pl-4 space-y-0.5">
                                            {previewData.error_records.slice(0, 4).map((err: any, i: number) => (
                                                <li key={i}>Row {err.row}: {err.errors?.join(', ') || 'Invalid record'} ({err.full_name || 'Unknown'})</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-3 border-t border-[#ebebec]">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setPreviewData(null)}
                                        className="text-xs border-[#d8d9da]"
                                    >
                                        Re-upload Different File
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleExecuteImport}
                                        className="bg-[#008254] hover:bg-[#006642] text-white text-xs font-bold gap-1.5"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Confirm &amp; Sync {previewData.all_valid_payload.length} Records
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Contract Renewal Modal */}
            {renewEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-lg border border-[#d8d9da] shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#ebebec]">
                            <div>
                                <h3 className="text-base font-bold text-black">Renew Project Contract</h3>
                                <p className="text-xs text-[#008254] font-semibold">
                                    {renewEmployee.full_name} ({renewEmployee.file_no})
                                </p>
                            </div>
                            <button onClick={() => setRenewEmployee(null)} className="text-[#64666a] hover:text-black">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRenewSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Start Date <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        required
                                        value={renewForm.data.start_date}
                                        onChange={(e) => renewForm.setData('start_date', e.target.value)}
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-9"
                                    />
                                    {renewForm.errors.start_date && (
                                        <p className="text-xs text-[#de2828] mt-1">{renewForm.errors.start_date}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black mb-1">
                                        End Date <span className="text-[#de2828]">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        required
                                        value={renewForm.data.end_date}
                                        onChange={(e) => renewForm.setData('end_date', e.target.value)}
                                        className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-9"
                                    />
                                    {renewForm.errors.end_date && (
                                        <p className="text-xs text-[#de2828] mt-1">{renewForm.errors.end_date}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-black mb-1">
                                    Project Name / Deployment Site <span className="text-[#de2828]">*</span>
                                </label>
                                <Input
                                    required
                                    value={renewForm.data.project_name}
                                    onChange={(e) => renewForm.setData('project_name', e.target.value)}
                                    placeholder="e.g. Lalibela Water Works Project"
                                    className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-9"
                                />
                                {renewForm.errors.project_name && (
                                    <p className="text-xs text-[#de2828] mt-1">{renewForm.errors.project_name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-black mb-1">
                                    Agreed Monthly Basic Salary (ETB) <span className="text-[#de2828]">*</span>
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={renewForm.data.agreed_salary}
                                    onChange={(e) => renewForm.setData('agreed_salary', e.target.value)}
                                    placeholder="e.g. 18500"
                                    className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-9"
                                />
                                {renewForm.errors.agreed_salary && (
                                    <p className="text-xs text-[#de2828] mt-1">{renewForm.errors.agreed_salary}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-black mb-1">
                                    Terms &amp; Operational Summary (Optional)
                                </label>
                                <textarea
                                    value={renewForm.data.terms_summary}
                                    onChange={(e) => renewForm.setData('terms_summary', e.target.value)}
                                    rows={2}
                                    placeholder="e.g. Contract extended for Phase II foundation excavation works..."
                                    className="w-full rounded-xs border border-[#d8d9da] bg-[#f7f7f7] p-2.5 text-xs text-[#3d4045] focus:outline-none focus:ring-1 focus:ring-[#008254]"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-[#ebebec]">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setRenewEmployee(null)}
                                    className="text-xs border-[#d8d9da]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={renewForm.processing}
                                    className="bg-[#008254] hover:bg-[#006642] text-white text-xs font-bold"
                                >
                                    {renewForm.processing ? 'Saving Renewal...' : 'Renew Contract'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Interactive Element-Spotlight Joyride Tour */}
            <InteractiveTour
                steps={staffDirectoryTourSteps}
                isOpen={isTourOpen}
                onClose={() => setIsTourOpen(false)}
                tourTitle="Staff Directory Guided Tour"
            />
        </AuthenticatedLayout>
    );
}
