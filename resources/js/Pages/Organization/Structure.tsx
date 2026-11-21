import { useState, useRef, useMemo, useCallback } from 'react';
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

interface Props {
    metrics: {
        total_headcount: number;
        active_departments: number;
        prepared_by: string;
        effective_cycle: string;
        company: string;
    };
}

export default function OrganizationStructure({ metrics }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'strategic' | 'operating'>('all');
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Track collapse toggle for all enterprise wings
    const [collapseWings, setCollapseWings] = useState(false);

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

    // Expanded wings for child directorates - Default: ALL EXPANDED so all subordinate units are visible
    const [expandedWingIds, setExpandedWingIds] = useState<Set<string>>(() => {
        return new Set(allWingIds);
    });

    // Expanded directorates for child divisions - Default: expanded for full visibility
    const [expandedDirIds, setExpandedDirIds] = useState<Set<string>>(() => {
        return new Set(allDirIds);
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

    const expandAll = useCallback(() => {
        setCollapseWings(false);
        setExpandedWingIds(new Set(allWingIds));
        setExpandedDirIds(new Set(allDirIds));
    }, [allWingIds, allDirIds]);

    const collapseAll = useCallback(() => {
        setExpandedWingIds(new Set());
        setExpandedDirIds(new Set());
    }, []);

    const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 130));
    const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 45));
    const handleResetZoom = () => setZoomLevel(100);
    const handleFitWidth = () => setZoomLevel(70);

    const containerRef = useRef<HTMLDivElement>(null);

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

    const matchesWing = useCallback(
        (wing: OrgWingNode) => {
            if (!q) return true;
            if (wing.title.toLowerCase().includes(q)) return true;
            if (wing.subtitle.toLowerCase().includes(q)) return true;
            if (wing.summary.toLowerCase().includes(q)) return true;
            return wing.directorates.some((d) => {
                if (d.name.toLowerCase().includes(q)) return true;
                return d.divisions.some((div) => div.name.toLowerCase().includes(q));
            });
        },
        [q]
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

    return (
        <AuthenticatedLayout
            title="Organizational Structure"
            subtitle="Enterprise hierarchy and operational reporting structure of EL-HADAR Engineering PLC."
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
                                placeholder="Search departments, divisions, positions..."
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
                                {totalMatches} {totalMatches === 1 ? 'match' : 'matches'}
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
                    <div className="flex items-center gap-1.5 ml-auto">
                        <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                            <button
                                onClick={expandAll}
                                title="Expand All Nodes & Sub-units"
                                className="px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-r border-gray-200 dark:border-gray-800"
                            >
                                Expand All
                            </button>
                            <button
                                onClick={collapseAll}
                                title="Collapse All Sub-units"
                                className="px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Collapse Sub-units
                            </button>
                        </div>

                        {/* Zoom toolbar */}
                        <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                            <button
                                onClick={handleZoomOut}
                                disabled={zoomLevel <= 45}
                                title="Zoom Out"
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
                                title="Reset Zoom (85%)"
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

                {/* Canvas Container with subtle background */}
                <div className="relative w-full overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#f4f7fb] dark:bg-[#0c0e12] p-2.5 sm:p-4 min-h-[750px] shadow-xs">
                    <div
                        className="transition-transform duration-200 origin-top flex flex-col items-center mx-auto w-max min-w-full px-4"
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
                                    onToggleWing={toggleWingExpansion}
                                    onToggleDir={toggleDirExpansion}
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
                                <span>Complete Enterprise Organogram</span>
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
        </AuthenticatedLayout>
    );
}

// -------------------------------------------------------------
// EXACT CARD FROM USER SPEC (CLEAN UNIFORM BORDER, NO TOP TICKS)
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
    onClick,
}: TesseraOrgCardProps) {
    return (
        <div
            onClick={onClick}
            className={`group relative flex items-center gap-3 ${
                isApex ? 'w-[380px] max-w-full' : 'w-full'
            } bg-white dark:bg-[#1a1d24] rounded-lg border border-gray-200 dark:border-gray-800 px-3.5 py-3 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer transition-all ${
                isMatch ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/50 dark:bg-blue-950/40' : ''
            }`}
        >
            {/* Left Circular Avatar Icon (solid vibrant blue with clean white icon) */}
            <div
                style={{ backgroundColor: avatarBg }}
                className="w-9 h-9 min-w-9 min-h-9 rounded-full flex items-center justify-center shrink-0 text-white shadow-2xs group-hover:scale-105 transition-transform"
            >
                <IconComponent className="w-4.5 h-4.5 text-white" />
            </div>

            {/* Title & Subtitle */}
            <div className="flex-1 min-w-0 text-left">
                <div
                    className={`${
                        isApex
                            ? 'text-sm font-bold'
                            : isSubordinate
                            ? 'text-xs font-semibold'
                            : 'text-xs font-bold'
                    } text-gray-900 dark:text-gray-100 break-words leading-tight`}
                >
                    {title}
                </div>
                {subtitle && (
                    <div className="text-[10.5px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {subtitle}
                    </div>
                )}
                {badge && (
                    <span className="inline-block mt-0.5 text-[8.5px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
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
// HORIZONTAL ORGANOGRAM TREE (FLUID HORIZONTAL SPREAD)
// -------------------------------------------------------------
interface HorizontalOrgTreeProps {
    wings: OrgWingNode[];
    expandedWingIds: Set<string>;
    expandedDirIds: Set<string>;
    onToggleWing: (id: string) => void;
    onToggleDir: (id: string) => void;
    searchQuery: string;
}

function HorizontalOrgTree({
    wings,
    expandedWingIds,
    expandedDirIds,
    onToggleWing,
    onToggleDir,
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
            <div className="flex items-start justify-center gap-5 min-w-max">
                {wings.map((wing, colIdx) => {
                    const isExpanded = expandedWingIds.has(wing.id);
                    const isMatch =
                        q &&
                        (wing.title.toLowerCase().includes(q) ||
                            wing.subtitle.toLowerCase().includes(q) ||
                            wing.directorates.some(
                                (d) =>
                                    d.name.toLowerCase().includes(q) ||
                                    d.divisions.some((div) => div.name.toLowerCase().includes(q))
                            ));

                    return (
                        <div key={wing.id} className="flex flex-col items-center shrink-0 min-w-[280px]">
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
                                                    right: '-10px',
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
                                                    left: '-10px',
                                                    right: '-10px',
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
                                                    left: '-10px',
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

                            {/* Wing Card */}
                            <div className="w-[280px]">
                                <TesseraOrgCard
                                    title={wing.title}
                                    subtitle={wing.subtitle}
                                    icon={getWingIcon(wing.iconName)}
                                    badge={wing.tag}
                                    isMatch={!!isMatch}
                                    avatarBg={wing.accentColor || (wing.category === 'strategic' ? '#0066cc' : '#0284c7')}
                                    onClick={() => onToggleWing(wing.id)}
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

                                    {/* Row of Directorate Nodes (Side-by-side) */}
                                    <div className="flex items-start justify-center gap-4 min-w-max">
                                        {wing.directorates.map((dir, dirIdx) => {
                                            const totalDirs = wing.directorates.length;
                                            const isDirExpanded = expandedDirIds.has(dir.id);
                                            const hasDivisions = dir.divisions.length > 0;
                                            const isDirMatch =
                                                q &&
                                                (dir.name.toLowerCase().includes(q) ||
                                                    dir.divisions.some((div) => div.name.toLowerCase().includes(q)));

                                            return (
                                                <div
                                                    key={dir.id}
                                                    className={`flex flex-col items-center shrink-0 ${
                                                        totalDirs === 1 ? 'w-[260px]' : 'w-[250px]'
                                                    }`}
                                                >
                                                    {/* Sub-bus connector line across directorates */}
                                                    <div className="relative w-full" style={{ height: '16px' }}>
                                                        {totalDirs > 1 && (
                                                            <>
                                                                {/* Leftmost: from 50% to right edge + half gap (-8px for gap-4) */}
                                                                {dirIdx === 0 && (
                                                                    <div
                                                                        style={{
                                                                            height: '2px',
                                                                            top: 0,
                                                                            left: '50%',
                                                                            right: '-8px',
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
                                                                            left: '-8px',
                                                                            right: '-8px',
                                                                            backgroundColor: '#3b82f6',
                                                                        }}
                                                                        className="absolute"
                                                                    />
                                                                )}
                                                                {/* Rightmost: from left edge (-8px) to 50% */}
                                                                {dirIdx === totalDirs - 1 && (
                                                                    <div
                                                                        style={{
                                                                            height: '2px',
                                                                            top: 0,
                                                                            left: '-8px',
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

                                                    {/* Directorate Card */}
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
                                                            onClick={() => {
                                                                if (hasDivisions) {
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
                                                                style={{ width: '2px', height: '8px', backgroundColor: '#3b82f6' }}
                                                                className="shrink-0"
                                                            />

                                                            <button
                                                                onClick={() => onToggleDir(dir.id)}
                                                                className={`size-5 rounded border text-[11px] font-bold flex items-center justify-center shadow-2xs transition-colors z-10 select-none cursor-pointer ${
                                                                    isDirExpanded
                                                                        ? 'border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-600 dark:bg-blue-900/60 dark:text-blue-300 hover:bg-blue-200'
                                                                        : 'border-gray-300 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100'
                                                                }`}
                                                                title={isDirExpanded ? 'Collapse divisions' : `Expand (${dir.divisions.length} divisions)`}
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
                                                                            const isDivMatch =
                                                                                q && div.name.toLowerCase().includes(q);
                                                                            const isLastDiv =
                                                                                divIdx === dir.divisions.length - 1;

                                                                            return (
                                                                                <div
                                                                                    key={div.id}
                                                                                    className="relative w-full flex items-center pl-6 pr-1 py-1"
                                                                                >
                                                                                    {/* Vertical spine on the left side */}
                                                                                    <div
                                                                                        style={{
                                                                                            width: '2px',
                                                                                            top: 0,
                                                                                            bottom: isLastDiv ? '50%' : 0,
                                                                                            left: '14px',
                                                                                            backgroundColor: '#3b82f6',
                                                                                        }}
                                                                                        className="absolute"
                                                                                    />

                                                                                    {/* Horizontal leaf branch into the left edge of the card */}
                                                                                    <div
                                                                                        style={{
                                                                                            height: '2px',
                                                                                            top: '50%',
                                                                                            transform: 'translateY(-50%)',
                                                                                            left: '14px',
                                                                                            width: '10px',
                                                                                            backgroundColor: '#3b82f6',
                                                                                        }}
                                                                                        className="absolute"
                                                                                    />

                                                                                    {/* Division Card */}
                                                                                    <div
                                                                                        className={`w-full bg-white dark:bg-[#1a1d24] rounded-md border border-gray-200 dark:border-gray-800 px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-2xs hover:border-blue-400 transition-all ${
                                                                                            isDivMatch
                                                                                                ? 'ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-950/40'
                                                                                                : ''
                                                                                        }`}
                                                                                    >
                                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                                            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                                                                                                <FileText className="w-3 h-3" />
                                                                                            </div>
                                                                                            <span className="text-[10.5px] font-medium text-gray-800 dark:text-gray-200 break-words leading-tight">
                                                                                                {div.name}
                                                                                            </span>
                                                                                        </div>
                                                                                        <MoreVertical className="w-3 h-3 text-gray-400 shrink-0" />
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
                    );
                })}
            </div>
        </div>
    );
}
