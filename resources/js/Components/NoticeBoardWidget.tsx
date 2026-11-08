import { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useTheme } from 'next-themes';
import axios from 'axios';
import { motion } from 'framer-motion';
import { PageProps } from '@/types';
import AnnouncementReaderModal, { AnnouncementItem } from './AnnouncementReaderModal';
import {
    Pin,
    AlertTriangle,
    Bell,
    Shield,
    FileText,
    ChevronRight,
    RotateCcw,
    Plus,
    LayoutGrid,
    List,
    CheckCircle2,
    Paperclip,
} from 'lucide-react';
import { Badge } from '@/Components/ui/badge';

// Authentic sticky note palettes with enhanced contrast for both light & dark modes
const STICKY_PALETTES = [
    {
        // Canary Warm Yellow (Classic Post-It)
        bg: 'bg-[#fffab3] dark:bg-[#342b14]',
        border: 'border-[#facc15] dark:border-[#eab308]/60',
        ink: 'text-[#3f1e04] dark:text-[#fef9c3]',
        muted: 'text-[#582a06] dark:text-[#fef08a]/90',
        badge: 'bg-[#fef08a] text-[#713f12] dark:bg-[#713f12]/70 dark:text-[#fef08a] border border-[#facc15]/50',
        readLink: 'text-[#3f1e04] dark:text-[#fef9c3]',
        pinType: 'gold',
    },
    {
        // Flamingo Rose/Pink
        bg: 'bg-[#fce7f3] dark:bg-[#3d192f]',
        border: 'border-[#f472b6] dark:border-[#f472b6]/60',
        ink: 'text-[#500724] dark:text-[#fce7f3]',
        muted: 'text-[#701a75] dark:text-[#fbcfe8]/90',
        badge: 'bg-[#fbcfe8] text-[#701a75] dark:bg-[#831843]/70 dark:text-[#fbcfe8] border border-[#f472b6]/50',
        readLink: 'text-[#500724] dark:text-[#fce7f3]',
        pinType: 'red',
    },
    {
        // Sky Powder Blue
        bg: 'bg-[#e0f2fe] dark:bg-[#132f48]',
        border: 'border-[#38bdf8] dark:border-[#38bdf8]/60',
        ink: 'text-[#082f49] dark:text-[#e0f2fe]',
        muted: 'text-[#0c4a6e] dark:text-[#bae6fd]/90',
        badge: 'bg-[#bae6fd] text-[#0c4a6e] dark:bg-[#0369a1]/70 dark:text-[#bae6fd] border border-[#38bdf8]/50',
        readLink: 'text-[#082f49] dark:text-[#e0f2fe]',
        pinType: 'silver',
    },
    {
        // Fresh Mint Green
        bg: 'bg-[#dcfce7] dark:bg-[#123826]',
        border: 'border-[#4ade80] dark:border-[#4ade80]/60',
        ink: 'text-[#022c22] dark:text-[#dcfce7]',
        muted: 'text-[#064e3b] dark:text-[#a7f3d0]/90',
        badge: 'bg-[#bbf7d0] text-[#064e3b] dark:bg-[#065f46]/70 dark:text-[#a7f3d0] border border-[#4ade80]/50',
        readLink: 'text-[#022c22] dark:text-[#dcfce7]',
        pinType: 'green',
    },
    {
        // Warm Apricot Peach
        bg: 'bg-[#ffedd5] dark:bg-[#3f2216]',
        border: 'border-[#fb923c] dark:border-[#fb923c]/60',
        ink: 'text-[#431407] dark:text-[#ffedd5]',
        muted: 'text-[#7c2d12] dark:text-[#fed7aa]/90',
        badge: 'bg-[#fed7aa] text-[#7c2d12] dark:bg-[#9a3412]/70 dark:text-[#fed7aa] border border-[#fb923c]/50',
        readLink: 'text-[#431407] dark:text-[#ffedd5]',
        pinType: 'amber',
    },
    {
        // Soft Lavender
        bg: 'bg-[#f3e8ff] dark:bg-[#321c45]',
        border: 'border-[#c084fc] dark:border-[#c084fc]/60',
        ink: 'text-[#3b0764] dark:text-[#f3e8ff]',
        muted: 'text-[#581c87] dark:text-[#e9d5ff]/90',
        badge: 'bg-[#e9d5ff] text-[#581c87] dark:bg-[#6b21a8]/70 dark:text-[#e9d5ff] border border-[#c084fc]/50',
        readLink: 'text-[#3b0764] dark:text-[#f3e8ff]',
        pinType: 'purple',
    },
];

// Seeded pseudo-random tilt degrees for organic bulletin board feel
const TILT_ANGLES = [-2.2, 1.8, -1.5, 2.5, -2.8, 1.2, -1.9, 2.1];

export default function NoticeBoardWidget() {
    const { auth } = usePage<PageProps>().props;
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
    const [isReaderOpen, setIsReaderOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'unread' | 'pinned'>('all');
    const [viewMode, setViewMode] = useState<'pinboard' | 'list'>('pinboard');
    const [dragResetKey, setDragResetKey] = useState(0);

    const boardRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    const canCreate = auth?.user?.role === 'SysAdmin' || auth?.user?.role === 'HRAdmin';

    const loadBulletins = async () => {
        try {
            const res = await axios.get('/notifications/feed');
            setAnnouncements(res.data.notifications || []);
        } catch {
            // Widget fallback
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBulletins();
    }, []);

    const handleOpen = (item: AnnouncementItem) => {
        if (isDraggingRef.current) return;
        setSelectedAnnouncement(item);
        setIsReaderOpen(true);
        if (!item.is_read) {
            setAnnouncements((prev) =>
                prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
            );
            axios.post(`/notifications/${item.id}/read`).catch(() => {});
        }
    };

    const handleAcknowledged = (id: number) => {
        setAnnouncements((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_acknowledged: true, is_read: true } : n))
        );
        if (selectedAnnouncement && selectedAnnouncement.id === id) {
            setSelectedAnnouncement((prev) => (prev ? { ...prev, is_acknowledged: true, is_read: true } : null));
        }
    };

    const filteredAnnouncements = announcements.filter((item) => {
        if (activeFilter === 'urgent') return item.priority === 'critical' || item.priority === 'important';
        if (activeFilter === 'pinned') return item.is_pinned;
        if (activeFilter === 'unread') return !item.is_read;
        return true;
    });

    const resetBoardPositions = () => {
        setDragResetKey((k) => k + 1);
    };

    // Realistic natural cork texture SVG pattern (embedded data URI for instant crisp rendering)
    const corkSvgLight = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='corkFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.82  0 0 0 0 0.63  0 0 0 0 0.43  0 0 0 0.48 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='%23cfa06b'/%3E%3Crect width='100%25' height='100%25' filter='url(%23corkFilter)' opacity='0.78'/%3E%3C/svg%3E")`;

    const corkSvgDark = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='corkFilterDark'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.28  0 0 0 0 0.28  0 0 0 0 0.32  0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='%2318181b'/%3E%3Crect width='100%25' height='100%25' filter='url(%23corkFilterDark)' opacity='0.85'/%3E%3C/svg%3E")`;

    if (loading) {
        return (
            <div className="rounded-[26px] p-3 sm:p-4 bg-gradient-to-br from-[#dfad75] via-[#c68f56] to-[#a46e37] dark:from-[#3f3f46] dark:via-[#27272a] dark:to-[#18181b] shadow-[0_16px_40px_rgba(40,20,5,0.22)] dark:shadow-[0_20px_48px_rgba(0,0,0,0.6)]">
                <div className="rounded-[18px] p-6 bg-[#cfa06b] dark:bg-[#18181b] border border-[#7c4d21]/40 dark:border-white/10">
                    <div className="h-6 w-48 bg-amber-900/20 dark:bg-zinc-700/40 rounded-md animate-pulse mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 rounded-xl bg-amber-900/10 dark:bg-zinc-800/40 border border-amber-900/20 dark:border-zinc-700/40 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (announcements.length === 0) {
        return (
            <div className="rounded-[26px] p-3.5 sm:p-4.5 bg-gradient-to-br from-[#dfad75] via-[#caa066] to-[#a46e37] dark:from-[#3f3f46] dark:via-[#27272a] dark:to-[#18181b] shadow-[0_18px_44px_rgba(40,20,5,0.22),0_4px_12px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_48px_rgba(0,0,0,0.6)]">
                <div
                    className="rounded-[18px] p-8 text-center relative overflow-hidden border border-[#7c4d21]/50 dark:border-white/10 shadow-[inset_0_8px_24px_rgba(40,20,5,0.48),inset_0_2px_6px_rgba(0,0,0,0.35)] dark:shadow-[inset_0_12px_32px_rgba(0,0,0,0.85)] bg-[#cfa06b] dark:bg-[#18181b]"
                    style={{
                        backgroundImage: isDark ? corkSvgDark : corkSvgLight,
                        backgroundSize: '160px 160px',
                    }}
                >
                    <div className="max-w-md mx-auto py-6 flex flex-col items-center relative z-10">
                        <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center mb-3 shadow-[0_4px_10px_rgba(0,0,0,0.3)] ring-2 ring-white/60">
                            <Pin className="w-6 h-6 rotate-45" />
                        </div>
                        <h3 className="text-base font-bold text-amber-950 dark:text-zinc-100 tracking-tight drop-shadow-xs">
                            Notice Board is Clean
                        </h3>
                        <p className="text-xs text-amber-900/90 dark:text-zinc-400 mt-1 max-w-xs font-medium">
                            No active notices. New announcements and company updates will appear here.
                        </p>
                        {canCreate && (
                            <Link
                                href={route('announcements.create')}
                                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0066cc] hover:bg-[#0071e3] px-4 py-2 rounded-full shadow-md transition-all active:scale-95"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>New Announcement</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <section aria-label="Company Notice Board" className="relative select-none">
            {/* The Real Physical Frame (Natural Pine/Oak in Light, Brushed Deep Titanium in Dark) */}
            <div className="rounded-[26px] p-3 sm:p-4 bg-gradient-to-br from-[#e0ae74] via-[#c9955c] to-[#a36e39] dark:from-[#3f3f46] dark:via-[#27272a] dark:to-[#18181b] shadow-[0_20px_48px_rgba(45,25,8,0.24),0_6px_16px_rgba(0,0,0,0.16),inset_0_2px_4px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.38)] dark:shadow-[0_24px_54px_rgba(0,0,0,0.65),inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all">
                {/* Inner Recessed Wooden Lip */}
                <div className="rounded-[20px] p-[2px] bg-gradient-to-br from-[#8a5525] via-[#6f421a] to-[#4e2c0e] dark:from-[#27272a] dark:via-[#18181b] dark:to-[#09090b] shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)]">
                    {/* The Natural Corkboard Surface (Golden Cork in Light, Deep Titanium Cork in Dark) */}
                    <div
                        ref={boardRef}
                        className="rounded-[18px] relative overflow-hidden transition-all shadow-[inset_0_10px_28px_rgba(35,18,5,0.52),inset_0_2px_6px_rgba(0,0,0,0.4)] dark:shadow-[inset_0_12px_32px_rgba(0,0,0,0.85)] bg-[#cfa06b] dark:bg-[#18181b]"
                        style={{
                            backgroundImage: isDark
                                ? `
                                    radial-gradient(circle at 18% 22%, rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px),
                                    radial-gradient(circle at 68% 42%, rgba(0, 0, 0, 0.45) 2px, transparent 2px),
                                    radial-gradient(circle at 38% 78%, rgba(255, 255, 255, 0.06) 1.8px, transparent 1.8px),
                                    radial-gradient(circle at 88% 18%, rgba(0, 0, 0, 0.4) 1.2px, transparent 1.2px),
                                    ${corkSvgDark}
                                `
                                : `
                                    radial-gradient(circle at 18% 22%, rgba(100, 55, 20, 0.28) 1.5px, transparent 1.5px),
                                    radial-gradient(circle at 68% 42%, rgba(80, 42, 14, 0.24) 2px, transparent 2px),
                                    radial-gradient(circle at 38% 78%, rgba(110, 65, 24, 0.25) 1.8px, transparent 1.8px),
                                    radial-gradient(circle at 88% 18%, rgba(95, 50, 18, 0.22) 1.2px, transparent 1.2px),
                                    ${corkSvgLight}
                                `,
                            backgroundSize: '36px 36px, 52px 52px, 44px 44px, 60px 60px, 160px 160px',
                        }}
                    >
                        {/* High-Contrast Frosted Plaque Header Bar (Crystal Clear Contrast in Both Light & Dark) */}
                        <div className="p-3.5 sm:p-4 border-b border-black/[0.08] dark:border-white/[0.1] bg-white/92 dark:bg-[#18181b]/95 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10 shadow-xs">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-amber-950 flex items-center justify-center shrink-0 shadow-sm ring-1 ring-white/80 dark:ring-white/10">
                                    <Pin className="w-5 h-5 -rotate-12 fill-amber-950/25" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-[#1d1d1f] dark:text-[#f4f4f5]">
                                            Company Notice Board
                                        </h3>
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-950 dark:text-zinc-200 dark:bg-white/10 border border-amber-600/30 dark:border-white/15">
                                            {announcements.length} {announcements.length === 1 ? 'Memo' : 'Memos'} Pinned
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-[#515154] dark:text-[#a1a1aa] font-medium flex items-center gap-1.5 mt-0.5">
                                        <span>Official engineering circulars &amp; directives</span>
                                        <span className="hidden sm:inline text-muted-foreground/40">•</span>
                                        <span className="hidden sm:inline text-[10px] text-[#8a5214] dark:text-[#38bdf8] font-bold">
                                            💡 Drag notes to arrange • Click to read
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Filter Pills & Interactive Controls with High Contrast */}
                            <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
                                {/* Filters */}
                                <div className="flex items-center gap-1 p-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.1] text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setActiveFilter('all')}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                            activeFilter === 'all'
                                                ? 'bg-white dark:bg-card text-[#1d1d1f] dark:text-white shadow-xs'
                                                : 'text-[#48484a] dark:text-[#d1d1d6] hover:text-[#1d1d1f] dark:hover:text-white'
                                        }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveFilter('urgent')}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                            activeFilter === 'urgent'
                                                ? 'bg-red-600 text-white shadow-xs'
                                                : 'text-red-700 dark:text-red-400 hover:text-red-800'
                                        }`}
                                    >
                                        🔴 Urgent
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveFilter('unread')}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                            activeFilter === 'unread'
                                                ? 'bg-[#0066cc] text-white shadow-xs'
                                                : 'text-[#0066cc] dark:text-[#38bdf8] hover:text-[#0052a3]'
                                        }`}
                                    >
                                        Unread
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveFilter('pinned')}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                            activeFilter === 'pinned'
                                                ? 'bg-amber-700 text-white shadow-xs'
                                                : 'text-amber-800 dark:text-amber-300 hover:text-amber-950'
                                        }`}
                                    >
                                        📌 Pinned
                                    </button>
                                </div>

                                {/* View Mode Toggle */}
                                <div className="flex items-center gap-1 bg-black/[0.05] dark:bg-white/[0.08] p-0.5 rounded-full border border-black/[0.06] dark:border-white/[0.1]">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('pinboard')}
                                        title="Interactive Corkboard View"
                                        className={`p-1.5 rounded-full transition-all ${
                                            viewMode === 'pinboard'
                                                ? 'bg-white dark:bg-card text-[#1d1d1f] dark:text-white shadow-xs'
                                                : 'text-[#515154] dark:text-[#d1d1d6] hover:text-[#1d1d1f]'
                                        }`}
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        title="Compact List View"
                                        className={`p-1.5 rounded-full transition-all ${
                                            viewMode === 'list'
                                                ? 'bg-white dark:bg-card text-[#1d1d1f] dark:text-white shadow-xs'
                                                : 'text-[#515154] dark:text-[#d1d1d6] hover:text-[#1d1d1f]'
                                        }`}
                                    >
                                        <List className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Reset Pins */}
                                {viewMode === 'pinboard' && (
                                    <button
                                        type="button"
                                        onClick={resetBoardPositions}
                                        title="Reset dragged sticky note positions"
                                        className="p-1.5 text-[#515154] dark:text-[#d1d1d6] hover:text-[#1d1d1f] hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                )}

                                {/* Post Note (HR/Admin) */}
                                {canCreate && (
                                    <Link
                                        href={route('announcements.create')}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#0066cc] hover:bg-[#0071e3] px-3.5 py-1.5 rounded-full shadow-sm transition-all active:scale-95"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">New Announcement</span>
                                    </Link>
                                )}

                                {/* Memo Archive Link */}
                                <Link
                                    href={route('announcements.index')}
                                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#0066cc] dark:text-[#38bdf8] hover:underline px-2 py-1.5 shrink-0"
                                >
                                    <span>Archive</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Interactive Corkboard Pin Area */}
                        {viewMode === 'pinboard' ? (
                            <div className="p-5 sm:p-7 min-h-[340px]">
                                {filteredAnnouncements.length === 0 ? (
                                    <div className="py-14 text-center">
                                        <p className="text-xs text-amber-950 dark:text-zinc-200 font-bold">
                                            No memos found under &ldquo;{activeFilter}&rdquo; filter.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setActiveFilter('all')}
                                            className="mt-2 text-xs text-[#0066cc] dark:text-[#38bdf8] font-semibold underline"
                                        >
                                            Show All Notes
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7 items-start">
                                        {filteredAnnouncements.map((item, idx) => {
                                            const palette = STICKY_PALETTES[idx % STICKY_PALETTES.length];
                                            const tiltAngle = TILT_ANGLES[item.id % TILT_ANGLES.length];
                                            const isCritical = item.priority === 'critical';
                                            const isImportant = item.priority === 'important';

                                            // 3D Pushpin styling
                                            const pinHeadClass = isCritical
                                                ? 'bg-gradient-to-br from-red-400 via-red-500 to-red-700 ring-red-300'
                                                : item.is_pinned
                                                ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 ring-yellow-200'
                                                : isImportant
                                                ? 'bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 ring-amber-300'
                                                : 'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 ring-slate-200';

                                            return (
                                                <motion.div
                                                    key={`${item.id}-${dragResetKey}`}
                                                    drag
                                                    dragConstraints={boardRef}
                                                    dragElastic={0.12}
                                                    onDragStart={() => {
                                                        isDraggingRef.current = true;
                                                    }}
                                                    onDragEnd={() => {
                                                        setTimeout(() => {
                                                            isDraggingRef.current = false;
                                                        }, 120);
                                                    }}
                                                    whileDrag={{
                                                        scale: 1.07,
                                                        rotate: 0,
                                                        zIndex: 50,
                                                        cursor: 'grabbing',
                                                        boxShadow:
                                                            '0 26px 42px -8px rgba(0,0,0,0.32), 0 14px 20px -6px rgba(0,0,0,0.2)',
                                                    }}
                                                    whileHover={{
                                                        scale: 1.03,
                                                        rotate: 0,
                                                        zIndex: 35,
                                                        boxShadow:
                                                            '0 22px 34px -8px rgba(0,0,0,0.24), 0 8px 14px -4px rgba(0,0,0,0.12)',
                                                    }}
                                                    initial={{ rotate: tiltAngle, opacity: 0, y: 12 }}
                                                    animate={{ rotate: tiltAngle, opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    onClick={() => handleOpen(item)}
                                                    className={`relative rounded-xl p-4 sm:p-5 select-none cursor-grab active:cursor-grabbing border ${palette.border} ${palette.bg} transition-shadow duration-200 flex flex-col justify-between min-h-[220px] shadow-[0_10px_22px_rgba(0,0,0,0.14),0_3px_6px_rgba(0,0,0,0.08)]`}
                                                    style={{
                                                        touchAction: 'none',
                                                    }}
                                                >
                                                    {/* Realistic 3D Pushpin Inserted into Cork */}
                                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
                                                        <div
                                                            className={`w-4 h-4 rounded-full shadow-[0_3px_6px_rgba(0,0,0,0.35)] relative ${pinHeadClass} ring-1 ring-white/70`}
                                                        >
                                                            {/* Specular pearl light reflection */}
                                                            <div className="absolute top-0.5 left-1 w-1.5 h-1.5 bg-white/80 rounded-full blur-[0.2px]" />
                                                        </div>
                                                        {/* Pin needle shadow cast on the paper */}
                                                        <div className="w-1.5 h-1 bg-black/35 rounded-full blur-[0.6px] -mt-0.5" />
                                                    </div>

                                                    {/* Frosted Tape Header for standard notes */}
                                                    {!isCritical && !item.is_pinned && (
                                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-white/45 dark:bg-white/10 backdrop-blur-xs border-y border-white/35 rotate-[-1deg] pointer-events-none rounded-xs opacity-75" />
                                                    )}

                                                    {/* Note Top Metadata */}
                                                    <div>
                                                        <div className="flex items-center justify-between gap-1 mb-2.5">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                {isCritical ? (
                                                                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-sm bg-red-600 text-white shadow-xs flex items-center gap-1">
                                                                        <AlertTriangle className="w-2.5 h-2.5" />
                                                                        CRITICAL
                                                                    </span>
                                                                ) : isImportant ? (
                                                                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm bg-amber-500 text-white shadow-xs flex items-center gap-1">
                                                                        <Bell className="w-2.5 h-2.5" />
                                                                        IMPORTANT
                                                                    </span>
                                                                ) : item.is_pinned ? (
                                                                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm bg-yellow-600 text-white shadow-xs flex items-center gap-1">
                                                                        <Pin className="w-2.5 h-2.5" />
                                                                        PINNED
                                                                    </span>
                                                                ) : (
                                                                    <span
                                                                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm ${palette.badge}`}
                                                                    >
                                                                        {item.category}
                                                                    </span>
                                                                )}

                                                                {/* Glowing Vibrant NEW Badge (No Icon, Pure Apple Luminous Glow) */}
                                                                {!item.is_read && (
                                                                    <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-[#0066cc] via-[#0071e3] to-[#2563eb] text-white shadow-[0_0_14px_rgba(0,113,227,0.85),0_0_5px_rgba(37,99,235,0.95)] ring-1 ring-white/70 dark:ring-blue-300/80 uppercase animate-pulse select-none inline-flex items-center justify-center leading-none">
                                                                        NEW
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <span className={`text-[10px] font-bold ${palette.muted} shrink-0`}>
                                                                {new Date(item.published_at || item.created_at).toLocaleDateString(
                                                                    'en-US',
                                                                    {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                    }
                                                                )}
                                                            </span>
                                                        </div>

                                                        {/* Note Title (Crisp, High-Contrast Typography) */}
                                                        <h4 className={`text-sm font-extrabold tracking-tight leading-snug line-clamp-2 ${palette.ink}`}>
                                                            {item.title}
                                                        </h4>

                                                        {/* Note Content Excerpt */}
                                                        <p className={`text-xs mt-2 leading-relaxed line-clamp-4 font-semibold ${palette.muted}`}>
                                                            {item.content}
                                                        </p>
                                                    </div>

                                                    {/* Note Bottom Details */}
                                                    <div className="mt-4 pt-2.5 border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between text-[11px] gap-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {item.requires_acknowledgment && (
                                                                <span
                                                                    className={`text-[10px] font-bold flex items-center gap-1 ${
                                                                        item.is_acknowledged
                                                                            ? 'text-emerald-700 dark:text-emerald-400'
                                                                            : 'text-amber-900 dark:text-amber-200'
                                                                    }`}
                                                                >
                                                                    {item.is_acknowledged ? (
                                                                        <>
                                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                            <span>Signed</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Shield className="w-3 h-3 text-amber-800" />
                                                                            <span>Sign-off</span>
                                                                        </>
                                                                    )}
                                                                </span>
                                                            )}

                                                            {item.attachment_url && (
                                                                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${palette.muted}`}>
                                                                    <Paperclip className="w-3 h-3" />
                                                                    <span>PDF</span>
                                                                </span>
                                                            )}
                                                        </div>

                                                        <span
                                                            className={`text-[10px] font-extrabold underline underline-offset-2 ${palette.readLink} opacity-90 hover:opacity-100`}
                                                        >
                                                            Read memo &rarr;
                                                        </span>
                                                    </div>

                                                    {/* Realistic Folded Dog-Ear Paper Curl */}
                                                    <div className="absolute bottom-0 right-0 w-4 h-4 overflow-hidden pointer-events-none rounded-br-xl">
                                                        <div className="w-full h-full bg-gradient-to-br from-transparent via-black/[0.06] to-black/[0.16] dark:to-white/[0.08]" />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Compact List View Mode on Corkboard */
                            <div className="p-4 divide-y divide-amber-950/20 dark:divide-white/10">
                                {filteredAnnouncements.map((item) => {
                                    const isCritical = item.priority === 'critical';
                                    const isImportant = item.priority === 'important';

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleOpen(item)}
                                            className={`p-3.5 rounded-xl hover:bg-amber-950/15 dark:hover:bg-white/[0.06] transition-all cursor-pointer flex items-start gap-3 ${
                                                !item.is_read ? 'bg-amber-950/10 dark:bg-white/[0.04]' : ''
                                            }`}
                                        >
                                            <div className="shrink-0 mt-0.5">
                                                {isCritical ? (
                                                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                ) : isImportant ? (
                                                    <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                                ) : item.is_pinned ? (
                                                    <Pin className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                                                ) : (
                                                    <FileText className="w-4 h-4 text-amber-900 dark:text-zinc-400" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className="text-xs truncate font-bold text-amber-950 dark:text-zinc-100">
                                                        {item.title}
                                                    </h4>
                                                    <span className="text-[10px] text-amber-900/80 dark:text-zinc-400 shrink-0 font-medium">
                                                        {new Date(item.published_at || item.created_at).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                            }
                                                        )}
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-amber-950/90 dark:text-zinc-300 line-clamp-1 mt-0.5">
                                                    {item.content}
                                                </p>

                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[9px] uppercase font-bold px-1.5 py-0 border-amber-950/30 dark:border-white/20 text-amber-950 dark:text-zinc-300"
                                                    >
                                                        {item.category}
                                                    </Badge>
                                                    {!item.is_read && (
                                                        <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-[#0066cc] via-[#0071e3] to-[#2563eb] text-white shadow-[0_0_12px_rgba(0,113,227,0.85),0_0_4px_rgba(37,99,235,0.95)] ring-1 ring-white/70 uppercase animate-pulse select-none inline-flex items-center justify-center leading-none">
                                                            NEW
                                                        </span>
                                                    )}
                                                    {item.requires_acknowledgment && (
                                                        <span
                                                            className={`text-[10px] font-bold flex items-center gap-1 ${
                                                                item.is_acknowledged ? 'text-emerald-800 dark:text-emerald-400' : 'text-amber-950 dark:text-amber-300 font-bold'
                                                            }`}
                                                        >
                                                            <Shield className="w-2.5 h-2.5" />
                                                            {item.is_acknowledged ? 'Signed' : 'Sign-off Required'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Memo Reader Modal */}
            <AnnouncementReaderModal
                announcement={selectedAnnouncement}
                isOpen={isReaderOpen}
                onClose={() => setIsReaderOpen(false)}
                onAcknowledged={handleAcknowledged}
            />
        </section>
    );
}
