import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InteractiveTour, { TourStep } from '@/Components/InteractiveTour';
import { Card } from '@/Components/ui/card';
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
    Search, 
    CheckCircle2, 
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    FileSpreadsheet,
    UploadCloud,
    X,
    ChevronDown,
    Loader2,
    Copy,
    Check,
    ArrowUpRight,
    Briefcase,
    Building2,
    CreditCard,
    Sparkles,
    Eye
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
    const [copiedFileNo, setCopiedFileNo] = useState<string | null>(null);
    const [peekEmployee, setPeekEmployee] = useState<EmployeeItem | null>(null);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Sync filters state from Inertia query props
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
        }, 250);
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

    // Keyboard Shortcuts: '/' to focus search, 'Escape' to clear
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement !== searchInputRef.current && !(document.activeElement instanceof HTMLInputElement) && !(document.activeElement instanceof HTMLTextAreaElement)) {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'Escape') {
                if (search) {
                    setSearch('');
                    debouncedFilter({ search: '' });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [search, debouncedFilter]);

    // Copy to clipboard helper
    const copyFileNo = (fileNo: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(fileNo);
        setCopiedFileNo(fileNo);
        toast.success(`Copied ${fileNo} to clipboard`);
        setTimeout(() => setCopiedFileNo(null), 1800);
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
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Permanent
                    </span>
                );
            case 'Contract':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                        Contract
                    </span>
                );
            case 'Probation':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        Probation
                    </span>
                );
            case 'Separated':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                        Separated
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                        {empStatus}
                    </span>
                );
        }
    };

    const activeFilterCount = (departmentId.length > 0 ? 1 : 0) + (workPlace.length > 0 ? 1 : 0) + (position.length > 0 ? 1 : 0) + (search ? 1 : 0);

    return (
        <AuthenticatedLayout
            title="Staff Directory"
            subtitle="Search, verify, and inspect verified personnel records across Head Office and active project sites."
        >
            <Head title="Staff Directory - Elhadar Engineering HRMS" />

            {/* Top Workspace Command Strip: Unified Segments & Utility Tools */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 mb-5">
                {/* 1. Primary Status Segmented Control (Minimalist, Apple-style pills) */}
                <div data-tour="lifecycle-tabs" className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 dark:bg-muted/30 border border-border/80 rounded-xl">
                    {[
                        { label: 'All Staff', val: '', count: stats.total_headcount },
                        { label: 'Permanent', val: 'Permanent', count: stats.permanent_count },
                        { label: 'Probation Pipeline', val: 'Probation', count: stats.probation_count },
                        { label: 'Contracts', val: 'Contract', count: stats.contract_count },
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
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                                    isActive
                                        ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-md ${
                                    isActive 
                                        ? 'bg-primary/10 text-primary font-semibold' 
                                        : hasAttention 
                                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold' 
                                            : 'text-muted-foreground'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* 2. Utility Actions: Export, Excel Sync, Table/Grid View Switcher */}
                <div className="flex items-center gap-2 self-end lg:self-auto">
                    {/* Excel Export Menu */}
                    <div className="relative">
                        <Button
                            type="button"
                            onClick={() => setExportMenuOpen(!exportMenuOpen)}
                            variant="outline"
                            size="sm"
                            className="border-border bg-card text-foreground hover:bg-muted font-medium text-xs gap-1.5 rounded-lg shadow-xs h-9 px-3"
                        >
                            <Download className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Export</span>
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        </Button>
                        {exportMenuOpen && (
                            <div className="absolute right-0 mt-1 w-56 bg-card border border-border rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
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
                                    <span>Export Active Roster (CSV)</span>
                                </a>
                                <div className="border-t border-border my-1" />
                                <a
                                    href={route('import.template')}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted"
                                    onClick={() => setExportMenuOpen(false)}
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
                                    <span>Blank CSV Template</span>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Excel Master Sync */}
                    <Button
                        type="button"
                        onClick={() => setShowImportModal(true)}
                        variant="outline"
                        size="sm"
                        className="border-border bg-card text-foreground hover:bg-muted font-medium text-xs gap-1.5 rounded-lg shadow-xs h-9 px-3"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Excel Sync</span>
                    </Button>

                    {/* Table / Grid Mode Switcher */}
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                </div>
            </div>

            {/* Unified Filter Bar (No heavy cards; clean single-tier command strip) */}
            <div data-tour="filters-bar" className="mb-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Instant Search with Keyboard Shortcut Indicator */}
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Search name, file no, phone, TIN, POESSA..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                debouncedFilter({ search: e.target.value });
                            }}
                            className="pl-9 pr-14 bg-card text-foreground border-border text-xs h-9 rounded-lg focus-visible:ring-1 focus-visible:ring-primary shadow-2xs placeholder:text-muted-foreground/70"
                        />
                        <div className="absolute right-2.5 top-2 flex items-center gap-1">
                            {search ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        debouncedFilter({ search: '' });
                                    }}
                                    className="text-muted-foreground hover:text-foreground p-0.5"
                                    title="Clear search"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <kbd className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground select-none pointer-events-none">
                                    /
                                </kbd>
                            )}
                        </div>
                    </div>

                    {/* Department Dropdown */}
                    <div className="w-44 sm:w-48">
                        <Select 
                            value={departmentId.length === 1 ? departmentId[0] : (departmentId.length > 1 ? '__multi__' : '__all__')} 
                            onValueChange={(v) => { 
                                const next = v === '__all__' ? [] : [v]; 
                                handleFilterUpdate({ department_id: next }); 
                            }}
                        >
                            <SelectTrigger className="w-full h-9 rounded-lg border-border bg-card text-foreground text-xs shadow-2xs">
                                <SelectValue placeholder={`All Departments (${departments.length})`}>
                                    {departmentId.length === 0 && `All Departments (${departments.length})`}
                                    {departmentId.length === 1 && (departments.find(d => String(d.id) === departmentId[0])?.name || departmentId[0])}
                                    {departmentId.length > 1 && `${departmentId.length} Depts Selected`}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                <SelectItem value="__all__">All Departments ({departments.length})</SelectItem>
                                {departments.map((d) => (
                                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Workplace Dropdown */}
                    <div className="w-40 sm:w-44">
                        <Select 
                            value={workPlace.length === 1 ? workPlace[0] : (workPlace.length > 1 ? '__multi__' : '__all__')} 
                            onValueChange={(v) => { 
                                const next = v === '__all__' ? [] : [v]; 
                                handleFilterUpdate({ work_place: next }); 
                            }}
                        >
                            <SelectTrigger className="w-full h-9 rounded-lg border-border bg-card text-foreground text-xs shadow-2xs">
                                <SelectValue placeholder="All Workplaces">
                                    {workPlace.length === 0 && `All Workplaces (${workplaces.length > 0 ? workplaces.length : 'All'})`}
                                    {workPlace.length === 1 && (workPlace[0] === 'H.O' ? 'Head Office' : workPlace[0])}
                                    {workPlace.length > 1 && `${workPlace.length} Sites Selected`}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                <SelectItem value="__all__">All Workplaces ({workplaces.length > 0 ? workplaces.length : 'All'})</SelectItem>
                                <SelectItem value="Head Office">Head Office (H.O)</SelectItem>
                                <SelectItem value="Project">All Project Sites</SelectItem>
                                {workplaces.filter(w => w !== 'H.O' && w !== 'Head Office').map((w) => (
                                    <SelectItem key={w} value={w}>{w}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Active Filters Clear Shortcut */}
                    {activeFilterCount > 0 && (
                        <button
                            type="button"
                            onClick={resetAllFilters}
                            className="text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1 transition-colors"
                        >
                            Reset filters
                        </button>
                    )}
                </div>

                {/* Active Filter Chips */}
                {(departmentId.length > 0 || workPlace.length > 0 || position.length > 0) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                        <span className="text-xs font-medium text-muted-foreground">Filtered by:</span>
                        {departmentId.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border text-foreground text-xs">
                                Department: {departmentId.length === 1 ? departments.find(d => String(d.id) === departmentId[0])?.name : `${departmentId.length} selected`}
                                <button type="button" onClick={() => handleFilterUpdate({ department_id: [] })} className="hover:text-foreground text-muted-foreground"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        {workPlace.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border text-foreground text-xs">
                                Workplace: {workPlace.join(', ')}
                                <button type="button" onClick={() => handleFilterUpdate({ work_place: [] })} className="hover:text-foreground text-muted-foreground"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        {position.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border text-foreground text-xs">
                                Position: {position.length} selected
                                <button type="button" onClick={() => handleFilterUpdate({ position: [] })} className="hover:text-foreground text-muted-foreground"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* High-Scannability Master Data Table (Strictly Optimized per Impeccable Operate Mode) */}
            <Card data-tour="data-table" className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
                {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                                <TableHead className="w-10 text-center px-3 py-3">
                                    <Checkbox
                                        checked={selectedIds.size > 0 && [...selectedIds].every((id) => employees.data.some((e) => e.id === id))}
                                        onCheckedChange={() => selectAllOnPage()}
                                        className="rounded border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                    />
                                </TableHead>
                                
                                <TableHead className="w-24">
                                    <ExcelColumnFilter
                                        title="File no"
                                        enableSort
                                        sortKey="file_no"
                                        currentSortBy={sortBy}
                                        currentSortDir={sortDirection}
                                        onSort={handleSort}
                                    />
                                </TableHead>

                                <TableHead className="min-w-[190px]">
                                    <ExcelColumnFilter
                                        title="Staff name"
                                        enableSort
                                        sortKey="full_name"
                                        currentSortBy={sortBy}
                                        currentSortDir={sortDirection}
                                        onSort={handleSort}
                                    />
                                </TableHead>

                                <TableHead className="min-w-[150px]">
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

                                <TableHead className="min-w-[150px]">
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

                                <TableHead className="min-w-[130px]">
                                    <ExcelColumnFilter
                                        title="Workplace"
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

                                <TableHead className="w-28">
                                    <ExcelColumnFilter
                                        title="Hired (E.C)"
                                        enableSort
                                        sortKey="employment_date_ec"
                                        currentSortBy={sortBy}
                                        currentSortDir={sortDirection}
                                        onSort={handleSort}
                                    />
                                </TableHead>

                                <TableHead className="text-right w-28 font-medium">Total salary</TableHead>

                                <TableHead className="w-28">
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

                                <TableHead className="text-right w-20 px-4"><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-16">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                <Search className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-sm font-semibold text-foreground">No personnel records match filters</h4>
                                            <p className="text-xs text-muted-foreground max-w-xs">
                                                Try broadening your search keywords or resetting specific filters.
                                            </p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={resetAllFilters}
                                                className="text-xs border-border text-foreground hover:bg-muted"
                                            >
                                                Reset all filters
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.data.map((emp, idx) => (
                                    <TableRow 
                                        key={emp.id} 
                                        onClick={() => router.visit(route('employees.show', emp.id))}
                                        className={`group cursor-pointer hover:bg-muted/40 transition-colors border-b border-border/60 ${
                                            emp.status === 'Separated' ? 'opacity-60 bg-muted/10' : ''
                                        } ${isSelected(emp.id) ? 'bg-primary/5' : ''}`}
                                    >
                                        {/* Checkbox */}
                                        <TableCell className="text-center px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={isSelected(emp.id)}
                                                onCheckedChange={() => toggleSelect(emp.id)}
                                                className="rounded border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                            />
                                        </TableCell>

                                        {/* File No with 1-Click Copy */}
                                        <TableCell className="py-2.5">
                                            <button
                                                type="button"
                                                onClick={(e) => copyFileNo(emp.file_no, e)}
                                                title="Click to copy file number"
                                                className="font-mono text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 group/btn"
                                            >
                                                <span>{emp.file_no}</span>
                                                {copiedFileNo === emp.file_no ? (
                                                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                ) : (
                                                    <Copy className="w-2.5 h-2.5 opacity-0 group-hover/btn:opacity-100 transition-opacity text-muted-foreground" />
                                                )}
                                            </button>
                                        </TableCell>

                                        {/* Staff Name with compact avatar */}
                                        <TableCell className="py-2.5">
                                            <div className="flex items-center gap-2">
                                                <EmployeeAvatar name={emp.full_name} src={emp.profile_photo_url} size="sm" className="shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="font-medium text-foreground text-xs truncate max-w-[160px] sm:max-w-[200px]">
                                                        {emp.full_name}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Department */}
                                        <TableCell className="text-xs text-foreground/80 py-2.5 truncate max-w-[150px]">
                                            {emp.department?.name || 'General Operations'}
                                        </TableCell>

                                        {/* Position */}
                                        <TableCell className="text-xs text-foreground font-normal py-2.5 truncate max-w-[150px]">
                                            {emp.position}
                                        </TableCell>

                                        {/* Workplace */}
                                        <TableCell className="py-2.5">
                                            <span className="inline-flex items-center gap-1.5 text-xs text-foreground/90">
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                    emp.work_place.toLowerCase().includes('head') || emp.work_place.includes('H.O') 
                                                        ? 'bg-purple-600 dark:bg-purple-400' 
                                                        : 'bg-sky-600 dark:bg-sky-400'
                                                }`} />
                                                <span className="truncate max-w-[110px]">{emp.work_place}</span>
                                            </span>
                                        </TableCell>

                                        {/* Employment Date E.C */}
                                        <TableCell className="text-xs font-mono text-muted-foreground py-2.5">
                                            {emp.employment_date_ec}
                                        </TableCell>

                                        {/* Total Salary (Right-aligned, tabular monospace) */}
                                        <TableCell className="text-right font-mono text-xs font-semibold text-foreground py-2.5 tabular-nums">
                                            {formatCurrency(emp.current_salary?.total_salary || emp.current_salary?.basic_salary)}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="py-2.5">
                                            {getStatusBadge(emp.status)}
                                        </TableCell>

                                        {/* Quick Actions */}
                                        <TableCell className="text-right py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end">
                                                <Link href={route('employees.show', emp.id)}>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        {...(idx === 0 ? { 'data-tour': 'first-dossier-btn' } : {})}
                                                        title="Open full employee profile"
                                                        className="h-7 px-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 rounded-md inline-flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <span>View Profile</span>
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                ) : (
                    /* Grid Card View */
                    <div className="grid grid-cols-1 gap-3.5 p-4 sm:grid-cols-2 xl:grid-cols-3">
                        {employees.data.length === 0 ? (
                            <div className="col-span-full py-16 flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                    <Search className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-semibold text-foreground">No personnel records match filters</h4>
                                <p className="text-xs text-muted-foreground max-w-xs text-center">
                                    Try broadening your search keywords or resetting specific filters.
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={resetAllFilters}
                                    className="text-xs border-border text-foreground hover:bg-muted"
                                >
                                    Reset all filters
                                </Button>
                            </div>
                        ) : (
                            employees.data.map((emp) => (
                                <div
                                    key={emp.id}
                                    onClick={() => router.visit(route('employees.show', emp.id))}
                                    className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/40 cursor-pointer flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <EmployeeAvatar name={emp.full_name} src={emp.profile_photo_url} size="md" />
                                                <div>
                                                    <h4 className="text-xs font-semibold text-foreground leading-tight">{emp.full_name}</h4>
                                                    <span className="font-mono text-[11px] font-medium text-primary">{emp.file_no} &bull; {emp.gender}</span>
                                                </div>
                                            </div>
                                            {getStatusBadge(emp.status)}
                                        </div>

                                        <div className="space-y-1 text-xs text-muted-foreground pt-1">
                                            <p className="font-medium text-foreground truncate">{emp.position}</p>
                                            <p className="truncate text-[11px]">{emp.department?.name || 'General Operations'}</p>
                                            <div className="flex items-center gap-3 pt-2 text-[11px]">
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {emp.work_place}
                                                </span>
                                                <span className="inline-flex items-center gap-1 font-mono">
                                                    <Calendar className="w-3 h-3" />
                                                    {emp.employment_date_ec} E.C.
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                                        <span className="font-mono text-xs font-semibold text-foreground">
                                            {formatCurrency(emp.current_salary?.total_salary || emp.current_salary?.basic_salary)}
                                        </span>
                                        <Link 
                                            href={route('employees.show', emp.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-xs font-medium text-primary inline-flex items-center gap-1 hover:underline cursor-pointer"
                                        >
                                            <span>View Profile</span>
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Streamlined Pagination Footer */}
                {employees.last_page > 1 && (
                    <div className="px-4 py-3 border-t border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <span>Showing</span>
                            <strong className="text-foreground font-semibold">{employees.from || 0}</strong>
                            <span>to</span>
                            <strong className="text-foreground font-semibold">{employees.to || 0}</strong>
                            <span>of</span>
                            <strong className="text-foreground font-semibold">{employees.total}</strong>
                            <span>records</span>
                        </div>

                        {/* Pagination Links */}
                        <div className="flex items-center gap-1">
                            {employees.links.map((link, idx) => {
                                const isPrev = link.label.includes('Previous') || link.label.includes('&laquo;');
                                const isNext = link.label.includes('Next') || link.label.includes('&raquo;');
                                const isDots = link.label === '...';

                                if (isDots) {
                                    return (
                                        <span key={idx} className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground">
                                            ...
                                        </span>
                                    );
                                }

                                return (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveState
                                        className={`h-8 px-2.5 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                                            link.active
                                                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                                : link.url
                                                    ? 'bg-card text-foreground border border-border hover:bg-muted'
                                                    : 'text-muted-foreground/40 cursor-not-allowed pointer-events-none'
                                        }`}
                                    >
                                        {isPrev ? 'Prev' : isNext ? 'Next' : link.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Card>

            {/* Excel Sync & Ingestion Modal */}
            <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
                <DialogContent className="max-w-2xl bg-card border-border text-card-foreground p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-primary" />
                            Excel Master List Sync &amp; Ingestion
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Ingest or update staff records directly from official master spreadsheet with automated column mapping.
                        </DialogDescription>
                    </DialogHeader>

                    {!previewData ? (
                        <div className="space-y-4 pt-2">
                            <div className="border-2 border-dashed border-input bg-muted/20 rounded-xl p-6 text-center hover:border-primary transition-colors">
                                <UploadCloud className="w-10 h-10 text-primary mx-auto mb-2" />
                                <p className="text-xs font-semibold text-foreground mb-1">
                                    Select an Excel (.xlsx, .xls) or CSV spreadsheet file
                                </p>
                                <p className="text-[11px] text-muted-foreground mb-4">
                                    Accepts 2019/2025 E.C. Master List formats with column mapping.
                                </p>
                                <Input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    className="text-xs text-foreground/90 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer h-auto py-1"
                                />
                                {importFile && (
                                    <p className="mt-3 text-xs font-semibold text-primary">
                                        Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                                    </p>
                                )}
                            </div>

                            {importError && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
                                    {importError}
                                </div>
                            )}

                            <DialogFooter className="flex justify-between items-center pt-3 border-t border-border">
                                <a
                                    href={route('import.template')}
                                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download Sample Template
                                </a>
                                <div className="flex gap-2">
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
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs text-xs font-semibold gap-1.5"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Validating...
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
                                <div className="p-2.5 bg-muted/40 border border-border rounded-lg">
                                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Scanned</p>
                                    <p className="text-xl font-bold text-foreground">{previewData.summary.total_scanned}</p>
                                </div>
                                <div className="p-2.5 bg-muted/40 border border-border rounded-lg">
                                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">New Staff</p>
                                    <p className="text-xl font-bold text-primary">{previewData.summary.new_count}</p>
                                </div>
                                <div className="p-2.5 bg-muted/40 border border-border rounded-lg">
                                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Updates</p>
                                    <p className="text-xl font-bold text-foreground">{previewData.summary.update_count}</p>
                                </div>
                                <div className={`p-2.5 border rounded-lg ${previewData.summary.error_count > 0 ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/40 border-border'}`}>
                                    <p className="text-[10px] font-semibold uppercase text-destructive">Errors</p>
                                    <p className={`text-xl font-bold ${previewData.summary.error_count > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                        {previewData.summary.error_count}
                                    </p>
                                </div>
                            </div>

                            {/* Preview Samples Table */}
                            <div className="border border-border rounded-lg overflow-hidden max-h-56 overflow-x-auto overflow-y-auto">
                                <table className="w-full min-w-[500px] text-left text-xs">
                                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="p-2 font-semibold">File no</th>
                                            <th className="p-2 font-semibold">Full name</th>
                                            <th className="p-2 font-semibold">Department</th>
                                            <th className="p-2 font-semibold">Position</th>
                                            <th className="p-2 font-semibold text-right">Salary</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {previewData.all_valid_payload.slice(0, 8).map((r: any, i: number) => (
                                            <tr key={i} className="hover:bg-muted/30">
                                                <td className="p-2 font-mono font-semibold text-primary">{r.file_no}</td>
                                                <td className="p-2 font-medium text-foreground">{r.full_name}</td>
                                                <td className="p-2 text-foreground/80">{r.department_name}</td>
                                                <td className="p-2 text-muted-foreground">{r.position}</td>
                                                <td className="p-2 font-mono font-semibold text-foreground text-right">{formatCurrency(r.basic_salary)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <DialogFooter className="flex justify-between items-center pt-3 border-t border-border">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPreviewData(null)}
                                    className="text-xs border-border"
                                >
                                    Re-upload File
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleExecuteImport}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs text-xs font-semibold gap-1.5"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Confirm &amp; Sync {previewData.all_valid_payload.length} Records
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Bottom Multi-Select Floating Command Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-950 dark:bg-zinc-900 text-white px-5 py-2.5 rounded-full shadow-2xl border border-white/10 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
                    <span className="text-xs font-medium">
                        <strong className="text-white font-semibold">{selectedIds.size}</strong> staff selected
                    </span>
                    <div className="h-3.5 w-px bg-white/20" />
                    <a
                        href={route('export.employees', {
                            ids: Array.from(selectedIds).join(','),
                        })}
                        onClick={() => {
                            toast.success(`Exporting ${selectedIds.size} selected employee records...`);
                        }}
                        className="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                    </a>
                    <button
                        type="button"
                        onClick={() => setSelectedIds(new Set())}
                        className="text-xs text-zinc-400 hover:text-white ml-2 transition-colors cursor-pointer"
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
