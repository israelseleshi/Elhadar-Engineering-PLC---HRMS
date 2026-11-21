import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    User,
    Crown,
    Building2,
    Compass,
    ShieldCheck,
    AlertTriangle,
    Scale,
    Megaphone,
    ShieldAlert,
    HardHat,
    Briefcase,
    Banknote,
    Wrench,
    Users,
    Rocket,
    MoreVertical,
    Search,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Maximize2,
    Minimize2,
    X,
    FileText,
} from 'lucide-react';
import {
    ORGANOGRAM_APEX,
    STRATEGIC_SUPPORT_WINGS,
    OPERATING_OFFICERS_WINGS,
    OrgWingNode,
} from './organogramData';
import {
    OrgEmployee,
    NodeLeader,
    HierarchyMapping,
    buildHierarchyMapping,
} from './employeeOrgMapping';
import { CircleAvatar } from './CircleAvatar';
import { EmployeeProfileDrawer } from './EmployeeProfileDrawer';

interface Props {
    metrics: {
        total_headcount: number;
        active_departments: number;
        prepared_by: string;
        effective_cycle: string;
        company: string;
    };
    employees?: OrgEmployee[];
}

export default function OrganizationStructure({ metrics, employees = [] }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'strategic' | 'operating'>('all');
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Selected employee for the profile slide-over drawer
    const [selectedEmployee, setSelectedEmployee] = useState<OrgEmployee | null>(null);

    // Track collapse toggle for all enterprise wings
    const [collapseWings, setCollapseWings] = useState(false);

    // Switch between compact scrollable roster view and non-scrollable (full tree)
    // Default: true (compact scroll) as requested by user
    const [isScrollable, setIsScrollable] = useState(true);

    // Build hierarchy mapping from all active employees
    const mapping: HierarchyMapping = useMemo(() => {
        return buildHierarchyMapping(employees);
    }, [employees]);

    // All wing IDs
    const allWingIds = useMemo(() => {
        return [...STRATEGIC_SUPPORT_WINGS, ...OPERATING_OFFICERS_WINGS].map((w) => w.id);
    }, []);

    // All directorate IDs
    const allDirIds = useMemo(() => {
        const ids: string[] = [];
        [...STRATEGIC_SUPPORT_WINGS, ...OPERATING_OFFICERS_WINGS].forEach((w) => {
            w.directorates.forEach((d) => ids.push(d.id));
        });
        return ids;
    }, []);

    // All division IDs that have employees
    const allDivisionsWithEmployees = useMemo(() => {
        return Object.keys(mapping.divisionEmployees);
    }, [mapping.divisionEmployees]);

    // Expanded wings for child directorates - Default: ALL EXPANDED so all subordinate units are visible
    const [expandedWingIds, setExpandedWingIds] = useState<Set<string>>(() => {
        return new Set(allWingIds);
    });

    // Expanded directorates for child divisions - Default: expanded for full visibility
    const [expandedDirIds, setExpandedDirIds] = useState<Set<string>>(() => {
        return new Set(allDirIds);
    });

    // Expanded division rosters for employee cards - Default: ALL EXPANDED so all active employees are visible
    const [expandedDivisionRosters, setExpandedDivisionRosters] = useState<Set<string>>(() => {
        return new Set(allDivisionsWithEmployees);
    });

    const toggleWingExpansion = useCallback((id: string) => {
        setExpandedWingIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const toggleDirExpansion = useCallback((id: string) => {
        setExpandedDirIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const toggleDivisionRoster = useCallback((id: string) => {
        setExpandedDivisionRosters((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        setCollapseWings(false);
        setExpandedWingIds(new Set(allWingIds));
        setExpandedDirIds(new Set(allDirIds));
        setExpandedDivisionRosters(new Set(allDivisionsWithEmployees));
    }, [allWingIds, allDirIds, allDivisionsWithEmployees]);

    const collapseAll = useCallback(() => {
        setExpandedWingIds(new Set());
        setExpandedDirIds(new Set());
        setExpandedDivisionRosters(new Set());
    }, []);

    const toggleAllStaffRosters = useCallback(() => {
        setExpandedDivisionRosters((prev) => {
            if (prev.size > 0) {
                return new Set();
            } else {
                return new Set(allDivisionsWithEmployees);
            }
        });
    }, [allDivisionsWithEmployees]);

    const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 130));
    const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 25));
    const handleResetZoom = () => setZoomLevel(100);
    const handleFitWidth = () => setZoomLevel(70);

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const [isPinching, setIsPinching] = useState(false);

    // Keep zoom level in ref so event listeners always access current zoom without re-binding
    const zoomLevelRef = useRef(zoomLevel);
    useEffect(() => {
        zoomLevelRef.current = zoomLevel;
    }, [zoomLevel]);

    // Trackpad two-finger pinch (wheel with ctrlKey) & touchscreen two-finger pinch zoom
    useEffect(() => {
        const el = canvasContainerRef.current;
        if (!el) return;

        // 1. Laptop Trackpad Pinch: browsers emit wheel events with ctrlKey = true
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                // deltaY is negative when pinching out (zooming in), positive when pinching in (zooming out)
                const zoomDelta = -e.deltaY;
                const factor = Math.max(-12, Math.min(12, zoomDelta * 0.15));
                setZoomLevel((prev) => Math.min(130, Math.max(25, Math.round(prev + factor))));
            }
        };

        // 2. Touchscreen Two-Finger Pinch (phones, tablets, touchscreens)
        let initialDist = 0;
        let startZoom = 100;

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                initialDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                startZoom = zoomLevelRef.current;
                setIsPinching(true);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && initialDist > 0) {
                if (e.cancelable) {
                    e.preventDefault();
                }
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                const scale = currentDist / initialDist;
                const targetZoom = Math.round(startZoom * scale);
                setZoomLevel(Math.min(130, Math.max(25, targetZoom)));
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (e.touches.length < 2) {
                initialDist = 0;
                setIsPinching(false);
            }
        };

        // 3. Safari Gesture events (macOS trackpad pinch gestures)
        const handleGestureStart = (e: Event) => {
            e.preventDefault();
            startZoom = zoomLevelRef.current;
            setIsPinching(true);
        };

        const handleGestureChange = (e: any) => {
            e.preventDefault();
            if (typeof e.scale === 'number') {
                const target = Math.round(startZoom * e.scale);
                setZoomLevel(Math.min(130, Math.max(25, target)));
            }
        };

        const handleGestureEnd = (e: Event) => {
            e.preventDefault();
            setIsPinching(false);
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        el.addEventListener('touchstart', handleTouchStart, { passive: false });
        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        el.addEventListener('touchend', handleTouchEnd);
        el.addEventListener('touchcancel', handleTouchEnd);
        el.addEventListener('gesturestart', handleGestureStart, { passive: false });
        el.addEventListener('gesturechange', handleGestureChange, { passive: false });
        el.addEventListener('gestureend', handleGestureEnd);

        return () => {
            el.removeEventListener('wheel', handleWheel);
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
            el.removeEventListener('touchcancel', handleTouchEnd);
            el.removeEventListener('gesturestart', handleGestureStart);
            el.removeEventListener('gesturechange', handleGestureChange);
            el.removeEventListener('gestureend', handleGestureEnd);
        };
    }, []);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen?.().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.().catch(() => {});
            setIsFullscreen(false);
        }
    };

    const q = searchQuery.trim().toLowerCase();

    // Matching employee IDs for high-precision employee search
    const matchingEmpIds = useMemo(() => {
        if (!q) return new Set<number>();
        const set = new Set<number>();
        employees.forEach((emp) => {
            if (
                emp.name.toLowerCase().includes(q) ||
                (emp.position && emp.position.toLowerCase().includes(q)) ||
                (emp.workplace && emp.workplace.toLowerCase().includes(q)) ||
                (emp.department && emp.department.toLowerCase().includes(q))
            ) {
                set.add(emp.id);
            }
        });
        return set;
    }, [q, employees]);

    const matchesWing = useCallback(
        (wing: OrgWingNode) => {
            if (!q) return true;
            if (wing.title.toLowerCase().includes(q)) return true;
            if (wing.subtitle.toLowerCase().includes(q)) return true;
            if (wing.summary.toLowerCase().includes(q)) return true;

            const wingLeader = mapping.wingLeaders[wing.id];
            if (
                wingLeader &&
                (wingLeader.name.toLowerCase().includes(q) || wingLeader.position.toLowerCase().includes(q))
            ) {
                return true;
            }

            return wing.directorates.some((d) => {
                if (d.name.toLowerCase().includes(q)) return true;
                const dirLeader = mapping.dirLeaders[d.id];
                if (
                    dirLeader &&
                    (dirLeader.name.toLowerCase().includes(q) || dirLeader.position.toLowerCase().includes(q))
                ) {
                    return true;
                }
                return d.divisions.some((div) => {
                    if (div.name.toLowerCase().includes(q)) return true;
                    const emps = mapping.divisionEmployees[div.id] || [];
                    return emps.some((emp) => matchingEmpIds.has(emp.id));
                });
            });
        },
        [q, mapping, matchingEmpIds]
    );

    const filteredWings = useMemo(() => {
        let baseWings: OrgWingNode[] = [];
        if (activeFilter === 'strategic') {
            baseWings = STRATEGIC_SUPPORT_WINGS;
        } else if (activeFilter === 'operating') {
            baseWings = OPERATING_OFFICERS_WINGS;
        } else {
            baseWings = [...STRATEGIC_SUPPORT_WINGS, ...OPERATING_OFFICERS_WINGS];
        }

        return baseWings.filter(matchesWing);
    }, [activeFilter, matchesWing]);

    const totalMatches = useMemo(() => {
        if (!q) return 0;
        return filteredWings.length;
    }, [q, filteredWings]);

    // Apex CEO leader
    const ceoLeader = useMemo(() => {
        return (
            mapping.wingLeaders['ceo'] || {
                name: 'Abel Bizuayehu Haile',
                position: 'Chief Executive Officer',
                photo_url: null,
                status: 'Permanent',
                workplace: 'H.O',
            }
        );
    }, [mapping.wingLeaders]);

    const handleSelectCeo = useCallback(() => {
        const ceoEmp = employees.find(
            (e) =>
                e.name.toLowerCase().includes('abel bizuayehu') ||
                (e.position && e.position.toLowerCase().includes('chief executive officer'))
        );
        if (ceoEmp) {
            setSelectedEmployee(ceoEmp);
        } else {
            setSelectedEmployee({
                id: 1,
                name: ceoLeader.name,
                position: ceoLeader.position,
                department_id: null,
                department: 'Office of the CEO',
                workplace: ceoLeader.workplace,
                status: ceoLeader.status,
                photo_url: ceoLeader.photo_url,
            });
        }
    }, [employees, ceoLeader]);

    return (
        <AuthenticatedLayout
            title="Organizational Structure"
            subtitle="Enterprise hierarchy and active operational staff organogram of EL-HADAR Engineering PLC."
            fullWidth
        >
            <Head title="Organizational Structure - EL-HADAR Group" />

            <div
                ref={containerRef}
                className="space-y-4 max-w-full pb-16 transition-colors duration-200"
            >
                {/* Organogram Toolbar */}
                <div className="bg-white dark:bg-[#1a1c20] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    {/* Search Field */}
                    <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-sm">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search employees, positions, departments..."
                                className="w-full pl-9 pr-8 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-[#0066cc] focus:bg-white dark:focus:bg-gray-900 rounded-lg outline-none transition-all placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        {searchQuery && (
                            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 rounded-md">
                                {matchingEmpIds.size > 0
                                    ? `${matchingEmpIds.size} staff found`
                                    : `${totalMatches} ${totalMatches === 1 ? 'unit' : 'units'}`}
                            </span>
                        )}
                    </div>

                    {/* Track Filter Segmented Control */}
                    <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700/60">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                activeFilter === 'all'
                                    ? 'bg-white dark:bg-gray-900 text-[#0066cc] dark:text-[#2997ff] shadow-xs font-semibold'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                        >
                            All Wings (12)
                        </button>
                        <button
                            onClick={() => setActiveFilter('strategic')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                activeFilter === 'strategic'
                                    ? 'bg-white dark:bg-gray-900 text-[#0066cc] dark:text-[#2997ff] shadow-xs font-semibold'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                        >
                            Strategic Support (6)
                        </button>
                        <button
                            onClick={() => setActiveFilter('operating')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                activeFilter === 'operating'
                                    ? 'bg-white dark:bg-gray-900 text-[#0066cc] dark:text-[#2997ff] shadow-xs font-semibold'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                        >
                            Operations (6)
                        </button>
                    </div>

                    {/* Toolbar Actions */}
                    <div className="flex items-center gap-2 ml-auto flex-wrap">
                        {/* Option to switch between Compact Scroll (default) and Full Tree Roster */}
                        <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700/60">
                            <button
                                onClick={() => setIsScrollable(true)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                    isScrollable
                                        ? 'bg-white dark:bg-gray-900 text-[#0066cc] dark:text-[#2997ff] shadow-2xs font-semibold'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                                title="Limit roster height with compact scrollable containers"
                            >
                                Compact Scroll
                            </button>
                            <button
                                onClick={() => setIsScrollable(false)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                    !isScrollable
                                        ? 'bg-white dark:bg-gray-900 text-[#0066cc] dark:text-[#2997ff] shadow-2xs font-semibold'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                                title="Display all team members continuously in the organization tree"
                            >
                                Full Tree Roster
                            </button>
                        </div>

                        <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                            <button
                                onClick={expandAll}
                                title="Expand All Nodes & Rosters"
                                className="px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-r border-gray-200 dark:border-gray-800"
                            >
                                Expand All
                            </button>
                            <button
                                onClick={collapseAll}
                                title="Collapse All Sub-units"
                                className="px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-r border-gray-200 dark:border-gray-800"
                            >
                                Collapse Sub-units
                            </button>
                            <button
                                onClick={toggleAllStaffRosters}
                                title="Toggle All Employee Rosters"
                                className="px-2.5 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-medium transition-colors"
                            >
                                {expandedDivisionRosters.size > 0 ? 'Hide Staff' : 'Show Staff'}
                            </button>
                        </div>

                        {/* Zoom toolbar */}
                        <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                            <button
                                onClick={handleZoomOut}
                                disabled={zoomLevel <= 25}
                                title="Zoom Out (Min 25%)"
                                className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                            >
                                <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={handleFitWidth}
                                title="Fit to Screen (70%)"
                                className="px-2 text-[11px] font-mono text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 select-none transition-colors"
                            >
                                {zoomLevel}%
                            </button>
                            <button
                                onClick={handleZoomIn}
                                disabled={zoomLevel >= 130}
                                title="Zoom In"
                                className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                            >
                                <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={handleResetZoom}
                                title="Reset Zoom (100%)"
                                className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 border-l border-gray-200 dark:border-gray-800 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={toggleFullscreen}
                                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 border-l border-gray-200 dark:border-gray-800 transition-colors"
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="w-4.5 h-4.5" />
                                ) : (
                                    <Maximize2 className="w-4.5 h-4.5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Canvas Container with subtle background and two-finger gesture support */}
                <div
                    ref={canvasContainerRef}
                    style={{ touchAction: 'pan-x pan-y' }}
                    className="relative w-full overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#f4f7fb] dark:bg-[#0c0e12] p-2.5 sm:p-4 min-h-[750px] shadow-xs"
                >
                    <div
                        className={`${
                            isPinching ? 'duration-0' : 'duration-150'
                        } transition-transform ease-out origin-top flex flex-col items-center mx-auto w-max min-w-full px-4`}
                        style={{
                            transform: `scale(${zoomLevel / 100})`,
                        }}
                    >
                        {/* ------------------------------------------------------------- */}
                        {/* LEVEL 1: APEX (CHIEF EXECUTIVE OFFICER)                       */}
                        {/* ------------------------------------------------------------- */}
                        <div className="flex flex-col items-center">
                            {/* Apex Card */}
                            <TesseraOrgCard
                                title="CHIEF EXECUTIVE OFFICER (CEO)"
                                subtitle="Office of the CEO • Executive Committee Chair"
                                icon={Crown}
                                isApex
                                avatarBg="#0066cc"
                                leader={ceoLeader}
                                staffCount={metrics.total_headcount}
                                onClick={handleSelectCeo}
                            />

                            {/* Stem down to toggle button */}
                            <div
                                style={{ width: '2px', height: '20px', backgroundColor: '#3b82f6' }}
                                className="shrink-0"
                            />

                            {/* Toggle Button [-] */}
                            <button
                                onClick={() => setCollapseWings((prev) => !prev)}
                                className="size-5 rounded border border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shadow-xs hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors z-10 select-none cursor-pointer"
                                title={collapseWings ? 'Expand enterprise wings' : 'Collapse enterprise wings'}
                            >
                                {collapseWings ? '+' : '−'}
                            </button>

                            {/* Stem down entering into wings */}
                            {!collapseWings && (
                                <div
                                    style={{ width: '2px', height: '24px', backgroundColor: '#3b82f6' }}
                                    className="shrink-0"
                                />
                            )}
                        </div>

                        {/* ------------------------------------------------------------- */}
                        {/* ENTERPRISE WINGS HORIZONTAL BRANCHES                          */}
                        {/* ------------------------------------------------------------- */}
                        {!collapseWings && (
                            <div className="w-full flex flex-col items-center">
                                <HorizontalOrgTree
                                    wings={filteredWings}
                                    expandedWingIds={expandedWingIds}
                                    expandedDirIds={expandedDirIds}
                                    expandedDivisionRosters={expandedDivisionRosters}
                                    mapping={mapping}
                                    matchingEmpIds={matchingEmpIds}
                                    isScrollable={isScrollable}
                                    onToggleWing={toggleWingExpansion}
                                    onToggleDir={toggleDirExpansion}
                                    onToggleDivisionRoster={toggleDivisionRoster}
                                    onSelectEmployee={setSelectedEmployee}
                                    searchQuery={searchQuery}
                                />
                            </div>
                        )}

                        {/* Footer Summary */}
                        <div className="mt-12 pt-4 border-t border-gray-300 dark:border-gray-800 w-full flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400 px-2 font-medium">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 dark:text-gray-100">
                                    {metrics.company}
                                </span>
                                <span>|</span>
                                <span>Active Staff Enterprise Organogram</span>
                                <span>–</span>
                                <span>Prepared by {metrics.prepared_by}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="inline-flex items-center gap-1.5 font-semibold text-gray-900 dark:text-gray-100">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Headcount: {metrics.total_headcount} Staff
                                </span>
                                <span>Cycle: {metrics.effective_cycle}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Slide-over Profile Drawer */}
            <EmployeeProfileDrawer
                employee={selectedEmployee}
                onClose={() => setSelectedEmployee(null)}
            />
        </AuthenticatedLayout>
    );
}

// -------------------------------------------------------------
// EXACT CARD FROM USER SPEC (CLEAN UNIFORM BORDER, 2X BIGGER AVATARS, LARGER TEXTS)
// -------------------------------------------------------------
interface TesseraOrgCardProps {
    title: string;
    subtitle?: string;
    icon?: any;
    isApex?: boolean;
    isSubordinate?: boolean;
    badge?: string;
    isMatch?: boolean;
    avatarBg?: string;
    leader?: NodeLeader;
    staffCount?: number;
    onClick?: () => void;
}

function TesseraOrgCard({
    title,
    subtitle,
    icon: IconComponent = User,
    isApex = false,
    isSubordinate = false,
    badge,
    isMatch = false,
    avatarBg = '#0066cc',
    leader,
    staffCount,
    onClick,
}: TesseraOrgCardProps) {
    return (
        <div
            onClick={onClick}
            className={`group relative flex items-start gap-3.5 w-full bg-white dark:bg-[#1a1d24] rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3.5 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer transition-all ${
                isApex ? 'max-w-[440px] mx-auto' : ''
            } ${
                isMatch ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/50 dark:bg-blue-950/40' : ''
            }`}
        >
            {/* Left Circular Avatar (2x Enlarged Avatar or Icon) */}
            {leader ? (
                <div className="shrink-0 mt-0.5">
                    <CircleAvatar
                        name={leader.name}
                        photoUrl={leader.photo_url}
                        size={isApex ? 'lg' : 'md'}
                        showStatusDot
                        status={leader.status}
                        className="group-hover:scale-105 transition-transform"
                    />
                </div>
            ) : (
                <div
                    style={{ backgroundColor: avatarBg }}
                    className="w-14 h-14 min-w-14 min-h-14 rounded-full flex items-center justify-center shrink-0 text-white shadow-xs group-hover:scale-105 transition-transform mt-0.5"
                >
                    <IconComponent className="w-7 h-7 text-white" />
                </div>
            )}

            {/* Title & Subtitle - LARGER TYPOGRAPHY, FULL WIDTH, NO CUTOFFS */}
            <div className="flex-1 min-w-0 text-left">
                {leader ? (
                    <>
                        <div className="flex items-start justify-between gap-1.5">
                            <span className="text-[11px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 break-words leading-tight flex-1">
                                {title}
                            </span>
                            {staffCount !== undefined && staffCount > 0 && (
                                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 shrink-0 whitespace-nowrap">
                                    {staffCount} staff
                                </span>
                            )}
                        </div>
                        <div
                            className={`${
                                isApex ? 'text-base sm:text-lg font-bold' : 'text-sm sm:text-base font-bold'
                            } text-gray-900 dark:text-gray-100 break-words leading-snug mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}
                        >
                            {leader.name}
                        </div>
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-300 break-words leading-tight mt-0.5">
                            {leader.position}
                        </div>
                        {subtitle && (
                            <div className="text-[11px] text-gray-400 dark:text-gray-500 break-words leading-tight mt-0.5">
                                {subtitle}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex items-start justify-between gap-1.5">
                            <div
                                className={`${
                                    isApex
                                        ? 'text-base sm:text-lg font-bold'
                                        : isSubordinate
                                        ? 'text-sm font-semibold'
                                        : 'text-sm sm:text-base font-bold'
                                } text-gray-900 dark:text-gray-100 break-words leading-snug flex-1`}
                            >
                                {title}
                            </div>
                            {staffCount !== undefined && staffCount > 0 && (
                                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 shrink-0 whitespace-nowrap">
                                    {staffCount} staff
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 break-words leading-tight mt-1">
                                {subtitle}
                            </div>
                        )}
                    </>
                )}
                {badge && (
                    <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {badge}
                    </span>
                )}
            </div>

            {/* Three Dots Menu Icon */}
            <div className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded transition-colors shrink-0">
                <MoreVertical className="w-4 h-4" />
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// HORIZONTAL ORGANOGRAM TREE (FLUID HORIZONTAL SPREAD, SCROLLABLE OPTION)
// -------------------------------------------------------------
interface HorizontalOrgTreeProps {
    wings: OrgWingNode[];
    expandedWingIds: Set<string>;
    expandedDirIds: Set<string>;
    expandedDivisionRosters: Set<string>;
    mapping: HierarchyMapping;
    matchingEmpIds: Set<number>;
    isScrollable: boolean;
    onToggleWing: (id: string) => void;
    onToggleDir: (id: string) => void;
    onToggleDivisionRoster: (id: string) => void;
    onSelectEmployee: (emp: OrgEmployee) => void;
    searchQuery: string;
}

function HorizontalOrgTree({
    wings,
    expandedWingIds,
    expandedDirIds,
    expandedDivisionRosters,
    mapping,
    matchingEmpIds,
    isScrollable,
    onToggleWing,
    onToggleDir,
    onToggleDivisionRoster,
    onSelectEmployee,
    searchQuery,
}: HorizontalOrgTreeProps) {
    const q = searchQuery.trim().toLowerCase();
    const totalCols = wings.length;

    const getWingIcon = (iconName: string) => {
        switch (iconName) {
            case 'Crown':
                return Crown;
            case 'Compass':
                return Compass;
            case 'ShieldCheck':
                return ShieldCheck;
            case 'AlertTriangle':
                return AlertTriangle;
            case 'Scale':
                return Scale;
            case 'Megaphone':
                return Megaphone;
            case 'ShieldAlert':
                return ShieldAlert;
            case 'HardHat':
                return HardHat;
            case 'Briefcase':
                return Briefcase;
            case 'Banknote':
                return Banknote;
            case 'Wrench':
                return Wrench;
            case 'Users':
                return Users;
            case 'Rocket':
                return Rocket;
            default:
                return User;
        }
    };

    if (totalCols === 0) {
        return (
            <div className="py-12 text-center text-xs text-gray-500 dark:text-gray-400">
                No departments or positions match "{searchQuery}"
            </div>
        );
    }

    return (
        <div className="w-full flex justify-center">
            {/* Horizontal Row of Wings with Continuous Connector Line */}
            <div className="flex items-start justify-center gap-8 min-w-max">
                {wings.map((wing, colIdx) => {
                    const isExpanded = expandedWingIds.has(wing.id);
                    const wingLeader = mapping.wingLeaders[wing.id];
                    const wingStaffCount = mapping.nodeStaffCounts[wing.id] || 0;

                    const isMatch =
                        q &&
                        (wing.title.toLowerCase().includes(q) ||
                            wing.subtitle.toLowerCase().includes(q) ||
                            (wingLeader &&
                                (wingLeader.name.toLowerCase().includes(q) ||
                                    wingLeader.position.toLowerCase().includes(q))) ||
                            wing.directorates.some((d) => {
                                if (d.name.toLowerCase().includes(q)) return true;
                                return d.divisions.some((div) => {
                                    if (div.name.toLowerCase().includes(q)) return true;
                                    const emps = mapping.divisionEmployees[div.id] || [];
                                    return emps.some((emp) => matchingEmpIds.has(emp.id));
                                });
                            }));

                    return (
                        <div key={wing.id} className="flex flex-col items-center shrink-0">
                            {/* Horizontal Bus Line & Vertical Drop Stem into this Card */}
                            <div className="relative w-full" style={{ height: '20px' }}>
                                {totalCols > 1 && (
                                    <>
                                        {/* Leftmost column: line from center to right edge + gap bridge */}
                                        {colIdx === 0 && (
                                            <div
                                                style={{
                                                    height: '2px',
                                                    top: 0,
                                                    left: '50%',
                                                    right: '-16px',
                                                    backgroundColor: '#3b82f6',
                                                }}
                                                className="absolute"
                                            />
                                        )}
                                        {/* Middle columns: line across from left edge to right edge through gap bridges */}
                                        {colIdx > 0 && colIdx < totalCols - 1 && (
                                            <div
                                                style={{
                                                    height: '2px',
                                                    top: 0,
                                                    left: '-16px',
                                                    right: '-16px',
                                                    backgroundColor: '#3b82f6',
                                                }}
                                                className="absolute"
                                            />
                                        )}
                                        {/* Rightmost column: line from left edge to center */}
                                        {colIdx === totalCols - 1 && (
                                            <div
                                                style={{
                                                    height: '2px',
                                                    top: 0,
                                                    left: '-16px',
                                                    right: '50%',
                                                    backgroundColor: '#3b82f6',
                                                }}
                                                className="absolute"
                                            />
                                        )}
                                    </>
                                )}
                                {/* Vertical drop line down into the card */}
                                <div
                                    style={{
                                        width: '2px',
                                        height: '20px',
                                        top: 0,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        backgroundColor: '#3b82f6',
                                    }}
                                    className="absolute"
                                />
                            </div>

                            {/* Wing Card - FIXED 320-340px WIDTH CENTERED ABOVE SUB-TREE */}
                            <div className="w-[320px] sm:w-[340px]">
                                <TesseraOrgCard
                                    title={wing.title}
                                    subtitle={wing.subtitle}
                                    icon={getWingIcon(wing.iconName)}
                                    badge={wing.tag}
                                    isMatch={!!isMatch}
                                    avatarBg={
                                        wing.accentColor ||
                                        (wing.category === 'strategic' ? '#0066cc' : '#0284c7')
                                    }
                                    leader={wingLeader}
                                    staffCount={wingStaffCount}
                                    onClick={() => {
                                        if (wingLeader) {
                                            onSelectEmployee({
                                                id: 0,
                                                name: wingLeader.name,
                                                position: wingLeader.position,
                                                department_id: null,
                                                department: wing.title,
                                                workplace: wingLeader.workplace,
                                                status: wingLeader.status,
                                                photo_url: wingLeader.photo_url,
                                            });
                                        } else {
                                            onToggleWing(wing.id);
                                        }
                                    }}
                                />
                            </div>

                            {/* Vertical Stem down to toggle button */}
                            <div
                                style={{ width: '2px', height: '14px', backgroundColor: '#3b82f6' }}
                                className="shrink-0"
                            />

                            {/* Toggle Button [-] / [+] */}
                            <button
                                onClick={() => onToggleWing(wing.id)}
                                className={`size-5 rounded border text-[11px] font-bold flex items-center justify-center shadow-2xs transition-colors z-10 select-none cursor-pointer ${
                                    isExpanded
                                        ? 'border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-600 dark:bg-blue-900/60 dark:text-blue-300 hover:bg-blue-200'
                                        : 'border-gray-300 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100'
                                }`}
                                title={isExpanded ? 'Collapse sub-units' : `Expand (${wing.directorates.length} units)`}
                            >
                                {isExpanded ? '−' : '+'}
                            </button>

                            {/* ------------------------------------------------------------- */}
                            {/* SUBORDINATE UNITS: HORIZONTAL ROW OF DIRECTORATES             */}
                            {/* ------------------------------------------------------------- */}
                            {isExpanded && wing.directorates.length > 0 && (
                                <div className="flex flex-col items-center w-full">
                                    {/* Connector line down from toggle button */}
                                    <div
                                        style={{ width: '2px', height: '14px', backgroundColor: '#3b82f6' }}
                                        className="shrink-0"
                                    />

                                    {/* Row of Directorate Nodes (Side-by-side with full width) */}
                                    <div className="flex items-start justify-center gap-6 min-w-max">
                                        {wing.directorates.map((dir, dirIdx) => {
                                            const totalDirs = wing.directorates.length;
                                            const isDirExpanded = expandedDirIds.has(dir.id);
                                            const hasDivisions = dir.divisions.length > 0;
                                            const dirLeader = mapping.dirLeaders[dir.id];
                                            const dirStaffCount = mapping.nodeStaffCounts[dir.id] || 0;

                                            const isDirMatch =
                                                q &&
                                                (dir.name.toLowerCase().includes(q) ||
                                                    (dirLeader &&
                                                        (dirLeader.name.toLowerCase().includes(q) ||
                                                            dirLeader.position.toLowerCase().includes(q))) ||
                                                    dir.divisions.some((div) => {
                                                        if (div.name.toLowerCase().includes(q)) return true;
                                                        const emps = mapping.divisionEmployees[div.id] || [];
                                                        return emps.some((emp) => matchingEmpIds.has(emp.id));
                                                    }));

                                            return (
                                                <div
                                                    key={dir.id}
                                                    className="flex flex-col items-center shrink-0 w-[320px] sm:w-[340px]"
                                                >
                                                    {/* Sub-bus connector line across directorates */}
                                                    <div className="relative w-full" style={{ height: '16px' }}>
                                                        {totalDirs > 1 && (
                                                            <>
                                                                {/* Leftmost: from 50% to right edge + half gap (-12px for gap-6) */}
                                                                {dirIdx === 0 && (
                                                                    <div
                                                                        style={{
                                                                            height: '2px',
                                                                            top: 0,
                                                                            left: '50%',
                                                                            right: '-12px',
                                                                            backgroundColor: '#3b82f6',
                                                                        }}
                                                                        className="absolute"
                                                                    />
                                                                )}
                                                                {/* Middle: across from left edge to right edge through gap bridges */}
                                                                {dirIdx > 0 && dirIdx < totalDirs - 1 && (
                                                                    <div
                                                                        style={{
                                                                            height: '2px',
                                                                            top: 0,
                                                                            left: '-12px',
                                                                            right: '-12px',
                                                                            backgroundColor: '#3b82f6',
                                                                        }}
                                                                        className="absolute"
                                                                    />
                                                                )}
                                                                {/* Rightmost: from left edge (-12px) to 50% */}
                                                                {dirIdx === totalDirs - 1 && (
                                                                    <div
                                                                        style={{
                                                                            height: '2px',
                                                                            top: 0,
                                                                            left: '-12px',
                                                                            right: '50%',
                                                                            backgroundColor: '#3b82f6',
                                                                        }}
                                                                        className="absolute"
                                                                    />
                                                                )}
                                                            </>
                                                        )}
                                                        {/* Vertical drop line down into the directorate card */}
                                                        <div
                                                            style={{
                                                                width: '2px',
                                                                height: '16px',
                                                                top: 0,
                                                                left: '50%',
                                                                transform: 'translateX(-50%)',
                                                                backgroundColor: '#3b82f6',
                                                            }}
                                                            className="absolute"
                                                        />
                                                    </div>

                                                    {/* Directorate Card - FULL WIDTH, NO CUTOFFS */}
                                                    <div className="w-full">
                                                        <TesseraOrgCard
                                                            title={dir.name}
                                                            subtitle={
                                                                hasDivisions
                                                                    ? `${dir.divisions.length} Divisions • Directorate`
                                                                    : 'Direct Functional Unit'
                                                            }
                                                            icon={Building2}
                                                            isSubordinate
                                                            badge={dir.badge}
                                                            isMatch={!!isDirMatch}
                                                            avatarBg="#0284c7"
                                                            leader={dirLeader}
                                                            staffCount={dirStaffCount}
                                                            onClick={() => {
                                                                if (dirLeader) {
                                                                    onSelectEmployee({
                                                                        id: 0,
                                                                        name: dirLeader.name,
                                                                        position: dirLeader.position,
                                                                        department_id: null,
                                                                        department: dir.name,
                                                                        workplace: dirLeader.workplace,
                                                                        status: dirLeader.status,
                                                                        photo_url: dirLeader.photo_url,
                                                                    });
                                                                } else if (hasDivisions) {
                                                                    onToggleDir(dir.id);
                                                                }
                                                            }}
                                                        />
                                                    </div>

                                                    {/* If has divisions, toggle button and leaf-style division stack */}
                                                    {hasDivisions && (
                                                        <div className="flex flex-col items-center w-full">
                                                            {/* Stem down to toggle button */}
                                                            <div
                                                                style={{
                                                                    width: '2px',
                                                                    height: '8px',
                                                                    backgroundColor: '#3b82f6',
                                                                }}
                                                                className="shrink-0"
                                                            />

                                                            {/* Toggle button for divisions */}
                                                            <button
                                                                onClick={() => onToggleDir(dir.id)}
                                                                className={`size-5 rounded border text-[11px] font-bold flex items-center justify-center shadow-2xs transition-colors z-10 select-none cursor-pointer ${
                                                                    isDirExpanded
                                                                        ? 'border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-600 dark:bg-blue-900/60 dark:text-blue-300 hover:bg-blue-200'
                                                                        : 'border-gray-300 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100'
                                                                }`}
                                                                title={
                                                                    isDirExpanded
                                                                        ? 'Collapse divisions'
                                                                        : `Expand (${dir.divisions.length} divisions)`
                                                                }
                                                            >
                                                                {isDirExpanded ? '−' : '+'}
                                                            </button>

                                                            {/* Leaf-style Subordinate Division Cards */}
                                                            {isDirExpanded && (
                                                                <div className="flex flex-col w-full">
                                                                    {/* Connector from toggle button to left tree spine */}
                                                                    <div className="relative w-full h-3">
                                                                        {/* Center drop line from toggle button */}
                                                                        <div
                                                                            style={{
                                                                            width: '2px',
                                                                            height: '6px',
                                                                            top: 0,
                                                                            left: '50%',
                                                                            transform: 'translateX(-50%)',
                                                                            backgroundColor: '#3b82f6',
                                                                        }}
                                                                        className="absolute"
                                                                    />
                                                                    {/* Horizontal line to left spine at 14px */}
                                                                    <div
                                                                        style={{
                                                                            height: '2px',
                                                                            top: '6px',
                                                                            left: '14px',
                                                                            right: '50%',
                                                                            backgroundColor: '#3b82f6',
                                                                        }}
                                                                        className="absolute"
                                                                    />
                                                                    {/* Left drop down into first division item */}
                                                                    <div
                                                                        style={{
                                                                            width: '2px',
                                                                            height: '6px',
                                                                            top: '6px',
                                                                            left: '14px',
                                                                            backgroundColor: '#3b82f6',
                                                                        }}
                                                                        className="absolute"
                                                                    />
                                                                </div>

                                                                {/* Division cards with left leaf connectors */}
                                                                <div className="flex flex-col w-full">
                                                                    {dir.divisions.map((div, divIdx) => {
                                                                        const isLastDiv =
                                                                            divIdx === dir.divisions.length - 1;
                                                                        const divEmployees =
                                                                            mapping.divisionEmployees[div.id] || [];
                                                                        const hasEmployees = divEmployees.length > 0;
                                                                        const isRosterExpanded =
                                                                            expandedDivisionRosters.has(div.id);

                                                                        const hasMatchingEmp = divEmployees.some(
                                                                            (emp) => matchingEmpIds.has(emp.id)
                                                                        );
                                                                        const isDivMatch =
                                                                            q &&
                                                                            (div.name.toLowerCase().includes(q) ||
                                                                                hasMatchingEmp);

                                                                        return (
                                                                            <div
                                                                                key={div.id}
                                                                                className="relative w-full flex flex-col pl-6 pr-0 py-1"
                                                                            >
                                                                                {/* Vertical spine on the left side */}
                                                                                <div
                                                                                    style={{
                                                                                        width: '2px',
                                                                                        top: 0,
                                                                                        bottom: isLastDiv ? '20px' : 0,
                                                                                        left: '14px',
                                                                                        backgroundColor: '#3b82f6',
                                                                                    }}
                                                                                    className="absolute"
                                                                                />

                                                                                {/* Horizontal leaf branch into the left edge of the division card */}
                                                                                <div
                                                                                    style={{
                                                                                        height: '2px',
                                                                                        top: '20px',
                                                                                        left: '14px',
                                                                                        width: '10px',
                                                                                        backgroundColor: '#3b82f6',
                                                                                    }}
                                                                                    className="absolute"
                                                                                />

                                                                                {/* Division Card - CLEAN, FULL WIDTH, NO BUTTON ON THE CARD */}
                                                                                <div
                                                                                    className={`w-full bg-white dark:bg-[#1a1d24] rounded-lg border border-gray-200 dark:border-gray-800 px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-2xs hover:border-blue-400 transition-all ${
                                                                                        isDivMatch
                                                                                            ? 'ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-950/40'
                                                                                            : ''
                                                                                    }`}
                                                                                >
                                                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                                                                                            <FileText className="w-3.5 h-3.5" />
                                                                                        </div>
                                                                                        <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 break-words leading-snug">
                                                                                            {div.name}
                                                                                        </span>
                                                                                    </div>

                                                                                    {/* Right side: Employee Count Badge Only (NO TOGGLE ON CARD) */}
                                                                                    {hasEmployees && (
                                                                                        <span
                                                                                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shrink-0 whitespace-nowrap"
                                                                                            title={`${divEmployees.length} active team members`}
                                                                                        >
                                                                                            {divEmployees.length} {divEmployees.length === 1 ? 'member' : 'members'}
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                {/* Dedicated Toggle Button for People, exactly like the division node place */}
                                                                                {hasEmployees && (
                                                                                    <div className="flex flex-col items-center w-full my-1.5">
                                                                                        {/* Stem down from division card to people toggle button */}
                                                                                        <div
                                                                                            style={{
                                                                                                width: '2px',
                                                                                                height: '8px',
                                                                                                backgroundColor: '#3b82f6',
                                                                                            }}
                                                                                            className="shrink-0"
                                                                                        />

                                                                                        {/* Toggle Button [-] / [+] for People */}
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                onToggleDivisionRoster(div.id);
                                                                                            }}
                                                                                            className={`size-5 rounded border text-[11px] font-bold flex items-center justify-center shadow-2xs transition-colors z-10 select-none cursor-pointer ${
                                                                                                isRosterExpanded
                                                                                                    ? 'border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-600 dark:bg-blue-900/60 dark:text-blue-300 hover:bg-blue-200'
                                                                                                    : 'border-gray-300 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100'
                                                                                            }`}
                                                                                            title={
                                                                                                isRosterExpanded
                                                                                                    ? 'Collapse team members'
                                                                                                    : `Show all ${divEmployees.length} team members`
                                                                                            }
                                                                                        >
                                                                                            {isRosterExpanded ? '−' : '+'}
                                                                                        </button>

                                                                                        {/* When expanded: Connector and Leaf List for Employees */}
                                                                                        {isRosterExpanded && (
                                                                                            <div className="flex flex-col w-full">
                                                                                                {/* Connector from toggle button to left employee tree spine */}
                                                                                                <div className="relative w-full h-3">
                                                                                                    {/* Center drop line from toggle button */}
                                                                                                    <div
                                                                                                        style={{
                                                                                                            width: '2px',
                                                                                                            height: '6px',
                                                                                                            top: 0,
                                                                                                            left: '50%',
                                                                                                            transform: 'translateX(-50%)',
                                                                                                            backgroundColor: '#3b82f6',
                                                                                                        }}
                                                                                                        className="absolute"
                                                                                                    />
                                                                                                    {/* Horizontal line to left spine at 12px */}
                                                                                                    <div
                                                                                                        style={{
                                                                                                            height: '2px',
                                                                                                            top: '6px',
                                                                                                            left: '12px',
                                                                                                            right: '50%',
                                                                                                            backgroundColor: '#3b82f6',
                                                                                                        }}
                                                                                                        className="absolute"
                                                                                                    />
                                                                                                    {/* Left drop down into first employee card */}
                                                                                                    <div
                                                                                                        style={{
                                                                                                            width: '2px',
                                                                                                            height: '6px',
                                                                                                            top: '6px',
                                                                                                            left: '12px',
                                                                                                            backgroundColor: '#3b82f6',
                                                                                                        }}
                                                                                                        className="absolute"
                                                                                                    />
                                                                                                </div>

                                                                                                {/* Active team members container: switchable between non-scrollable (full tree) and scrollable */}
                                                                                                <div
                                                                                                    className={`flex flex-col w-full space-y-1.5 pr-0.5 ${
                                                                                                        isScrollable
                                                                                                            ? 'max-h-96 overflow-y-auto custom-scrollbar'
                                                                                                            : ''
                                                                                                    }`}
                                                                                                >
                                                                                                    {divEmployees.map((emp, empIdx) => {
                                                                                                        const isLastEmp =
                                                                                                            empIdx === divEmployees.length - 1;
                                                                                                        const isEmpMatch = matchingEmpIds.has(emp.id);

                                                                                                        return (
                                                                                                            <div
                                                                                                                key={emp.id}
                                                                                                                onClick={() => onSelectEmployee(emp)}
                                                                                                                className="relative w-full flex items-center pl-6 pr-0 py-0.5 group cursor-pointer"
                                                                                                            >
                                                                                                                {/* Vertical Sub-spine Line */}
                                                                                                                <div
                                                                                                                    style={{
                                                                                                                        width: '2px',
                                                                                                                        top: 0,
                                                                                                                        bottom: isLastEmp ? '50%' : 0,
                                                                                                                        left: '12px',
                                                                                                                        backgroundColor: '#3b82f6',
                                                                                                                    }}
                                                                                                                    className="absolute"
                                                                                                                />

                                                                                                                {/* Horizontal Leaf Branch into Employee Card */}
                                                                                                                <div
                                                                                                                    style={{
                                                                                                                        height: '2px',
                                                                                                                        top: '50%',
                                                                                                                        transform: 'translateY(-50%)',
                                                                                                                        left: '12px',
                                                                                                                        width: '12px',
                                                                                                                        backgroundColor: '#3b82f6',
                                                                                                                    }}
                                                                                                                    className="absolute"
                                                                                                                />

                                                                                                                {/* Employee Card - 2X BIGGER AVATAR, LARGER TEXT, NO CUTOFFS */}
                                                                                                                <div
                                                                                                                    className={`w-full bg-white dark:bg-[#16181f] rounded-xl border border-gray-200 dark:border-gray-800 px-3.5 py-3 flex items-start justify-between gap-3 shadow-2xs hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all ${
                                                                                                                        isEmpMatch
                                                                                                                            ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/70 dark:bg-blue-950/50'
                                                                                                                            : ''
                                                                                                                    }`}
                                                                                                                >
                                                                                                                    {/* 2x Bigger Avatar (48px) + Full Name + Full Position */}
                                                                                                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                                                                                                        <div className="shrink-0 mt-0.5">
                                                                                                                            <CircleAvatar
                                                                                                                                name={emp.name}
                                                                                                                                photoUrl={emp.photo_url}
                                                                                                                                size="sm"
                                                                                                                                showStatusDot
                                                                                                                                status={emp.status}
                                                                                                                            />
                                                                                                                        </div>
                                                                                                                        <div className="min-w-0 flex-1 text-left">
                                                                                                                            <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 break-words leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                                                                                {emp.name}
                                                                                                                            </div>
                                                                                                                            <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 break-words leading-tight mt-0.5">
                                                                                                                                {emp.position || 'Staff Member'}
                                                                                                                            </div>
                                                                                                                            {emp.workplace && (
                                                                                                                                <div className="flex items-center gap-1.5 mt-1 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">
                                                                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                                                                                                    <span className="break-words leading-tight">
                                                                                                                                        {emp.workplace}
                                                                                                                                    </span>
                                                                                                                                </div>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                    </div>

                                                                                                                    {/* Status Badge */}
                                                                                                                    <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                                                                                                                        <span
                                                                                                                            className={`text-[8.5px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                                                                                                                                emp.status === 'Permanent'
                                                                                                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50'
                                                                                                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50'
                                                                                                                            }`}
                                                                                                                            title={`Status: ${emp.status}`}
                                                                                                                        >
                                                                                                                            {emp.status === 'Permanent'
                                                                                                                                ? 'PERMANENT'
                                                                                                                                : 'PROBATION'}
                                                                                                                        </span>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        );
                                                                                                    })}
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);
}
