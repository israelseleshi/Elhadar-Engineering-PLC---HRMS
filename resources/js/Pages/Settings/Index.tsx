import { useMemo, useState, type FormEvent } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/boardui/components/base/buttons/button';
import { Input } from '@/Components/boardui/components/base/input/input';
import { Textarea } from '@/Components/boardui/components/base/textarea/textarea';
import { Select, SelectItem } from '@/Components/boardui/components/base/select/select';
import { SearchField } from '@/Components/boardui/components/base/search-field/search-field';
import {
    SegmentedControl,
    SegmentedControlItem,
} from '@/Components/boardui/components/base/segmented-control/segmented-control';
import { Switch } from '@/Components/boardui/components/base/switch/switch';
import { Badge } from '@/Components/boardui/components/base/badges/badge';
import { Chip } from '@/Components/boardui/components/base/badges/chip';
import { StatusDot } from '@/Components/boardui/components/base/badges/status-dot';
import {
    AlertDialog,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
} from '@/Components/boardui/components/base/modal/modal';
import {
    RiAddLine,
    RiAlertLine,
    RiBuilding2Line,
    RiBuilding4Line,
    RiChat3Line,
    RiDeleteBinLine,
    RiEditLine,
    RiErrorWarningLine,
    RiMapPinLine,
    RiRestartLine,
    RiSaveLine,
    RiScales3Line,
    RiShieldCheckLine,
    RiStackLine,
    RiTeamLine,
    RiTimerLine,
} from '@remixicon/react';

type SettingsTab = 'workplaces' | 'departments' | 'statutory';
type WorkplaceFilter = 'all' | 'active' | 'Project' | 'Head Office';
type DepartmentFilter = 'all' | 'active' | 'inactive';

interface SettingItem {
    key: string;
    value: string;
    data_type: string;
    article: string;
    description: string;
    unit: string;
}

interface DepartmentItem {
    id: number;
    name: string;
    code: string | null;
    description: string | null;
    is_active: boolean;
    total_employees_count: number;
    active_employees_count: number;
    chat_channel_metadata?: {
        id: number;
        department_id: number;
        slug: string;
    } | null;
}

interface WorkplaceItem {
    id: number;
    name: string;
    code: string | null;
    type: 'Head Office' | 'Project';
    location: string | null;
    description: string | null;
    is_active: boolean;
    total_employees_count: number;
    active_employees_count: number;
}

interface Props {
    groupedSettings: Record<string, SettingItem[]>;
    departments: DepartmentItem[];
    workplaces: WorkplaceItem[];
}

function getInitialTab(): SettingsTab {
    if (typeof window === 'undefined') {
        return 'workplaces';
    }
    const raw = new URLSearchParams(window.location.search).get('tab');
    if (raw === 'departments' || raw === 'statutory' || raw === 'workplaces') {
        return raw;
    }
    return 'workplaces';
}

function formatSettingTitle(key: string): string {
    return key
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getCategoryIcon(category: string) {
    if (category.includes('Leave')) return RiTimerLine;
    if (category.includes('Probation') || category.includes('Workweek')) return RiScales3Line;
    return RiBuilding4Line;
}

function buildInitialSettingsMap(groupedSettings: Record<string, SettingItem[]>): Record<string, string> {
    const initial: Record<string, string> = {};
    Object.values(groupedSettings).forEach((items) => {
        items.forEach((item) => {
            initial[item.key] = String(item.value ?? '');
        });
    });
    return initial;
}

export default function Index({ groupedSettings, departments = [], workplaces = [] }: Props) {
    const [activeTab, setActiveTab] = useState<SettingsTab>(getInitialTab);

    const handleTabChange = (nextTab: SettingsTab) => {
        setActiveTab(nextTab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', nextTab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    /* ---------------------------------------------------------------------- */
    /*  Workplaces State & Handlers                                           */
    /* ---------------------------------------------------------------------- */
    const [wpSearch, setWpSearch] = useState('');
    const [wpFilter, setWpFilter] = useState<WorkplaceFilter>('all');
    const [wpModalOpen, setWpModalOpen] = useState(false);
    const [editingWorkplace, setEditingWorkplace] = useState<WorkplaceItem | null>(null);
    const [deletingWorkplace, setDeletingWorkplace] = useState<WorkplaceItem | null>(null);

    const wpForm = useForm<{
        name: string;
        code: string;
        type: 'Head Office' | 'Project';
        location: string;
        description: string;
        is_active: boolean;
    }>({
        name: '',
        code: '',
        type: 'Project',
        location: '',
        description: '',
        is_active: true,
    });

    const filteredWorkplaces = useMemo(() => {
        const q = wpSearch.trim().toLowerCase();
        return workplaces.filter((wp) => {
            if (wpFilter === 'active' && !wp.is_active) return false;
            if (wpFilter === 'Project' && wp.type !== 'Project') return false;
            if (wpFilter === 'Head Office' && wp.type !== 'Head Office') return false;
            if (!q) return true;
            return (
                wp.name.toLowerCase().includes(q) ||
                (wp.code ?? '').toLowerCase().includes(q) ||
                (wp.location ?? '').toLowerCase().includes(q) ||
                (wp.description ?? '').toLowerCase().includes(q)
            );
        });
    }, [workplaces, wpSearch, wpFilter]);

    const openCreateWorkplace = () => {
        setEditingWorkplace(null);
        wpForm.clearErrors();
        wpForm.setData({
            name: '',
            code: '',
            type: 'Project',
            location: '',
            description: '',
            is_active: true,
        });
        setWpModalOpen(true);
    };

    const openEditWorkplace = (wp: WorkplaceItem) => {
        setEditingWorkplace(wp);
        wpForm.clearErrors();
        wpForm.setData({
            name: wp.name,
            code: wp.code ?? '',
            type: wp.type,
            location: wp.location ?? '',
            description: wp.description ?? '',
            is_active: wp.is_active,
        });
        setWpModalOpen(true);
    };

    const handleWorkplaceSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editingWorkplace) {
            wpForm.put(route('settings.workplaces.update', editingWorkplace.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setWpModalOpen(false);
                    setEditingWorkplace(null);
                },
            });
            return;
        }

        wpForm.post(route('settings.workplaces.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setWpModalOpen(false);
                wpForm.reset();
            },
        });
    };

    const handleDeactivateWorkplaceInstead = (wp: WorkplaceItem) => {
        return new Promise<void>((resolve, reject) => {
            router.put(
                route('settings.workplaces.update', wp.id),
                {
                    name: wp.name,
                    code: wp.code ?? '',
                    type: wp.type,
                    location: wp.location ?? '',
                    description: wp.description ?? '',
                    is_active: false,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setDeletingWorkplace(null);
                        resolve();
                    },
                    onError: () => reject(new Error('Failed to deactivate workplace')),
                },
            );
        });
    };

    const handleConfirmDeleteWorkplace = () => {
        if (!deletingWorkplace) return;
        const targetId = deletingWorkplace.id;
        return new Promise<void>((resolve, reject) => {
            router.delete(route('settings.workplaces.destroy', targetId), {
                preserveScroll: true,
                onSuccess: () => {
                    setDeletingWorkplace(null);
                    resolve();
                },
                onError: () => reject(new Error('Failed to delete workplace')),
            });
        });
    };

    /* ---------------------------------------------------------------------- */
    /*  Departments State & Handlers                                          */
    /* ---------------------------------------------------------------------- */
    const [deptSearch, setDeptSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState<DepartmentFilter>('all');
    const [deptModalOpen, setDeptModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<DepartmentItem | null>(null);
    const [deletingDepartment, setDeletingDepartment] = useState<DepartmentItem | null>(null);

    const deptForm = useForm<{
        name: string;
        code: string;
        description: string;
        is_active: boolean;
    }>({
        name: '',
        code: '',
        description: '',
        is_active: true,
    });

    const filteredDepartments = useMemo(() => {
        const q = deptSearch.trim().toLowerCase();
        return departments.filter((dept) => {
            if (deptFilter === 'active' && !dept.is_active) return false;
            if (deptFilter === 'inactive' && dept.is_active) return false;
            if (!q) return true;
            return (
                dept.name.toLowerCase().includes(q) ||
                (dept.code ?? '').toLowerCase().includes(q) ||
                (dept.description ?? '').toLowerCase().includes(q)
            );
        });
    }, [departments, deptSearch, deptFilter]);

    const openCreateDepartment = () => {
        setEditingDepartment(null);
        deptForm.clearErrors();
        deptForm.setData({
            name: '',
            code: '',
            description: '',
            is_active: true,
        });
        setDeptModalOpen(true);
    };

    const openEditDepartment = (dept: DepartmentItem) => {
        setEditingDepartment(dept);
        deptForm.clearErrors();
        deptForm.setData({
            name: dept.name,
            code: dept.code ?? '',
            description: dept.description ?? '',
            is_active: dept.is_active,
        });
        setDeptModalOpen(true);
    };

    const handleDepartmentSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editingDepartment) {
            deptForm.put(route('settings.departments.update', editingDepartment.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setDeptModalOpen(false);
                    setEditingDepartment(null);
                },
            });
            return;
        }

        deptForm.post(route('settings.departments.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setDeptModalOpen(false);
                deptForm.reset();
            },
        });
    };

    const handleDeactivateDepartmentInstead = (dept: DepartmentItem) => {
        return new Promise<void>((resolve, reject) => {
            router.put(
                route('settings.departments.update', dept.id),
                {
                    name: dept.name,
                    code: dept.code ?? '',
                    description: dept.description ?? '',
                    is_active: false,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setDeletingDepartment(null);
                        resolve();
                    },
                    onError: () => reject(new Error('Failed to deactivate department')),
                },
            );
        });
    };

    const handleConfirmDeleteDepartment = () => {
        if (!deletingDepartment) return;
        const targetId = deletingDepartment.id;
        return new Promise<void>((resolve, reject) => {
            router.delete(route('settings.departments.destroy', targetId), {
                preserveScroll: true,
                onSuccess: () => {
                    setDeletingDepartment(null);
                    resolve();
                },
                onError: () => reject(new Error('Failed to delete department')),
            });
        });
    };

    /* ---------------------------------------------------------------------- */
    /*  Statutory Settings State & Handlers                                   */
    /* ---------------------------------------------------------------------- */
    const initialSettings = useMemo(() => buildInitialSettingsMap(groupedSettings), [groupedSettings]);
    const statutoryForm = useForm<{ settings: Record<string, string> }>({
        settings: initialSettings,
    });
    const [confirmStatutorySave, setConfirmStatutorySave] = useState(false);

    const totalStatutoryCount = useMemo(
        () => Object.values(groupedSettings).reduce((acc, items) => acc + items.length, 0),
        [groupedSettings],
    );

    const isStatutoryDirty = useMemo(() => {
        return Object.keys(initialSettings).some(
            (key) => (statutoryForm.data.settings[key] ?? '') !== initialSettings[key],
        );
    }, [initialSettings, statutoryForm.data.settings]);

    const handleStatutoryValueChange = (key: string, val: string) => {
        statutoryForm.setData('settings', {
            ...statutoryForm.data.settings,
            [key]: val,
        });
    };

    const handleResetStatutory = () => {
        statutoryForm.setData('settings', { ...initialSettings });
    };

    const handleSaveStatutory = () => {
        return new Promise<void>((resolve, reject) => {
            statutoryForm.put(route('settings.update'), {
                preserveScroll: true,
                onSuccess: () => {
                    setConfirmStatutorySave(false);
                    resolve();
                },
                onError: () => reject(new Error('Failed to save statutory parameters')),
            });
        });
    };

    /* ---------------------------------------------------------------------- */
    /*  Summary Counts                                                        */
    /* ---------------------------------------------------------------------- */
    const activeWorkplaceCount = workplaces.filter((w) => w.is_active).length;
    const totalWorkplaceStaff = workplaces.reduce((acc, w) => acc + w.active_employees_count, 0);
    const activeDepartmentCount = departments.filter((d) => d.is_active).length;
    const totalDepartmentStaff = departments.reduce((acc, d) => acc + d.active_employees_count, 0);

    return (
        <AuthenticatedLayout>
            <Head title="Settings" />

            <div className="mx-auto max-w-6xl space-y-6 pb-16">
                {/* Header & Segmented Control */}
                <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Settings
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage project workplaces, organizational departments, and Ethiopian labor rules.
                        </p>
                    </div>

                    <div className="max-w-full overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <SegmentedControl
                            aria-label="Settings sections"
                            selectedKeys={[activeTab]}
                            onSelectionChange={(keys) => {
                                const first = Array.from(keys)[0];
                                if (first === 'workplaces' || first === 'departments' || first === 'statutory') {
                                    handleTabChange(first);
                                }
                            }}
                        >
                            <SegmentedControlItem id="workplaces">
                                <span className="inline-flex items-center gap-1.5">
                                    <span>
                                        Workplaces<span className="hidden sm:inline"> &amp; Sites</span>
                                    </span>
                                    <Badge color={activeTab === 'workplaces' ? 'primary' : 'neutral'}>
                                        {workplaces.length}
                                    </Badge>
                                </span>
                            </SegmentedControlItem>
                            <SegmentedControlItem id="departments">
                                <span className="inline-flex items-center gap-1.5">
                                    <span>Departments</span>
                                    <Badge color={activeTab === 'departments' ? 'primary' : 'neutral'}>
                                        {departments.length}
                                    </Badge>
                                </span>
                            </SegmentedControlItem>
                            <SegmentedControlItem id="statutory">
                                <span className="inline-flex items-center gap-1.5">
                                    <span>
                                        Statutory<span className="hidden sm:inline"> Rules</span>
                                    </span>
                                    <Badge color={activeTab === 'statutory' ? 'primary' : 'neutral'}>
                                        {totalStatutoryCount}
                                    </Badge>
                                </span>
                            </SegmentedControlItem>
                        </SegmentedControl>
                    </div>
                </div>

                {/* ================================================================= */}
                {/* TAB 1: WORKPLACES & SITES                                         */}
                {/* ================================================================= */}
                {activeTab === 'workplaces' && (
                    <section aria-label="Workplaces and project sites" className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
                                <SearchField
                                    aria-label="Search workplaces"
                                    placeholder="Search by site name, code, or city..."
                                    value={wpSearch}
                                    onChange={setWpSearch}
                                    shape="rounded"
                                    size="small"
                                    className="sm:max-w-xs"
                                />

                                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter workplaces">
                                    {(
                                        [
                                            { id: 'all', label: 'All' },
                                            { id: 'active', label: 'Active' },
                                            { id: 'Project', label: 'Projects' },
                                            { id: 'Head Office', label: 'Head Office' },
                                        ] as const
                                    ).map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setWpFilter(option.id)}
                                            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                                wpFilter === option.id
                                                    ? 'border-[#0066cc] bg-[#0066cc]/10 text-[#0066cc] dark:border-[#2997ff] dark:bg-[#2997ff]/15 dark:text-[#2997ff]'
                                                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                size="medium"
                                leadingIcon={RiAddLine}
                                onClick={openCreateWorkplace}
                            >
                                Add Workplace
                            </Button>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border bg-card">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3 sm:px-5">
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <RiBuilding2Line className="size-4 text-foreground/70" aria-hidden />
                                    <span>
                                        Showing <strong className="text-foreground tabular-nums">{filteredWorkplaces.length}</strong> of{' '}
                                        <span className="tabular-nums">{workplaces.length}</span> stations
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                                    <span>{activeWorkplaceCount} active</span>
                                    <span aria-hidden>·</span>
                                    <span>{totalWorkplaceStaff} active personnel</span>
                                </div>
                            </div>

                            {filteredWorkplaces.length === 0 ? (
                                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                                    <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                        <RiBuilding2Line className="size-5" aria-hidden />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">No workplaces match your view</p>
                                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                                        {wpSearch || wpFilter !== 'all'
                                            ? 'Clear the current search or filter, or add a new project station.'
                                            : 'Add your first project site or office station so HR managers can assign employees.'}
                                    </p>
                                    <div className="mt-4 flex items-center gap-2">
                                        {(wpSearch || wpFilter !== 'all') && (
                                            <Button
                                                variant="secondary"
                                                size="small"
                                                onClick={() => {
                                                    setWpSearch('');
                                                    setWpFilter('all');
                                                }}
                                            >
                                                Clear Filters
                                            </Button>
                                        )}
                                        <Button
                                            variant="primary"
                                            size="small"
                                            leadingIcon={RiAddLine}
                                            onClick={openCreateWorkplace}
                                        >
                                            Add Workplace
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {filteredWorkplaces.map((wp) => (
                                        <div
                                            key={wp.id}
                                            className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-muted/25 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                                        >
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {wp.name}
                                                    </span>
                                                    {wp.code && (
                                                        <Badge color="neutral">{wp.code}</Badge>
                                                    )}
                                                    <Chip
                                                        variant="subtle"
                                                        color={wp.type === 'Head Office' ? 'blue' : 'cyan'}
                                                    >
                                                        {wp.type}
                                                    </Chip>
                                                </div>

                                                {(wp.location || wp.description) && (
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                        {wp.location && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <RiMapPinLine className="size-3.5 shrink-0" aria-hidden />
                                                                <span>{wp.location}</span>
                                                            </span>
                                                        )}
                                                        {wp.description && (
                                                            <span className="line-clamp-1">{wp.description}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                                                <div className="flex items-center gap-4 text-xs">
                                                    <div className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                                        <StatusDot color={wp.is_active ? 'green' : 'yellow'} />
                                                        <span>{wp.is_active ? 'Active' : 'Inactive'}</span>
                                                    </div>

                                                    <div
                                                        className="inline-flex items-center gap-1 text-muted-foreground tabular-nums"
                                                        title={
                                                            wp.total_employees_count > wp.active_employees_count
                                                                ? `${wp.active_employees_count} active · ${wp.total_employees_count} total records incl. separated/archived`
                                                                : `${wp.active_employees_count} assigned personnel`
                                                        }
                                                    >
                                                        <RiTeamLine className="size-3.5 shrink-0" aria-hidden />
                                                        <span className="font-medium text-foreground">
                                                            {wp.active_employees_count}
                                                        </span>
                                                        <span>staff</span>
                                                        {wp.total_employees_count > wp.active_employees_count && (
                                                            <span className="text-[11px] text-muted-foreground">
                                                                ({wp.total_employees_count} total)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="small"
                                                        leadingIcon={RiEditLine}
                                                        onClick={() => openEditWorkplace(wp)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="small"
                                                        iconOnly
                                                        leadingIcon={RiDeleteBinLine}
                                                        aria-label={`Delete ${wp.name}`}
                                                        className="text-muted-foreground hover:text-destructive"
                                                        onClick={() => setDeletingWorkplace(wp)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ================================================================= */}
                {/* TAB 2: DEPARTMENTS                                                */}
                {/* ================================================================= */}
                {activeTab === 'departments' && (
                    <section aria-label="Company departments" className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
                                <SearchField
                                    aria-label="Search departments"
                                    placeholder="Search by department name or code..."
                                    value={deptSearch}
                                    onChange={setDeptSearch}
                                    shape="rounded"
                                    size="small"
                                    className="sm:max-w-xs"
                                />

                                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter departments">
                                    {(
                                        [
                                            { id: 'all', label: 'All' },
                                            { id: 'active', label: 'Active' },
                                            { id: 'inactive', label: 'Inactive' },
                                        ] as const
                                    ).map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setDeptFilter(option.id)}
                                            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                                deptFilter === option.id
                                                    ? 'border-[#0066cc] bg-[#0066cc]/10 text-[#0066cc] dark:border-[#2997ff] dark:bg-[#2997ff]/15 dark:text-[#2997ff]'
                                                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                size="medium"
                                leadingIcon={RiAddLine}
                                onClick={openCreateDepartment}
                            >
                                Add Department
                            </Button>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border bg-card">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3 sm:px-5">
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <RiStackLine className="size-4 text-foreground/70" aria-hidden />
                                    <span>
                                        Showing <strong className="text-foreground tabular-nums">{filteredDepartments.length}</strong> of{' '}
                                        <span className="tabular-nums">{departments.length}</span> departments
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                                    <span>{activeDepartmentCount} active</span>
                                    <span aria-hidden>·</span>
                                    <span>{totalDepartmentStaff} active personnel</span>
                                </div>
                            </div>

                            {filteredDepartments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                                    <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                        <RiStackLine className="size-5" aria-hidden />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">No departments match your view</p>
                                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                                        {deptSearch || deptFilter !== 'all'
                                            ? 'Adjust your search or status filter, or create a new department.'
                                            : 'Create your first department to organize personnel and team channels.'}
                                    </p>
                                    <div className="mt-4 flex items-center gap-2">
                                        {(deptSearch || deptFilter !== 'all') && (
                                            <Button
                                                variant="secondary"
                                                size="small"
                                                onClick={() => {
                                                    setDeptSearch('');
                                                    setDeptFilter('all');
                                                }}
                                            >
                                                Clear Filters
                                            </Button>
                                        )}
                                        <Button
                                            variant="primary"
                                            size="small"
                                            leadingIcon={RiAddLine}
                                            onClick={openCreateDepartment}
                                        >
                                            Add Department
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {filteredDepartments.map((dept) => (
                                        <div
                                            key={dept.id}
                                            className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-muted/25 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                                        >
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {dept.name}
                                                    </span>
                                                    {dept.code && (
                                                        <Badge color="neutral">{dept.code}</Badge>
                                                    )}
                                                    {dept.chat_channel_metadata?.slug && (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                            <RiChat3Line className="size-3 shrink-0" aria-hidden />
                                                            <span>#{dept.chat_channel_metadata.slug}</span>
                                                        </span>
                                                    )}
                                                </div>

                                                {dept.description && (
                                                    <p className="line-clamp-1 text-xs text-muted-foreground">
                                                        {dept.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                                                <div className="flex items-center gap-4 text-xs">
                                                    <div className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                                        <StatusDot color={dept.is_active ? 'green' : 'yellow'} />
                                                        <span>{dept.is_active ? 'Active' : 'Inactive'}</span>
                                                    </div>

                                                    <div
                                                        className="inline-flex items-center gap-1 text-muted-foreground tabular-nums"
                                                        title={
                                                            dept.total_employees_count > dept.active_employees_count
                                                                ? `${dept.active_employees_count} active · ${dept.total_employees_count} total records incl. separated/archived`
                                                                : `${dept.active_employees_count} assigned personnel`
                                                        }
                                                    >
                                                        <RiTeamLine className="size-3.5 shrink-0" aria-hidden />
                                                        <span className="font-medium text-foreground">
                                                            {dept.active_employees_count}
                                                        </span>
                                                        <span>staff</span>
                                                        {dept.total_employees_count > dept.active_employees_count && (
                                                            <span className="text-[11px] text-muted-foreground">
                                                                ({dept.total_employees_count} total)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="small"
                                                        leadingIcon={RiEditLine}
                                                        onClick={() => openEditDepartment(dept)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="small"
                                                        iconOnly
                                                        leadingIcon={RiDeleteBinLine}
                                                        aria-label={`Delete ${dept.name}`}
                                                        className="text-muted-foreground hover:text-destructive"
                                                        onClick={() => setDeletingDepartment(dept)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ================================================================= */}
                {/* TAB 3: STATUTORY RULES                                            */}
                {/* ================================================================= */}
                {activeTab === 'statutory' && (
                    <section aria-label="Statutory labor and corporate rules" className="space-y-5">
                        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0066cc]/10 text-[#0066cc] dark:bg-[#2997ff]/15 dark:text-[#2997ff]">
                                    <RiShieldCheckLine className="size-4" aria-hidden />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        Ethiopian Labor Proclamation No. 1156/2019 &amp; Corporate Rules
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Parameter changes affect leave entitlement calculations, probation tracking, and payroll rates, and are written to the audit log.
                                    </p>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="small"
                                    leadingIcon={RiRestartLine}
                                    disabled={!isStatutoryDirty || statutoryForm.processing}
                                    onClick={handleResetStatutory}
                                >
                                    Reset Edits
                                </Button>
                                <Button
                                    variant="primary"
                                    size="small"
                                    leadingIcon={RiSaveLine}
                                    disabled={!isStatutoryDirty || statutoryForm.processing}
                                    onClick={() => setConfirmStatutorySave(true)}
                                >
                                    Save Rules
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {Object.entries(groupedSettings).map(([category, items]) => {
                                const CategoryIcon = getCategoryIcon(category);
                                return (
                                    <div
                                        key={category}
                                        className="overflow-hidden rounded-xl border border-border bg-card"
                                    >
                                        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3 sm:px-5">
                                            <div className="flex items-center gap-2.5">
                                                <CategoryIcon className="size-4 text-[#0066cc] dark:text-[#2997ff]" aria-hidden />
                                                <h2 className="text-sm font-semibold text-foreground">{category}</h2>
                                            </div>
                                            <Badge color="neutral">{items.length}</Badge>
                                        </div>

                                        <div className="divide-y divide-border">
                                            {items.map((item) => {
                                                const currentVal = statutoryForm.data.settings[item.key] ?? '';
                                                const isModified = currentVal !== initialSettings[item.key];
                                                return (
                                                    <div
                                                        key={item.key}
                                                        className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-12 sm:items-center sm:px-5"
                                                    >
                                                        <div className="space-y-1 sm:col-span-7">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-sm font-medium text-foreground">
                                                                    {formatSettingTitle(item.key)}
                                                                </span>
                                                                <Badge color="neutral">{item.article}</Badge>
                                                                {isModified && (
                                                                    <Chip variant="subtle" color="blue">
                                                                        Modified
                                                                    </Chip>
                                                                )}
                                                            </div>
                                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                                {item.description}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-2.5 sm:col-span-5 sm:justify-end">
                                                            <Input
                                                                aria-label={formatSettingTitle(item.key)}
                                                                value={currentVal}
                                                                onChange={(val) => handleStatutoryValueChange(item.key, val)}
                                                                inputMode={item.data_type === 'string' ? 'text' : 'decimal'}
                                                                size="medium"
                                                                className="w-full sm:max-w-[220px]"
                                                                inputClassName={item.data_type === 'string' ? undefined : 'tabular-nums font-medium'}
                                                                isInvalid={Boolean(statutoryForm.errors[`settings.${item.key}`])}
                                                                errorMessage={statutoryForm.errors[`settings.${item.key}`]}
                                                            />
                                                            <span className="min-w-[44px] shrink-0 text-right text-xs font-medium text-muted-foreground">
                                                                {item.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>

            {/* ================================================================= */}
            {/* MODAL: ADD / EDIT WORKPLACE                                       */}
            {/* ================================================================= */}
            <Modal
                isOpen={wpModalOpen}
                onOpenChange={(open) => {
                    setWpModalOpen(open);
                    if (!open) setEditingWorkplace(null);
                }}
                size="md"
            >
                <form onSubmit={handleWorkplaceSubmit} className="flex min-h-0 flex-1 flex-col">
                    <ModalHeader
                        title={editingWorkplace ? 'Edit Workplace' : 'Add Workplace'}
                        description={
                            editingWorkplace
                                ? 'Update this project station or office. Renaming it updates assigned employee records and announcements.'
                                : 'Add a new project site or office station so HR managers can assign personnel to it.'
                        }
                        icon={RiBuilding2Line}
                    />
                    <ModalBody className="space-y-4">
                        <Input
                            label="Workplace / Project Name"
                            isRequired
                            placeholder="e.g. Dire Dawa Substation Project"
                            maxLength={100}
                            value={wpForm.data.name}
                            onChange={(val) => wpForm.setData('name', val)}
                            isInvalid={Boolean(wpForm.errors.name)}
                            errorMessage={wpForm.errors.name}
                        />

                        {editingWorkplace &&
                            editingWorkplace.total_employees_count > 0 &&
                            wpForm.data.name.trim() !== '' &&
                            wpForm.data.name.trim() !== editingWorkplace.name && (
                                <div className="flex items-start gap-2 rounded-lg border border-[#0066cc]/25 bg-[#0066cc]/5 px-3 py-2 text-xs text-foreground">
                                    <RiAlertLine className="mt-0.5 size-4 shrink-0 text-[#0066cc]" aria-hidden />
                                    <span>
                                        Renaming from <strong>{editingWorkplace.name}</strong> will automatically update{' '}
                                        <strong className="tabular-nums">{editingWorkplace.total_employees_count}</strong> assigned employee record(s).
                                    </span>
                                </div>
                            )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Select
                                label="Station Type"
                                isRequired
                                selectedKey={wpForm.data.type}
                                onSelectionChange={(key) => {
                                    if (key === 'Head Office' || key === 'Project') {
                                        wpForm.setData('type', key);
                                    }
                                }}
                                popoverClassName="z-[150]"
                            >
                                <SelectItem id="Project">Project Site</SelectItem>
                                <SelectItem id="Head Office">Head Office</SelectItem>
                            </Select>

                            <Input
                                label="Short Code"
                                placeholder="e.g. DDS"
                                maxLength={30}
                                value={wpForm.data.code}
                                onChange={(val) => wpForm.setData('code', val)}
                                isInvalid={Boolean(wpForm.errors.code)}
                                errorMessage={wpForm.errors.code}
                            />
                        </div>

                        <Input
                            label="City / Region"
                            placeholder="e.g. Dire Dawa, Ethiopia"
                            maxLength={150}
                            value={wpForm.data.location}
                            onChange={(val) => wpForm.setData('location', val)}
                            isInvalid={Boolean(wpForm.errors.location)}
                            errorMessage={wpForm.errors.location}
                        />

                        <Textarea
                            label="Operational Notes"
                            placeholder="Optional project scope, client, or site notes..."
                            rows={3}
                            maxLength={500}
                            showCount
                            value={wpForm.data.description}
                            onChange={(val) => wpForm.setData('description', val)}
                            isInvalid={Boolean(wpForm.errors.description)}
                            hint={wpForm.errors.description}
                        />

                        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5">
                            <div>
                                <p className="text-xs font-semibold text-foreground">Available for new assignments</p>
                                <p className="text-[11px] text-muted-foreground">
                                    Inactive sites stay on historical records but are hidden from new hire forms.
                                </p>
                            </div>
                            <Switch
                                aria-label="Available for new assignments"
                                isSelected={wpForm.data.is_active}
                                onChange={(val) => wpForm.setData('is_active', val)}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={wpForm.processing}
                            onClick={() => setWpModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={wpForm.processing}
                        >
                            {editingWorkplace ? 'Save Workplace' : 'Create Workplace'}
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>

            {/* ================================================================= */}
            {/* ALERT: DELETE WORKPLACE                                           */}
            {/* ================================================================= */}
            <AlertDialog
                isOpen={deletingWorkplace !== null}
                onOpenChange={(open) => {
                    if (!open) setDeletingWorkplace(null);
                }}
                variant={deletingWorkplace && deletingWorkplace.total_employees_count > 0 ? 'default' : 'danger'}
                icon={RiErrorWarningLine}
                title={
                    deletingWorkplace && deletingWorkplace.total_employees_count > 0
                        ? 'Workplace Has Assigned Staff'
                        : 'Delete Workplace'
                }
                description={
                    deletingWorkplace
                        ? deletingWorkplace.total_employees_count > 0
                            ? `"${deletingWorkplace.name}" currently holds ${deletingWorkplace.total_employees_count} employee record(s). Reassign those employees before deleting, or mark it inactive instead.`
                            : `Permanently delete "${deletingWorkplace.name}"? This action cannot be undone.`
                        : undefined
                }
                confirmLabel="Delete Workplace"
                cancelLabel={deletingWorkplace && deletingWorkplace.total_employees_count > 0 ? 'Close' : 'Cancel'}
                pendingLabel="Deleting..."
                isConfirmDisabled={!deletingWorkplace || deletingWorkplace.total_employees_count > 0}
                onConfirm={handleConfirmDeleteWorkplace}
            >
                {deletingWorkplace && deletingWorkplace.total_employees_count > 0 && deletingWorkplace.is_active ? (
                    <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-muted/35 p-3">
                        <p className="text-xs text-muted-foreground">
                            Marking this station inactive keeps existing employee history intact while removing it from new onboarding dropdowns.
                        </p>
                        <div>
                            <Button
                                type="button"
                                variant="secondary"
                                size="small"
                                onClick={() => handleDeactivateWorkplaceInstead(deletingWorkplace)}
                            >
                                Mark Inactive Instead
                            </Button>
                        </div>
                    </div>
                ) : null}
            </AlertDialog>

            {/* ================================================================= */}
            {/* MODAL: ADD / EDIT DEPARTMENT                                      */}
            {/* ================================================================= */}
            <Modal
                isOpen={deptModalOpen}
                onOpenChange={(open) => {
                    setDeptModalOpen(open);
                    if (!open) setEditingDepartment(null);
                }}
                size="md"
            >
                <form onSubmit={handleDepartmentSubmit} className="flex min-h-0 flex-1 flex-col">
                    <ModalHeader
                        title={editingDepartment ? 'Edit Department' : 'Add Department'}
                        description={
                            editingDepartment
                                ? 'Update department details. Changes sync immediately across personnel records and team chat.'
                                : 'Add a new organizational department and automatically provision its team chat channel.'
                        }
                        icon={RiStackLine}
                    />
                    <ModalBody className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="sm:col-span-2">
                                <Input
                                    label="Department Name"
                                    isRequired
                                    placeholder="e.g. Geotechnical Engineering"
                                    maxLength={255}
                                    value={deptForm.data.name}
                                    onChange={(val) => deptForm.setData('name', val)}
                                    isInvalid={Boolean(deptForm.errors.name)}
                                    errorMessage={deptForm.errors.name}
                                />
                            </div>
                            <div>
                                <Input
                                    label="Short Code"
                                    placeholder="e.g. GEO"
                                    maxLength={30}
                                    value={deptForm.data.code}
                                    onChange={(val) => deptForm.setData('code', val)}
                                    isInvalid={Boolean(deptForm.errors.code)}
                                    errorMessage={deptForm.errors.code}
                                />
                            </div>
                        </div>

                        <Textarea
                            label="Description & Mandate"
                            placeholder="Optional overview of department responsibilities..."
                            rows={3}
                            maxLength={500}
                            showCount
                            value={deptForm.data.description}
                            onChange={(val) => deptForm.setData('description', val)}
                            isInvalid={Boolean(deptForm.errors.description)}
                            hint={deptForm.errors.description}
                        />

                        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5">
                            <div>
                                <p className="text-xs font-semibold text-foreground">Available for new assignments</p>
                                <p className="text-[11px] text-muted-foreground">
                                    Active departments appear in hiring forms and announcement targeting.
                                </p>
                            </div>
                            <Switch
                                aria-label="Available for new assignments"
                                isSelected={deptForm.data.is_active}
                                onChange={(val) => deptForm.setData('is_active', val)}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={deptForm.processing}
                            onClick={() => setDeptModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={deptForm.processing}
                        >
                            {editingDepartment ? 'Save Department' : 'Create Department'}
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>

            {/* ================================================================= */}
            {/* ALERT: DELETE DEPARTMENT                                          */}
            {/* ================================================================= */}
            <AlertDialog
                isOpen={deletingDepartment !== null}
                onOpenChange={(open) => {
                    if (!open) setDeletingDepartment(null);
                }}
                variant={deletingDepartment && deletingDepartment.total_employees_count > 0 ? 'default' : 'danger'}
                icon={RiErrorWarningLine}
                title={
                    deletingDepartment && deletingDepartment.total_employees_count > 0
                        ? 'Department Has Assigned Staff'
                        : 'Delete Department'
                }
                description={
                    deletingDepartment
                        ? deletingDepartment.total_employees_count > 0
                            ? `"${deletingDepartment.name}" currently holds ${deletingDepartment.total_employees_count} employee record(s). Reassign staff first, or mark the department inactive instead.`
                            : `Permanently delete "${deletingDepartment.name}" and its department chat channel? This action cannot be undone.`
                        : undefined
                }
                confirmLabel="Delete Department"
                cancelLabel={deletingDepartment && deletingDepartment.total_employees_count > 0 ? 'Close' : 'Cancel'}
                pendingLabel="Deleting..."
                isConfirmDisabled={!deletingDepartment || deletingDepartment.total_employees_count > 0}
                onConfirm={handleConfirmDeleteDepartment}
            >
                {deletingDepartment && deletingDepartment.total_employees_count > 0 && deletingDepartment.is_active ? (
                    <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-muted/35 p-3">
                        <p className="text-xs text-muted-foreground">
                            Marking this department inactive keeps existing employee records intact while removing it from new onboarding selections.
                        </p>
                        <div>
                            <Button
                                type="button"
                                variant="secondary"
                                size="small"
                                onClick={() => handleDeactivateDepartmentInstead(deletingDepartment)}
                            >
                                Mark Inactive Instead
                            </Button>
                        </div>
                    </div>
                ) : null}
            </AlertDialog>

            {/* ================================================================= */}
            {/* ALERT: SAVE STATUTORY RULES                                       */}
            {/* ================================================================= */}
            <AlertDialog
                isOpen={confirmStatutorySave}
                onOpenChange={setConfirmStatutorySave}
                variant="default"
                icon={RiSaveLine}
                title="Save Statutory Rule Changes?"
                description="Updated rates and statutory caps will take effect immediately across leave and payroll engines and will be recorded in the audit log."
                confirmLabel="Save Rules"
                pendingLabel="Saving..."
                onConfirm={handleSaveStatutory}
            />
        </AuthenticatedLayout>
    );
}
