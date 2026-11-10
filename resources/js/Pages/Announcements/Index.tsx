import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Input } from '@/Components/ui/input';
import { toast } from 'sonner';
import AnnouncementReaderModal, { AnnouncementItem } from '@/Components/AnnouncementReaderModal';
import AnnouncementAnalyticsDrawer from '@/Components/AnnouncementAnalyticsDrawer';
import InteractiveTour, { TourStep } from '@/Components/InteractiveTour';
import {
    Activity,
    AlertTriangle,
    Bell,
    CheckCircle2,
    Clock,
    Compass,
    FileText,
    Megaphone,
    MoreHorizontal,
    Pencil,
    Pin,
    Plus,
    Search,
    Shield,
    Trash2,
    X,
    Users,
    Download,
    Eye,
} from 'lucide-react';

interface AnnouncementRecord extends AnnouncementItem {
    is_active: boolean;
    reads_count?: number;
    acknowledgments_count?: number;
    reactions_count?: number;
    is_read_by_user?: boolean;
    is_acknowledged_by_user?: boolean;
    current_user_reaction?: string | null;
}

interface Props {
    announcements: {
        data: AnnouncementRecord[];
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
        category?: string;
        priority?: string;
        status?: string;
    };
    categories: string[];
    priorities: string[];
    departments: { id: number; name: string }[];
}

const announcementsIndexTourSteps: TourStep[] = [
    {
        target: '[data-tour="announcements-search"]',
        title: 'Instant Circular Search',
        content: 'Quickly find directives, engineering safety bulletins, policies, or memos by typing any keyword or subject.',
        badge: 'Search & Retrieval',
        placement: 'bottom',
        tip: 'Press Enter or click the clear icon to reset your search filter.',
    },
    {
        target: '[data-tour="announcements-tour-btn"]',
        title: 'Interactive Guided Tour',
        content: 'Re-trigger this walkthrough anytime to explore key notice board tools, reading modals, and delivery telemetry.',
        badge: 'Help & Navigation',
        placement: 'bottom',
        tip: 'You can also trigger tours using the top navbar Tour button on supported pages.',
    },
    {
        target: '[data-tour="announcements-publish-btn"]',
        title: 'Author New Circular',
        content: 'Draft and broadcast official company notices with bilingual copy, file attachments, and targeted audience rules.',
        badge: 'Executive Publishing',
        placement: 'bottom',
        tip: 'Only HR Administrators and System Administrators can author new circulars.',
    },
    {
        target: '[data-tour="announcements-category-filters"]',
        title: 'Thematic Category Filters',
        content: 'Filter circulars across Policies, Health & Safety, Payroll, Public Holidays, Corporate Events, and General memos.',
        badge: 'Taxonomy',
        placement: 'bottom',
        tip: 'Pills update the active feed immediately without page reload.',
    },
    {
        target: '[data-tour="announcements-priority-filters"]',
        title: 'Urgency & Severity Tiers',
        content: 'Filter notices by severity level — Critical safety directives, Important announcements, or General standard memos.',
        badge: 'Priority Triage',
        placement: 'bottom',
        tip: 'Critical bulletins are highlighted with prominent red borders across the platform.',
    },
    {
        target: '[data-tour="announcements-feed"]',
        title: 'Company Directives Feed',
        content: 'Responsive grid displaying all active announcements with live read badges, e-sign indicators, and publication stamps.',
        badge: 'Notice Board',
        placement: 'top',
        tip: 'Hover over any card to reveal quick actions and elevated card styling.',
    },
    {
        target: '[data-tour="first-circular-card"]',
        title: 'Circular Overview Card',
        content: 'Each card summarizes key metadata, bilingual Amharic subtitle, truncated body copy, and compliance markers.',
        badge: 'Card Dossier',
        placement: 'top',
        tip: 'Cards are arranged chronologically with pinned announcements anchored first.',
    },
    {
        target: '[data-tour="first-circular-badges"]',
        title: 'Urgency & Pinned Status',
        content: 'Visual badges indicate urgency level, category classification, and whether the memo is pinned as a company priority.',
        badge: 'Status Markers',
        placement: 'bottom',
        tip: 'Pinned circulars stay visible at the top of employee portal widgets until unpinned.',
    },
    {
        target: '[data-tour="first-circular-headline"]',
        title: 'Full Reader Modal',
        content: 'Click the headline or excerpt to open the reader modal with full bilingual text, download links, and acknowledgment actions.',
        badge: 'Interactive Reader',
        placement: 'bottom',
        tip: 'Reading a circular automatically logs a read receipt timestamp in the audit database.',
    },
    {
        target: '[data-tour="first-circular-attachment"]',
        title: 'Official Document Download',
        content: 'Download officially stamped circulars, signed executive memos, or PDF annexes directly in one click.',
        badge: 'Document Vault',
        placement: 'top',
        tip: 'Attachments open in a secure browser tab or trigger direct PDF download.',
    },
    {
        target: '[data-tour="first-circular-compliance"]',
        title: 'E-Sign Compliance Status',
        content: 'Shows whether this circular legally mandates employee acknowledgment and whether you have completed sign-off.',
        badge: 'Compliance & E-Sign',
        placement: 'top',
        tip: 'Green indicates verified acknowledgment; blue indicates pending sign-off.',
    },
    {
        target: '[data-tour="first-circular-actions"]',
        title: 'Delivery Audit & Governance',
        content: 'Administrators can open the real-time Delivery Audit drawer to see read receipts, or use the menu to edit or delete circulars.',
        badge: 'Auditing & Controls',
        placement: 'left',
        tip: 'The Audit drawer reveals exact employee names, departments, and confirmation times.',
    },
];

export default function AnnouncementsIndex({
    announcements,
    filters,
    categories,
    priorities,
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const isHR = Boolean(auth.user && (auth.user.role === 'HRAdmin' || auth.user.role === 'SysAdmin'));

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');
    const [selectedPriority, setSelectedPriority] = useState(filters.priority || 'all');

    // Modals & Tours
    const [readerAnnouncement, setReaderAnnouncement] = useState<AnnouncementItem | null>(null);
    const [isReaderOpen, setIsReaderOpen] = useState(false);
    const [analyticsId, setAnalyticsId] = useState<number | null>(null);
    const [analyticsTitle, setAnalyticsTitle] = useState<string>('');
    const [deleteTarget, setDeleteTarget] = useState<AnnouncementRecord | null>(null);
    const [isTourOpen, setIsTourOpen] = useState(false);

    useEffect(() => {
        const handleOpenTour = () => setIsTourOpen(true);
        window.addEventListener('open-announcements-index-tour', handleOpenTour);

        if (typeof window !== 'undefined' && window.location.search.includes('tour=true')) {
            setIsTourOpen(true);
        }

        return () => {
            window.removeEventListener('open-announcements-index-tour', handleOpenTour);
        };
    }, []);

    const applyFilters = (newCategory?: string, newPriority?: string) => {
        const cat = newCategory !== undefined ? newCategory : selectedCategory;
        const pri = newPriority !== undefined ? newPriority : selectedPriority;

        router.get(
            route('announcements.index'),
            {
                search: search || undefined,
                category: cat !== 'all' ? cat : undefined,
                priority: pri !== 'all' ? pri : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleOpenReader = (announcement: AnnouncementRecord) => {
        setReaderAnnouncement({
            ...announcement,
            is_read: announcement.is_read_by_user,
            is_acknowledged: announcement.is_acknowledged_by_user,
            user_reaction: announcement.current_user_reaction,
        });
        setIsReaderOpen(true);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(route('announcements.destroy', deleteTarget.id), {
            onSuccess: () => {
                setDeleteTarget(null);
            },
            onError: () => {
                toast.error('Could not delete announcement.');
            },
        });
    };

    const getPriorityBadge = (p: string) => {
        switch (p) {
            case 'critical':
                return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-[10px] font-semibold"><AlertTriangle className="w-2.5 h-2.5 mr-1" /> Critical</Badge>;
            case 'important':
                return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-semibold"><Bell className="w-2.5 h-2.5 mr-1" /> Important</Badge>;
            default:
                return <Badge variant="secondary" className="text-[10px] font-medium text-muted-foreground">General</Badge>;
        }
    };

    const getCategoryBadge = (c: string) => {
        const labels: Record<string, string> = {
            policy: 'Policy',
            safety: 'Safety',
            payroll: 'Payroll',
            holiday: 'Holiday',
            event: 'Event',
            general: 'General',
        };
        return <Badge variant="outline" className="text-[10px] text-muted-foreground">{labels[c] || c}</Badge>;
    };

    return (
        <AuthenticatedLayout
            title="Company Notice Board"
            subtitle="Official circulars, engineering safety directives, policies, and company memos."
        >
            <Head title="Notice Board & Announcements - Elhadar Engineering HRMS" />

            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <form onSubmit={handleSearchSubmit} data-tour="announcements-search" className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search circulars by keyword..."
                        className="h-9 pl-9 text-xs rounded-xl border-border/80 focus-visible:ring-primary/20"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                router.get(route('announcements.index'));
                            }}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </form>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsTourOpen(true)}
                        data-tour="announcements-tour-btn"
                        className="rounded-xl border-border text-xs h-9 font-medium gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer shadow-2xs"
                    >
                        <Compass className="w-3.5 h-3.5 text-primary" />
                        <span>Tour Board</span>
                    </Button>
                    {isHR && (
                        <Button asChild size="sm" data-tour="announcements-publish-btn" className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 shadow-sm text-xs h-9">
                            <Link href={route('announcements.create')}>
                                <Plus className="w-4 h-4" />
                                <span>Publish Circular</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <div data-tour="announcements-category-filters" className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground mr-1">Category:</span>
                    {['all', 'policy', 'safety', 'payroll', 'holiday', 'event', 'general'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => {
                                setSelectedCategory(cat);
                                applyFilters(cat, selectedPriority);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                                selectedCategory === cat
                                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                                    : 'bg-muted/40 hover:bg-muted text-muted-foreground border border-border/60'
                            }`}
                        >
                            {cat === 'all' ? 'All Categories' : cat}
                        </button>
                    ))}
                </div>

                <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

                <div data-tour="announcements-priority-filters" className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">Priority:</span>
                    {['all', 'critical', 'important', 'standard'].map((pri) => (
                        <button
                            key={pri}
                            onClick={() => {
                                setSelectedPriority(pri);
                                applyFilters(selectedCategory, pri);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                                selectedPriority === pri
                                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                                    : 'bg-muted/40 hover:bg-muted text-muted-foreground border border-border/60'
                            }`}
                        >
                            {pri === 'all' ? 'All Priorities' : pri}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid of Circular Cards */}
            {announcements.data.length === 0 ? (
                <Card data-tour="announcements-feed" className="rounded-2xl border-dashed border-2 border-border/80 p-12 text-center bg-card/40">
                    <Megaphone className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <h3 className="text-sm font-semibold text-foreground">No circulars found</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        There are no active company announcements matching your search criteria.
                    </p>
                </Card>
            ) : (
                <div data-tour="announcements-feed" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {announcements.data.map((item, idx) => {
                        const isUnread = !item.is_read_by_user;
                        return (
                            <Card
                                key={item.id}
                                {...(idx === 0 ? { 'data-tour': 'first-circular-card' } : {})}
                                className={`rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden bg-card ${
                                    item.priority === 'critical'
                                        ? 'border-red-500/30'
                                        : item.priority === 'important'
                                        ? 'border-amber-500/30'
                                        : 'border-border/80'
                                }`}
                            >
                                <div className="p-5 pb-3">
                                    {/* Top Metadata */}
                                    <div className="flex items-center justify-between gap-2 mb-2.5">
                                        <div
                                            {...(idx === 0 ? { 'data-tour': 'first-circular-badges' } : {})}
                                            className="flex items-center gap-1.5 flex-wrap"
                                        >
                                            {getPriorityBadge(item.priority)}
                                            {getCategoryBadge(item.category)}
                                            {item.is_pinned && (
                                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-semibold">
                                                    <Pin className="w-2 h-2 mr-0.5" /> Pinned
                                                </Badge>
                                            )}
                                        </div>

                                        {isHR && (
                                            <div {...(idx === 0 ? { 'data-tour': 'first-circular-actions' } : {})}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44 text-xs rounded-xl">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setAnalyticsId(item.id);
                                                                setAnalyticsTitle(item.title);
                                                            }}
                                                            className="gap-2 cursor-pointer"
                                                        >
                                                            <Activity className="w-3.5 h-3.5 text-primary" />
                                                            <span>Delivery Audit</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                                                            <Link href={route('announcements.edit', item.id)}>
                                                                <Pencil className="w-3.5 h-3.5" />
                                                                <span>Edit Circular</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteTarget(item)}
                                                            className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Delete</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </div>

                                    {/* Title & Amharic Pill & Snippet */}
                                    <div {...(idx === 0 ? { 'data-tour': 'first-circular-headline' } : {})}>
                                        <h3
                                            onClick={() => handleOpenReader(item)}
                                            className="text-sm font-bold text-foreground tracking-tight hover:text-primary transition-colors cursor-pointer line-clamp-2 leading-snug"
                                        >
                                            {item.title}
                                        </h3>

                                        {item.title_am && (
                                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                                {item.title_am}
                                            </p>
                                        )}

                                        {/* Snippet */}
                                        <p
                                            onClick={() => handleOpenReader(item)}
                                            className="text-xs text-muted-foreground line-clamp-3 mt-2.5 leading-relaxed cursor-pointer"
                                        >
                                            {item.content}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer & Compliance Badges */}
                                <div className="p-4 pt-3 bg-muted/20 border-t border-border/50 text-xs flex items-center justify-between gap-2 mt-auto">
                                    <div
                                        {...(idx === 0 ? { 'data-tour': 'first-circular-attachment' } : {})}
                                        className="flex items-center gap-2 flex-wrap"
                                    >
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            {new Date(item.published_at || item.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>

                                        {item.attachment_url && (
                                            <a
                                                href={item.attachment_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1"
                                            >
                                                <Download className="w-2.5 h-2.5" /> PDF
                                            </a>
                                        )}
                                    </div>

                                    <div
                                        {...(idx === 0 ? { 'data-tour': 'first-circular-compliance' } : {})}
                                        className="flex items-center gap-1.5"
                                    >
                                        {item.requires_acknowledgment && (
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                                item.is_acknowledged_by_user
                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                    : 'bg-primary/10 text-primary'
                                            }`}>
                                                <Shield className="w-2.5 h-2.5" />
                                                {item.is_acknowledged_by_user ? 'Acknowledged' : 'E-Sign'}
                                            </span>
                                        )}

                                        {isHR && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setAnalyticsId(item.id);
                                                    setAnalyticsTitle(item.title);
                                                }}
                                                className="h-7 px-2 text-[10px] font-medium text-muted-foreground hover:text-foreground gap-1 rounded-lg"
                                            >
                                                <Eye className="w-3 h-3 text-primary" />
                                                <span>Audit ({item.reads_count || 0})</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Reader Modal */}
            <AnnouncementReaderModal
                announcement={readerAnnouncement}
                isOpen={isReaderOpen}
                onClose={() => setIsReaderOpen(false)}
                onAcknowledged={(id) => {
                    // Update in list
                    announcements.data.forEach((it) => {
                        if (it.id === id) {
                            it.is_acknowledged_by_user = true;
                            it.is_read_by_user = true;
                        }
                    });
                }}
            />

            {/* Compliance & Delivery Audit Drawer */}
            <AnnouncementAnalyticsDrawer
                announcementId={analyticsId}
                announcementTitle={analyticsTitle}
                isOpen={analyticsId !== null}
                onClose={() => setAnalyticsId(null)}
            />

            {/* Delete Confirmation Alert */}
            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Circular?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;? This will remove the circular and all associated compliance records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                            Delete Circular
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Guided Tour Spotlight */}
            <InteractiveTour
                steps={announcementsIndexTourSteps}
                isOpen={isTourOpen}
                onClose={() => setIsTourOpen(false)}
                tourTitle="Company notice board tour"
            />
        </AuthenticatedLayout>
    );
}
