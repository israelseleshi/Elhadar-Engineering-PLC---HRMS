import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InteractiveTour, { TourStep } from '@/Components/InteractiveTour';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/Components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/Components/ui/sheet';
import { toast } from 'sonner';
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
import ExcelColumnFilter, { FilterOption } from '@/Components/ExcelColumnFilter';
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
        department_id?: string | string[];
        work_place?: string | string[];
        status?: string | string[];
        position?: string | string[];
        sort_by?: string;
        sort_direction?: 'asc' | 'desc';
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
    positions?: string[];
}

const toArray = (val: string | string[] | undefined): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String).filter(Boolean);
    return String(val).split(',').map((s) => s.trim()).filter(Boolean);
};

const staffDirectoryTourSteps: TourStep[] = [
    {
        target: '[data-tour="lifecycle-tabs"]',
        title: 'Status filters',
        content: 'Switch between permanent, probation, contract, and separated personnel.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="onboard-btn"]',
        title: 'Onboard employee',
        content: 'Register a new hire and capture personal details, department, and salary.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="filters-bar"]',
        title: 'Search and filters',
        content: 'Search by name, file number, or phone, and filter by department or workplace.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="data-table"]',
        title: 'Personnel table',
        content: 'View employee records with compensation, employment dates, and status.',
        placement: 'top',
    },
    {
        target: '[data-tour="first-dossier-btn"]',
        title: 'View profile',
        content: "Open any employee's full profile to view credentials and career history.",
        placement: 'left',
    },
];

export default function Index({ employees, filters, stats, departments, workplaces = [], positions = [] }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [departmentId, setDepartmentId] = useState<string[]>(toArray(filters.department_id));
    const [workPlace, setWorkPlace] = useState<string[]>(toArray(filters.work_place));
    const [status, setStatus] = useState<string[]>(toArray(filters.status));
    const [position, setPosition] = useState<string[]>(toArray(filters.position));
    const [sortBy, setSortBy] = useState(filters.sort_by || 'file_no');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(filters.sort_direction || 'asc');
    const [viewMode, setViewMode] = useViewMode('employees');
    const [isTourOpen, setIsTourOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [peekEmployee, setPeekEmployee] = useState<EmployeeItem | null>(null);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setSearch(filters.search || '');
        setDepartmentId(toArray(filters.department_id));
        setWorkPlace(toArray(filters.work_place));
        setStatus(toArray(filters.status));
        setPosition(toArray(filters.position));
        setSortBy(filters.sort_by || 'file_no');
        setSortDirection(filters.sort_direction || 'asc');
    }, [filters.search, filters.department_id, filters.work_place, filters.status, filters.position, filters.sort_by, filters.sort_direction]);

    const executeFilter = useCallback((updates: Record<string, any>) => {
        const queryParams: Record<string, any> = {
            search,
            department_id: departmentId,
            work_place: workPlace,
            status,
            position,
            sort_by: sortBy,
            sort_direction: sortDirection,
            ...updates,
        };

        // Clean empty parameters
        Object.keys(queryParams).forEach((k) => {
            if (queryParams[k] === undefined || queryParams[k] === null || queryParams[k] === '') {
                delete queryParams[k];
            } else if (Array.isArray(queryParams[k]) && queryParams[k].length === 0) {
                delete queryParams[k];
            }
        });

        router.get(route('employees.index'), queryParams, { preserveState: true, replace: true });
    }, [search, departmentId, workPlace, status, position, sortBy, sortDirection]);

    const debouncedFilter = useCallback((updates: Record<string, any>) => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            executeFilter(updates);
        }, 300);
    }, [executeFilter]);

    const handleSort = (newSortBy: string, direction: 'asc' | 'desc') => {
        setSortBy(newSortBy);
        setSortDirection(direction);
        executeFilter({ sort_by: newSortBy, sort_direction: direction });
    };

    const handleFilterUpdate = (updates: Record<string, any>) => {
        if ('department_id' in updates) setDepartmentId(updates.department_id);
        if ('work_place' in updates) setWorkPlace(updates.work_place);
        if ('status' in updates) setStatus(updates.status);
        if ('position' in updates) setPosition(updates.position);
        if ('search' in updates) setSearch(updates.search);

        executeFilter(updates);
    };

    const resetAllFilters = () => {
        setSearch('');
        setDepartmentId([]);
        setWorkPlace([]);
        setStatus([]);
        setPosition([]);
        setSortBy('file_no');
        setSortDirection('asc');
        router.get(route('employees.index'), {}, { preserveState: true, replace: true });
    };

    const departmentOptions: FilterOption[] = useMemo(() => {
        return departments.map((d) => ({
            label: d.name,
            value: String(d.id),
        }));
    }, [departments]);

    const workplaceOptions: FilterOption[] = useMemo(() => {
        const list = ['Head Office'];
        (workplaces || []).forEach((w) => {
            if (w && w !== 'H.O' && w !== 'Head Office' && !list.includes(w)) {
                list.push(w);
            }
        });
        return list.map((w) => ({
            label: w,
            value: w,
        }));
    }, [workplaces]);

    const statusOptions: FilterOption[] = useMemo(() => [
        { label: 'Permanent', value: 'Permanent' },
        { label: 'Contract', value: 'Contract' },
        { label: 'Probation', value: 'Probation' },
        { label: 'Separated', value: 'Separated' },
    ], []);

    const positionOptions: FilterOption[] = useMemo(() => {
        return (positions || []).map((p) => ({
            label: p,
            value: p,
        }));
    }, [positions]);

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAllOnPage = () => {
        const ids = new Set(employees.data.map((e) => e.id));
        if ([...ids].every((id) => selectedIds.has(id))) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(ids);
        }
    };

    const isSelected = (id: number) => selectedIds.has(id);

    // Export & Excel Sync Modal State
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewData, setPreviewData] = useState<any | null>(null);
    const [importError, setImportError] = useState<string | null>(null);

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

        return () => {
            window.removeEventListener('open-staff-directory-tour', handleOpenTour);
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        };
    }, []);

    const handleFilter = (updates: Record<string, any>) => {
        handleFilterUpdate(updates);
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
        if (!amount || amount <= 0) return 'â€”';
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            maximumFractionDigits: 0,
        }).format(amount);
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
            title="Staff Directory"
            subtitle="Search and filter personnel records across Head Office and active project sites."
        >
            <Head title="Staff Directory - Elhadar Engineering HRMS" />

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div data-tour="lifecycle-tabs" className="flex flex-wrap items-center gap-2">
                    {[
                        { label: 'All Staff', val: '', count: stats.total_headcount },
                        { label: 'Permanent', val: 'Permanent', count: stats.permanent_count },
                        { label: 'Probation Pipeline', val: 'Probation', count: stats.probation_count },
                        { label: 'Project Contracts', val: 'Contract', count: stats.contract_count },
                        { label: 'Separated Archive', val: 'Separated', count: stats.separated_count },
                    ].map((tab) => {
                        const isActive = tab.val === '' ? status.length === 0 : (status.length === 1 && status[0] === tab.val);
                        const hasAttention = tab.val === 'Probation' && tab.count > 0;
                        return (
                            <button
                                key={tab.val}
                                type="button"
                                onClick={() => {
                                    const nextStatus = tab.val ? [tab.val] : [];
                                    handleFilterUpdate({ status: nextStatus });
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-2 ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                        : 'bg-card text-foreground border-border hover:bg-muted'
                                }`}
                            >
                                <span className="flex items-center gap-1">
                                    {tab.label}
                                    {hasAttention && (
                                        <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded font-semibold">
                                            attention
                                        </span>
                                    )}
                                </span>
                                <Badge
                                    variant="secondary"
                                    className={`text-[10px] px-1.5 py-0 rounded-full font-mono ${
                                        isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {tab.count}
                                </Badge>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Excel Export Dropdown */}
                    <div className="relative">
                        <Button
                            type="button"
                            onClick={() => setExportMenuOpen(!exportMenuOpen)}
                            variant="outline"
                            size="sm"
                            className="border-border bg-card text-foreground hover:bg-muted font-medium text-xs gap-1.5 rounded-md"
                        >
                            <Download className="w-3.5 h-3.5 text-primary" />
                            <span>Export</span>
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        </Button>
                        {exportMenuOpen && (
                            <div className="absolute right-0 mt-1 w-56 bg-card border border-border rounded-md shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <a
                                    href={route('export.employees', { search, department_id: departmentId, work_place: workPlace, status })}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted"
                                    onClick={() => setExportMenuOpen(false)}
                                >
                                    <Download className="w-3.5 h-3.5 text-primary" />
                                    <span>Export Filtered View (CSV)</span>
                                </a>
                                <a
                                    href={route('export.employees', { status: 'Permanent' })}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted"
                                    onClick={() => setExportMenuOpen(false)}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                    <span>Export All Active Staff (CSV)</span>
                                </a>
                                <div className="border-t border-border my-1" />
                                <a
                                    href={route('import.template')}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted"
                                    onClick={() => setExportMenuOpen(false)}
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
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
                        size="sm"
                        className="border-border bg-card text-foreground hover:bg-muted font-medium text-xs gap-1.5 rounded-md"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
                        <span>Excel Sync</span>
                    </Button>

                    <Button
                        type="button"
                        onClick={() => setIsTourOpen(true)}
                        variant="outline"
                        size="sm"
                        className="border-border bg-card text-foreground hover:bg-muted font-medium text-xs gap-1.5 rounded-md"
                    >
                        <Compass className="w-3.5 h-3.5 text-primary" />
                        <span>Tour Directory</span>
                    </Button>

                    <Link href={route('employees.create')}>
                        <Button data-tour="onboard-btn" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5 rounded-md shadow-xs">
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Onboard Employee</span>
                        </Button>
                    </Link>

                    <ViewToggle value={viewMode} onChange={setViewMode} />
                </div>
            </div>

            {/* Bulk Action Toolbar */}
            {selectedIds.size > 0 && (
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-muted/40 border border-border rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <span className="text-sm font-bold text-foreground">
                        {selectedIds.size} employee{selectedIds.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedIds(new Set())}
                            className="text-xs border-border text-foreground/90 hover:text-foreground"
                        >
                            Clear selection
                        </Button>
                        <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs text-xs font-bold gap-1.5"
                            onClick={() => {
                                // bulk confirm permanent for probationers
                                setSelectedIds(new Set());
                            }}
                        >
                            <CheckCircle2 className="w-3 h-3" />
                            Confirm selected as permanent
                        </Button>
                    </div>
                </div>
            )}

            {/* Filter and Search Bar */}
            <Card data-tour="filters-bar" className="border-border bg-card shadow-xs mb-6">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div data-tour="search-input" className="relative md:col-span-6 lg:col-span-6">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input
                                placeholder="Search name, file no, phone, TIN, POESSA..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    debouncedFilter({ search: e.target.value });
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleFilter({ search });
                                }}
                                className="pl-10 pr-10 bg-background border-input text-foreground text-sm h-11 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        debouncedFilter({ search: '' });
                                    }}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div data-tour="department-filter" className="md:col-span-2 lg:col-span-2">
                            <Select 
                                value={departmentId.length === 1 ? departmentId[0] : (departmentId.length > 1 ? '__multi__' : '__all__')} 
                                onValueChange={(v) => { 
                                    const next = v === '__all__' ? [] : [v]; 
                                    handleFilterUpdate({ department_id: next }); 
                                }}
                            >
                                <SelectTrigger className="w-full h-10 rounded-xs border-input bg-background text-foreground text-xs text-foreground/90">
                                    <SelectValue placeholder={`All Departments (${departments.length})`}>
                                        {departmentId.length === 0 && `All Departments (${departments.length})`}
                                        {departmentId.length === 1 && (departments.find(d => String(d.id) === departmentId[0])?.name || departmentId[0])}
                                        {departmentId.length > 1 && `${departmentId.length} Depts Selected`}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Departments ({departments.length})</SelectItem>
                                    {departments.map((d) => (
                                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div data-tour="workplace-filter" className="md:col-span-2 lg:col-span-2">
                            <Select 
                                value={workPlace.length === 1 ? workPlace[0] : (workPlace.length > 1 ? '__multi__' : '__all__')} 
                                onValueChange={(v) => { 
                                    const next = v === '__all__' ? [] : [v]; 
                                    handleFilterUpdate({ work_place: next }); 
                                }}
                            >
                                <SelectTrigger className="w-full h-10 rounded-xs border-input bg-background text-foreground text-xs text-foreground/90">
                                    <SelectValue placeholder="All Workplaces">
                                        {workPlace.length === 0 && `All Workplaces (${workplaces.length > 0 ? workplaces.length : 'All'})`}
                                        {workPlace.length === 1 && (workPlace[0] === 'H.O' ? 'Head Office (H.O)' : workPlace[0])}
                                        {workPlace.length > 1 && `${workPlace.length} Sites Selected`}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Workplaces ({workplaces.length > 0 ? workplaces.length : 'All'})</SelectItem>
                                    <SelectItem value="Head Office">Head Office (H.O)</SelectItem>
                                    <SelectItem value="Project">All Project Sites</SelectItem>
                                    {workplaces.filter(w => w !== 'H.O' && w !== 'Head Office').map((w) => (
                                        <SelectItem key={w} value={w}>{w}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div data-tour="status-filter" className="md:col-span-2 lg:col-span-2 flex flex-col gap-2">
                            <Select 
                                value={status.length === 1 ? status[0] : (status.length > 1 ? '__multi__' : '__all__')} 
                                onValueChange={(v) => { 
                                    const next = v === '__all__' ? [] : [v]; 
                                    handleFilterUpdate({ status: next }); 
                                }}
                            >
                                <SelectTrigger className="w-full h-11 md:h-10 rounded-xl md:rounded-xs border-input bg-background text-foreground text-sm md:text-xs text-foreground/90">
                                    <SelectValue placeholder="All Statuses">
                                        {status.length === 0 && 'All Statuses'}
                                        {status.length === 1 && status[0]}
                                        {status.length > 1 && `${status.length} Statuses Selected`}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Statuses</SelectItem>
                                    <SelectItem value="Permanent">Permanent</SelectItem>
                                    <SelectItem value="Contract">Contract</SelectItem>
                                    <SelectItem value="Probation">Probation</SelectItem>
                                    <SelectItem value="Separated">Separated</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={() => handleFilterUpdate({ search })}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs h-11 px-4 text-sm font-bold rounded-xl"
                            >
                                Filter
                            </Button>
                        </div>
                    </div>

                    {/* Active Filters Pill Bar (Apple / DESIGN.md minimal pill chips) */}
                    {(departmentId.length > 0 || workPlace.length > 0 || status.length > 0 || position.length > 0 || search) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border/50 text-xs mt-3">
                            <span className="text-[11px] font-semibold text-muted-foreground mr-1">Active filters:</span>
                            {search && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted border border-border text-foreground text-[11px]">
                                    Search: &ldquo;{search}&rdquo;
                                    <button type="button" onClick={() => { setSearch(''); handleFilterUpdate({ search: '' }); }} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            {departmentId.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0066cc]/10 border border-[#0066cc]/20 text-[#0066cc] font-medium text-[11px]">
                                    Dept: {departmentId.length} selected
                                    <button type="button" onClick={() => handleFilterUpdate({ department_id: [] })} className="hover:opacity-75"><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            {workPlace.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0066cc]/10 border border-[#0066cc]/20 text-[#0066cc] font-medium text-[11px]">
                                    Workplace: {workPlace.length} selected
                                    <button type="button" onClick={() => handleFilterUpdate({ work_place: [] })} className="hover:opacity-75"><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            {status.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0066cc]/10 border border-[#0066cc]/20 text-[#0066cc] font-medium text-[11px]">
                                    Status: {status.join(', ')}
                                    <button type="button" onClick={() => handleFilterUpdate({ status: [] })} className="hover:opacity-75"><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            {position.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0066cc]/10 border border-[#0066cc]/20 text-[#0066cc] font-medium text-[11px]">
                                    Position: {position.length} selected
                                    <button type="button" onClick={() => handleFilterUpdate({ position: [] })} className="hover:opacity-75"><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={resetAllFilters}
                                className="text-[11px] text-muted-foreground hover:text-destructive underline ml-1 font-medium"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Comparison Data Table (Strictly Styled per DESIGN.md) */}
            <Card data-tour="data-table" className="border-border bg-card shadow-xs overflow-hidden shadow-sm">
                {viewMode === 'table' ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10 text-center">
                                <Checkbox
                                    checked={selectedIds.size > 0 && [...selectedIds].every((id) => employees.data.some((e) => e.id === id))}
                                    onCheckedChange={() => selectAllOnPage()}
                                    className="rounded border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                />
                            </TableHead>
                            <TableHead className="w-14 text-center">Photo</TableHead>
                            
                            <TableHead className="w-28">
                                <ExcelColumnFilter
                                    title="File no"
                                    enableSort
                                    sortKey="file_no"
                                    currentSortBy={sortBy}
                                    currentSortDir={sortDirection}
                                    onSort={handleSort}
                                />
                            </TableHead>

                            <TableHead>
                                <ExcelColumnFilter
                                    title="Staff name"
                                    enableSort
                                    sortKey="full_name"
                                    currentSortBy={sortBy}
                                    currentSortDir={sortDirection}
                                    onSort={handleSort}
                                />
                            </TableHead>

                            <TableHead>
                                <ExcelColumnFilter
                                    title="Department"
                                    columnKey="department_id"
                                    options={departmentOptions}
                                    selectedValues={departmentId}
                                    onApply={(vals) => handleFilterUpdate({ department_id: vals })}
                                    onReset={() => handleFilterUpdate({ department_id: [] })}
                                    enableSort
                                    sortKey="department_id"
                                    currentSortBy={sortBy}
                                    currentSortDir={sortDirection}
                                    onSort={handleSort}
                                />
                            </TableHead>

                            <TableHead>
                                <ExcelColumnFilter
                                    title="Position"
                                    columnKey="position"
                                    options={positionOptions}
                                    selectedValues={position}
                                    onApply={(vals) => handleFilterUpdate({ position: vals })}
                                    onReset={() => handleFilterUpdate({ position: [] })}
                                    enableSort
                                    sortKey="position"
                                    currentSortBy={sortBy}
                                    currentSortDir={sortDirection}
                                    onSort={handleSort}
                                />
                            </TableHead>

                            <TableHead>
                                <ExcelColumnFilter
                                    title="Work place"
                                    columnKey="work_place"
                                    options={workplaceOptions}
                                    selectedValues={workPlace}
                                    onApply={(vals) => handleFilterUpdate({ work_place: vals })}
                                    onReset={() => handleFilterUpdate({ work_place: [] })}
                                    enableSort
                                    sortKey="work_place"
                                    currentSortBy={sortBy}
                                    currentSortDir={sortDirection}
                                    onSort={handleSort}
                                />
                            </TableHead>

                            <TableHead>
                                <ExcelColumnFilter
                                    title="Employment date (E.C)"
                                    enableSort
                                    sortKey="employment_date_ec"
                                    currentSortBy={sortBy}
                                    currentSortDir={sortDirection}
                                    onSort={handleSort}
                                />
                            </TableHead>

                            <TableHead className="text-right">Total salary</TableHead>

                            <TableHead>
                                <ExcelColumnFilter
                                    title="Status"
                                    columnKey="status"
                                    options={statusOptions}
                                    selectedValues={status}
                                    onApply={(vals) => handleFilterUpdate({ status: vals })}
                                    onReset={() => handleFilterUpdate({ status: [] })}
                                    enableSort
                                    sortKey="status"
                                    currentSortBy={sortBy}
                                    currentSortDir={sortDirection}
                                    onSort={handleSort}
                                />
                            </TableHead>

                            <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center py-16">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                            <Eye className="w-8 h-8" />
                                        </div>
                                        <h4 className="text-sm font-bold text-foreground">No personnel records found</h4>
                                        <p className="text-xs text-muted-foreground max-w-xs">
                                            Try broadening your search or resetting the filters below.
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={resetAllFilters}
                                            className="text-xs border-border text-primary hover:bg-muted/40"
                                        >
                                            Reset filters
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.data.map((emp, idx) => (
                                <TableRow 
                                    key={emp.id} 
                                    className={`hover:bg-muted/40/50 transition-colors border-b border-border/60/50 ${
                                        emp.status === 'Separated' ? 'opacity-60 bg-[#fafafa]' : ''
                                    } ${emp.status === 'Probation' ? 'border-l-2 border-l-[#b45309]' : ''} ${isSelected(emp.id) ? 'bg-muted/40' : ''}`}
                                >
                                    <TableCell className="w-10 text-center py-2.5">
                                        <Checkbox
                                            checked={isSelected(emp.id)}
                                            onCheckedChange={() => toggleSelect(emp.id)}
                                            className="rounded border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                        />
                                    </TableCell>
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
                                    <TableCell className="text-xs text-muted-foreground">
                                        {emp.employment_date_ec}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-foreground text-sm">
                                        {formatCurrency(emp.current_salary?.total_salary || emp.current_salary?.basic_salary)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(emp.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setPeekEmployee(emp)}
                                                title="Quick Preview Drawer"
                                                className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-muted/40"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </Button>
                                            <Link href={route('employees.show', emp.id)}>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    {...(idx === 0 ? { 'data-tour': 'first-dossier-btn' } : {})}
                                                    className="border-border bg-card hover:bg-muted text-primary font-semibold text-xs h-8 gap-1.5 rounded-xs"
                                                >
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
                            <div className="col-span-full py-16 flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                    <Eye className="w-8 h-8" />
                                </div>
                                <h4 className="text-sm font-bold text-foreground">No personnel records found</h4>
                                <p className="text-xs text-muted-foreground max-w-xs text-center">
                                    Try broadening your search or resetting the filters below.
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={resetAllFilters}
                                    className="text-xs border-border text-primary hover:bg-muted/40"
                                >
                                    Reset filters
                                </Button>
                            </div>
                        ) : (
                            employees.data.map((emp) => (
                                <div
                                    key={emp.id}
                                    className="rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md hover:border-primary/40"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="shrink-0">
                                            <EmployeeAvatar name={emp.full_name} src={emp.profile_photo_url} size="lg" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="truncate text-base font-bold text-foreground">{emp.full_name}</h4>
                                                {getStatusBadge(emp.status)}
                                            </div>
                                            <p className="text-[11px] font-semibold text-primary">
                                                {emp.file_no} Â· {emp.gender}
                                            </p>
                                            <p className="mt-2 truncate text-sm font-medium text-foreground/90">{emp.position}</p>
                                            <p className="truncate text-[11px] text-muted-foreground">
                                                {emp.department?.name || 'General Operations'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-muted-foreground">
                                        <span className="inline-flex items-center gap-1.5">
                                            <MapPin className="h-3 w-3" />
                                            {emp.work_place}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3" />
                                            {emp.employment_date_ec} E.C.
                                        </span>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between gap-2 border-t border-border/60 pt-4">
                                        <span className="text-sm font-bold text-foreground">
                                            {formatCurrency(emp.current_salary?.total_salary || emp.current_salary?.basic_salary)}
                                        </span>
                                        <Link href={route('employees.show', emp.id)} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                                            <Eye className="w-3 h-3" />
                                            View profile
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Pagination */}
                {employees.last_page > 1 && (
                    <div data-tour="pagination" className="p-4 border-t border-border/60 bg-muted/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground/90">Showing</span>
                            <strong className="text-foreground">{employees.from || 0}</strong>
                            <span className="text-muted-foreground">to</span>
                            <strong className="text-foreground">{employees.to || 0}</strong>
                            <span className="text-muted-foreground">of</span>
                            <strong className="text-foreground">{employees.total}</strong>
                            <span className="font-medium text-foreground/90">records</span>
                        </div>
                        <div className="flex gap-1">
                            {employees.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveState
                                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium border transition-colors ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                                            : link.url
                                                ? 'bg-card text-foreground border-border hover:bg-muted hover:text-primary'
                                                : 'bg-muted/40 text-muted-foreground/40 border-border/40 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Excel Sync & Ingestion Modal (Shadcn Dialog) */}
            <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
                <DialogContent className="max-w-2xl bg-card border-border text-card-foreground p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-primary" />
                            Excel Master List Sync &amp; Ingestion
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Ingest or update staff records directly from official master spreadsheet with automated column mapping.
                        </DialogDescription>
                    </DialogHeader>

                    {!previewData ? (
                        <div className="space-y-4 pt-2">
                            <div className="border-2 border-dashed border-input bg-background text-foreground/50 rounded-lg p-6 text-center hover:border-[#0066cc] transition-colors">
                                <UploadCloud className="w-10 h-10 text-primary mx-auto mb-2" />
                                <p className="text-xs font-bold text-foreground mb-1">
                                    Select an Excel (.xlsx, .xls) or CSV spreadsheet file
                                </p>
                                <p className="text-[11px] text-muted-foreground mb-4">
                                    Accepts 2019/2025 E.C. Master List formats with column mapping.
                                </p>
                                <Input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    className="text-xs text-foreground/90 file:mr-3 file:py-1.5 file:px-3 file:rounded-xs file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-[#0071e3] cursor-pointer h-auto py-1"
                                />
                                {importFile && (
                                    <p className="mt-3 text-xs font-semibold text-primary">
                                        Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                                    </p>
                                )}
                            </div>

                            {importError && (
                                <div className="p-3 bg-[#fdf2f2] border border-[#f8b4b4] rounded-xs text-xs text-[#de2828]">
                                    {importError}
                                </div>
                            )}

                            <DialogFooter className="flex justify-between items-center pt-3 border-t border-border/60">
                                <a
                                    href={route('import.template')}
                                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download Sample Template
                                </a>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowImportModal(false)}
                                        className="text-xs border-border"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={!importFile || isUploading}
                                        onClick={handleUploadPreview}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs text-xs font-bold gap-1.5"
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
                            </DialogFooter>
                        </div>
                    ) : (
                        <div className="space-y-4 pt-2">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="p-2.5 bg-muted/40 border border-border rounded-xs">
                                    <p className="text-[10px] font-bold uppercase text-primary">Total Scanned</p>
                                    <p className="text-xl font-bold text-foreground">{previewData.summary.total_scanned}</p>
                                </div>
                                <div className="p-2.5 bg-muted/40 border border-border rounded-xs">
                                    <p className="text-[10px] font-bold uppercase text-primary">New Staff</p>
                                    <p className="text-xl font-bold text-primary">{previewData.summary.new_count}</p>
                                </div>
                                <div className="p-2.5 bg-muted/40 border border-border rounded-xs">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Updates</p>
                                    <p className="text-xl font-bold text-foreground/90">{previewData.summary.update_count}</p>
                                </div>
                                <div className={`p-2.5 border rounded-xs ${previewData.summary.error_count > 0 ? 'bg-[#fdf2f2] border-[#f8b4b4]' : 'bg-muted/40 border-border'}`}>
                                    <p className="text-[10px] font-bold uppercase text-[#de2828]">Errors</p>
                                    <p className={`text-xl font-bold ${previewData.summary.error_count > 0 ? 'text-[#de2828]' : 'text-muted-foreground'}`}>
                                        {previewData.summary.error_count}
                                    </p>
                                </div>
                            </div>

                            {/* Preview Samples Table */}
                            <div className="border border-border rounded-xs overflow-hidden max-h-56 overflow-x-auto overflow-y-auto">
                                <table className="w-full min-w-[520px] text-left text-xs">
                                    <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="p-2 font-bold">File no</th>
                                            <th className="p-2 font-bold">Full name</th>
                                            <th className="p-2 font-bold">Department</th>
                                            <th className="p-2 font-bold">Position</th>
                                            <th className="p-2 font-bold">Salary</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e8e8ed]">
                                        {previewData.all_valid_payload.slice(0, 8).map((r: any, i: number) => (
                                            <tr key={i} className="hover:bg-muted/40/40">
                                                <td className="p-2 font-bold text-primary">{r.file_no}</td>
                                                <td className="p-2 font-semibold text-foreground">{r.full_name}</td>
                                                <td className="p-2 text-foreground/90">{r.department_name}</td>
                                                <td className="p-2 text-muted-foreground">{r.position}</td>
                                                <td className="p-2 font-bold text-foreground">{formatCurrency(r.basic_salary)}</td>
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

                            <DialogFooter className="flex justify-between items-center pt-3 border-t border-border/60">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPreviewData(null)}
                                    className="text-xs border-border"
                                >
                                    Re-upload Different File
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleExecuteImport}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs text-xs font-bold gap-1.5"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Confirm &amp; Sync {previewData.all_valid_payload.length} Records
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Quick Employee Peek Sheet Drawer */}
            <Sheet open={Boolean(peekEmployee)} onOpenChange={(open) => !open && setPeekEmployee(null)}>
                <SheetContent className="bg-card border-border text-card-foreground p-6 sm:max-w-md overflow-y-auto">
                    {peekEmployee && (
                        <div className="space-y-6 pt-2">
                            <SheetHeader className="text-left">
                                <div className="flex items-center gap-3">
                                    <EmployeeAvatar
                                        name={peekEmployee.full_name}
                                        src={peekEmployee.profile_photo_url}
                                        size="xl"
                                    />
                                    <div>
                                        <SheetTitle className="text-base font-bold text-foreground">
                                            {peekEmployee.full_name}
                                        </SheetTitle>
                                        <SheetDescription className="text-xs text-muted-foreground">
                                            {peekEmployee.file_no} &bull; {peekEmployee.position}
                                        </SheetDescription>
                                    </div>
                                </div>
                            </SheetHeader>

                            <div className="space-y-3 divide-y divide-[#e8e8ed] text-xs">
                                <div className="pt-2 flex justify-between">
                                    <span className="text-muted-foreground">Department:</span>
                                    <span className="font-semibold text-foreground">{peekEmployee.department?.name || 'General Operations'}</span>
                                </div>
                                <div className="pt-2 flex justify-between">
                                    <span className="text-muted-foreground">Work Site:</span>
                                    <span className="font-semibold text-foreground">{peekEmployee.work_place}</span>
                                </div>
                                <div className="pt-2 flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <span>{getStatusBadge(peekEmployee.status)}</span>
                                </div>
                                <div className="pt-2 flex justify-between">
                                    <span className="text-muted-foreground">Employment Date (E.C.):</span>
                                    <span className="font-semibold text-foreground">{peekEmployee.employment_date_ec}</span>
                                </div>
                                <div className="pt-2 flex justify-between">
                                    <span className="text-muted-foreground">Compensation:</span>
                                    <span className="font-bold text-primary">{formatCurrency(peekEmployee.current_salary?.total_salary || peekEmployee.current_salary?.basic_salary)}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-border/60">
                                <Link href={route('employees.edit', peekEmployee.id)} className="flex-1">
                                    <Button variant="outline" className="w-full text-xs font-semibold border-border bg-card hover:bg-muted">
                                        Edit Profile
                                    </Button>
                                </Link>
                                <Link href={route('employees.show', peekEmployee.id)} className="flex-1">
                                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs text-xs font-bold">
                                        Full Dossier
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Bottom Multi-Select Floating Command Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-black text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
                    <span className="text-xs font-semibold">
                        {selectedIds.size} staff member{selectedIds.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="h-4 w-px bg-white/20" />
                    <a
                        href={route('export.employees', {
                            ids: Array.from(selectedIds).join(','),
                        })}
                        onClick={() => {
                            toast.success(`Exporting ${selectedIds.size} selected employee records...`);
                        }}
                        className="text-xs font-bold text-[#d2d2d7] hover:text-white flex items-center gap-1.5 cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Selected (CSV)</span>
                    </a>
                    <button
                        type="button"
                        onClick={() => setSelectedIds(new Set())}
                        className="text-xs text-muted-foreground/60 hover:text-white ml-2 cursor-pointer"
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Interactive Element-Spotlight Joyride Tour */}
            <InteractiveTour
                steps={staffDirectoryTourSteps}
                isOpen={isTourOpen}
                onClose={() => setIsTourOpen(false)}
                tourTitle="Staff directory tour"
            />
        </AuthenticatedLayout>
    );
}



