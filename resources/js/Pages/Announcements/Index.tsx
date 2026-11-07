import { useMemo, useState } from 'react';
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
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/Components/ui/empty';
import { Input } from '@/Components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
} from '@/Components/ui/pagination';
import { Separator } from '@/Components/ui/separator';
import { toast } from 'sonner';
import {
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    Megaphone,
    MoreHorizontal,
    Pencil,
    Pin,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';

interface Announcement {
    id: number;
    title: string;
    content: string;
    is_pinned: boolean;
    is_active: boolean;
    published_at: string | null;
    expires_at: string | null;
    created_at: string;
    creator: {
        id: number;
        name: string;
        role: string;
    } | null;
}

interface Props {
    announcements: {
        data: Announcement[];
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
    };
}

const isHRAdmin = (user: { role?: string } | null | undefined) =>
    Boolean(user && (user.role === 'HRAdmin' || user.role === 'SysAdmin'));

const formatDate = (value: string | null): string => {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const isExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) {
        return false;
    }

    return new Date(expiresAt) <= new Date();
};

const initialsFor = (name: string | null | undefined): string => {
    const source = (name ?? 'System').trim();
    const parts = source.split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return 'S';
    }

    return parts
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase();
};

interface AnnouncementCardProps {
    announcement: Announcement;
    canManage: boolean;
    pinned?: boolean;
    onDelete: (announcement: Announcement) => void;
}

function AnnouncementCard({
    announcement,
    canManage,
    pinned = false,
    onDelete,
}: AnnouncementCardProps) {
    const creatorName = announcement.creator?.name ?? 'System';
    const expired = isExpired(announcement.expires_at);

    return (
        <Card
            className={`flex h-full flex-col shadow-none transition-colors ${
                pinned
                    ? 'border-primary/20 bg-primary/[0.035] hover:border-primary/35'
                    : 'border-border bg-card hover:border-primary/30'
            }`}
        >
            <CardHeader className="space-y-3 p-5 pb-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {pinned ? (
                            <Badge variant="mint" className="gap-1">
                                <Pin className="h-3 w-3" />
                                Pinned
                            </Badge>
                        ) : (
                            <Badge variant="secondary">Published</Badge>
                        )}
                        {expired && <Badge variant="destructive">Expired</Badge>}
                        {!announcement.is_active && (
                            <Badge variant="outline">Inactive</Badge>
                        )}
                    </div>

                    {canManage && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="-mr-1.5 -mt-1 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                                    aria-label={`Manage ${announcement.title}`}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                                    Manage announcement
                                </DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={route(
                                            'announcements.edit',
                                            announcement.id
                                        )}
                                        className="cursor-pointer text-xs"
                                    >
                                        <Pencil className="mr-2 h-3.5 w-3.5" />
                                        Edit announcement
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(announcement)}
                                    className="cursor-pointer text-xs text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Delete announcement
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <div className="space-y-1.5">
                    <CardTitle className="text-base font-semibold leading-snug tracking-tight text-foreground">
                        {canManage ? (
                            <Link
                                href={route(
                                    'announcements.edit',
                                    announcement.id
                                )}
                                className="transition-colors hover:text-primary"
                            >
                                {announcement.title}
                            </Link>
                        ) : (
                            announcement.title
                        )}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {announcement.content}
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent className="mt-auto p-5 pt-0">
                <Separator className="mb-4 bg-border/70" />
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
                                {initialsFor(creatorName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-foreground">
                                {creatorName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                Published {formatDate(announcement.published_at)}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        <span>
                            {announcement.expires_at
                                ? `${expired ? 'Expired' : 'Expires'} ${formatDate(
                                      announcement.expires_at
                                  )}`
                                : 'No expiry'}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AnnouncementsIndex({ announcements, filters }: Props) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const canManage = isHRAdmin(user);

    const [search, setSearch] = useState(filters.search ?? '');
    const [pendingDelete, setPendingDelete] = useState<Announcement | null>(
        null
    );
    const [isDeleting, setIsDeleting] = useState(false);

    const pinned = useMemo(
        () => announcements.data.filter((announcement) => announcement.is_pinned),
        [announcements.data]
    );

    const regular = useMemo(
        () =>
            announcements.data.filter((announcement) => !announcement.is_pinned),
        [announcements.data]
    );

    const hasResults = announcements.data.length > 0;
    const hasQuery = search.trim().length > 0;

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();

        router.get(
            route('announcements.index'),
            hasQuery ? { search: search.trim() } : {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const clearSearch = () => {
        setSearch('');

        router.get(route('announcements.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const confirmDelete = () => {
        if (!pendingDelete) {
            return;
        }

        const target = pendingDelete;
        setIsDeleting(true);

        router.delete(route('announcements.destroy', target.id), {
            preserveScroll: true,
            onSuccess: () => {
                setPendingDelete(null);
                toast.success(`Announcement "${target.title}" deleted.`);
            },
            onError: () => {
                toast.error('Could not delete this announcement.');
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AuthenticatedLayout
            title="Announcements"
            subtitle="Official company-wide announcements from Human Resources."
        >
            <Head title="Announcements - Elhadar Engineering HRMS" />

            <p className="mb-5 text-sm text-muted-foreground">
                Official company-wide updates from Human Resources.
            </p>

            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <form
                    onSubmit={submitSearch}
                    className="flex w-full max-w-xl items-center gap-2"
                >
                    <div className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label="Search announcements"
                            placeholder="Search announcements..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="h-10 border-border bg-card pl-9 pr-9 text-sm shadow-none"
                        />
                        {search.length > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={clearSearch}
                                aria-label="Clear search"
                                className="absolute right-1 top-1 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                    <Button
                        type="submit"
                        variant="outline"
                        className="h-10 shrink-0 px-4 shadow-none"
                    >
                        Search
                    </Button>
                </form>

                <div className="flex items-center gap-2 self-end lg:self-auto">
                    <Badge
                        variant="secondary"
                        className="h-7 px-2.5 text-xs font-medium"
                    >
                        {announcements.total}{' '}
                        {announcements.total === 1
                            ? 'announcement'
                            : 'announcements'}
                    </Badge>

                    {canManage && (
                        <Button asChild className="h-9 px-4 shadow-none">
                            <Link href={route('announcements.create')}>
                                <Plus className="h-4 w-4" />
                                New announcement
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {hasResults ? (
                <div className="space-y-8">
                    {pinned.length > 0 && (
                        <section aria-labelledby="pinned-announcements">
                            <div className="mb-3 flex items-center gap-2">
                                <Pin className="h-4 w-4 text-primary" />
                                <h2
                                    id="pinned-announcements"
                                    className="text-sm font-semibold tracking-tight text-foreground"
                                >
                                    Pinned announcements
                                </h2>
                                <Badge variant="mint" className="ml-1">
                                    {pinned.length}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                {pinned.map((announcement) => (
                                    <AnnouncementCard
                                        key={announcement.id}
                                        announcement={announcement}
                                        canManage={canManage}
                                        pinned
                                        onDelete={setPendingDelete}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {(regular.length > 0 || pinned.length === 0) && (
                        <section aria-labelledby="all-announcements">
                            <div className="mb-3 flex items-center gap-2">
                                <Megaphone className="h-4 w-4 text-muted-foreground" />
                                <h2
                                    id="all-announcements"
                                    className="text-sm font-semibold tracking-tight text-foreground"
                                >
                                    {pinned.length > 0
                                        ? 'All announcements'
                                        : 'Announcements'}
                                </h2>
                                <Badge
                                    variant="secondary"
                                    className="ml-1 font-mono text-[11px]"
                                >
                                    {regular.length}
                                </Badge>
                            </div>

                            {regular.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    {regular.map((announcement) => (
                                        <AnnouncementCard
                                            key={announcement.id}
                                            announcement={announcement}
                                            canManage={canManage}
                                            onDelete={setPendingDelete}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Card className="border-dashed border-border bg-muted/20 shadow-none">
                                    <Empty className="py-10">
                                        <EmptyHeader>
                                            <EmptyMedia
                                                variant="icon"
                                                className="bg-primary/10 text-primary"
                                            >
                                                <Megaphone className="h-5 w-5" />
                                            </EmptyMedia>
                                            <EmptyTitle className="text-sm font-semibold">
                                                No other announcements
                                            </EmptyTitle>
                                            <EmptyDescription className="text-xs">
                                                Pinned notices are the only
                                                active announcements right now.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                </Card>
                            )}
                        </section>
                    )}
                </div>
            ) : (
                <Card className="border-dashed border-border bg-muted/20 shadow-none">
                    <Empty className="py-14">
                        <EmptyHeader>
                            <EmptyMedia
                                variant="icon"
                                className="bg-primary/10 text-primary"
                            >
                                <Megaphone className="h-5 w-5" />
                            </EmptyMedia>
                            <EmptyTitle className="text-base font-semibold tracking-tight">
                                {hasQuery
                                    ? 'No announcements match your search'
                                    : 'No announcements yet'}
                            </EmptyTitle>
                            <EmptyDescription className="text-sm">
                                {hasQuery
                                    ? `Nothing matched "${search.trim()}". Try a different keyword or clear the search.`
                                    : 'Company-wide updates from Human Resources will appear here once published.'}
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            {hasQuery ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={clearSearch}
                                    className="shadow-none"
                                >
                                    <X className="h-4 w-4" />
                                    Clear search
                                </Button>
                            ) : (
                                canManage && (
                                    <Button
                                        asChild
                                        className="shadow-none"
                                    >
                                        <Link
                                            href={route(
                                                'announcements.create'
                                            )}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Create the first announcement
                                        </Link>
                                    </Button>
                                )
                            )}
                        </EmptyContent>
                    </Empty>
                </Card>
            )}

            {announcements.last_page > 1 && (
                <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-border/70 pt-4 sm:flex-row">
                    <p className="text-xs text-muted-foreground">
                        Showing{' '}
                        <span className="font-medium text-foreground">
                            {announcements.from || 0}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium text-foreground">
                            {announcements.to || 0}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium text-foreground">
                            {announcements.total}
                        </span>
                    </p>

                    <Pagination className="mx-0 w-auto justify-end">
                        <PaginationContent className="flex-wrap">
                            {announcements.links.map((link, index) => {
                                if (link.label === '...') {
                                    return (
                                        <PaginationItem key={index}>
                                            <PaginationEllipsis className="h-8 w-8" />
                                        </PaginationItem>
                                    );
                                }

                                const isPrevious =
                                    link.label.includes('Previous') ||
                                    link.label.includes('&laquo;');
                                const isNext =
                                    link.label.includes('Next') ||
                                    link.label.includes('&raquo;');
                                const label = isPrevious
                                    ? 'Prev'
                                    : isNext
                                      ? 'Next'
                                      : link.label;

                                return (
                                    <PaginationItem key={index}>
                                        <Button
                                            asChild
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            className={`h-8 min-w-8 px-2.5 text-xs shadow-none ${
                                                link.url
                                                    ? ''
                                                    : 'pointer-events-none opacity-40'
                                            }`}
                                        >
                                            <Link
                                                href={link.url || '#'}
                                                preserveState
                                                preserveScroll
                                            >
                                                {isPrevious && (
                                                    <ChevronLeft className="h-3.5 w-3.5" />
                                                )}
                                                {label}
                                                {isNext && (
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                )}
                                            </Link>
                                        </Button>
                                    </PaginationItem>
                                );
                            })}
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            <AlertDialog
                open={Boolean(pendingDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDelete(null);
                    }
                }}
            >
                <AlertDialogContent className="border-border bg-card shadow-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="tracking-tight">
                            Delete this announcement?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm leading-relaxed">
                            &ldquo;{pendingDelete?.title}&rdquo; will be
                            permanently removed for all employees. This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isDeleting}
                            onClick={(event) => {
                                event.preventDefault();
                                confirmDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting…' : 'Delete announcement'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthenticatedLayout>
    );
}
