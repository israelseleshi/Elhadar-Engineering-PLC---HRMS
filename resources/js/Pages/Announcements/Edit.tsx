import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { DatePicker } from '@/Components/ui/date-picker';
import { Switch } from '@/Components/ui/switch';
import { Textarea } from '@/Components/ui/textarea';
import { toast } from 'sonner';
import {
    ArrowLeft,
    CalendarClock,
    Eye,
    Megaphone,
    Pin,
    Save,
    Trash2,
} from 'lucide-react';

interface Announcement {
    id: number;
    title: string;
    content: string;
    is_pinned: boolean;
    is_active: boolean;
    published_at: string | null;
    expires_at: string | null;
}

interface Props {
    announcement: Announcement;
}

interface FormData {
    title: string;
    content: string;
    is_pinned: boolean;
    is_active: boolean;
    published_at: string;
    expires_at: string;
}

const today = (): string => new Date().toISOString().split('T')[0];

const inThirtyDays = (): string =>
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

export default function AnnouncementsEdit({ announcement }: Props) {
    const isScheduled = announcement.published_at
        ? new Date(announcement.published_at) > new Date()
        : false;

    const [publishNow, setPublishNow] = useState(!isScheduled);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, put, processing, errors } = useForm<FormData>({
        title: announcement.title,
        content: announcement.content,
        is_pinned: announcement.is_pinned,
        is_active: announcement.is_active,
        published_at: announcement.published_at
            ? announcement.published_at.split('T')[0]
            : today(),
        expires_at: announcement.expires_at
            ? announcement.expires_at.split('T')[0]
            : '',
    });

    const hasExpiry = Boolean(data.expires_at);
    const contentLength = data.content.length;

    const handlePublishNowChange = (checked: boolean) => {
        setPublishNow(checked);

        if (checked) {
            setData('published_at', today());
        }
    };

    const handleExpiryChange = (checked: boolean) => {
        setData('expires_at', checked ? inThirtyDays() : '');
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        put(route('announcements.update', announcement.id), {
            preserveScroll: true,
            onError: () => {
                toast.error(
                    'Please review the highlighted fields before saving.'
                );
            },
        });
    };

    const confirmDelete = () => {
        setIsDeleting(true);

        router.delete(route('announcements.destroy', announcement.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                toast.success('Announcement deleted.');
            },
            onError: () => {
                toast.error('Could not delete this announcement.');
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AuthenticatedLayout
            title="Edit announcement"
            subtitle={`Modify "${announcement.title}".`}
        >
            <Head title="Edit Announcement - Elhadar Engineering HRMS" />

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="-ml-2 gap-1.5 text-muted-foreground shadow-none hover:text-foreground"
                >
                    <Link href={route('announcements.index')}>
                        <ArrowLeft className="h-4 w-4" />
                        Back to announcements
                    </Link>
                </Button>

                <Badge
                    variant={
                        !announcement.is_active
                            ? 'outline'
                            : isScheduled
                              ? 'secondary'
                              : 'mint'
                    }
                >
                    {!announcement.is_active
                        ? 'Inactive'
                        : isScheduled
                          ? 'Scheduled'
                          : 'Published'}
                </Badge>
            </div>

            <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3"
            >
                <div className="space-y-5 lg:col-span-2">
                    <Card className="shadow-none">
                        <CardHeader className="border-b border-border/70 p-5">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
                                <Megaphone className="h-4 w-4 text-primary" />
                                Announcement content
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Changes become visible to employees immediately
                                after saving.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5 p-5">
                            <div className="space-y-2">
                                <Label htmlFor="title">
                                    Title{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. New office policy effective next month"
                                    value={data.title}
                                    onChange={(event) =>
                                        setData('title', event.target.value)
                                    }
                                    aria-invalid={Boolean(errors.title)}
                                    className="h-10 border-border bg-card shadow-none"
                                />
                                {errors.title && (
                                    <p className="text-xs font-medium text-destructive">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content">
                                    Message{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="content"
                                    rows={12}
                                    placeholder="Write the announcement employees should read..."
                                    value={data.content}
                                    onChange={(event) =>
                                        setData('content', event.target.value)
                                    }
                                    aria-invalid={Boolean(errors.content)}
                                    className="min-h-[240px] resize-y border-border bg-card text-sm leading-relaxed shadow-none"
                                />
                                <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                                    <span>
                                        Plain text. Line breaks are preserved.
                                    </span>
                                    <span
                                        className={
                                            contentLength > 10000
                                                ? 'font-mono font-medium text-destructive'
                                                : 'font-mono'
                                        }
                                    >
                                        {contentLength.toLocaleString()} /
                                        10,000
                                    </span>
                                </div>
                                {errors.content && (
                                    <p className="text-xs font-medium text-destructive">
                                        {errors.content}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-none">
                        <CardHeader className="border-b border-border/70 p-5">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
                                <CalendarClock className="h-4 w-4 text-primary" />
                                Publishing window
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Control when this announcement is visible and
                                when it should stop appearing.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-0.5">
                                    <Label
                                        htmlFor="publish_now"
                                        className="text-sm font-medium"
                                    >
                                        Publish immediately
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Turn this off to schedule a future
                                        publish date.
                                    </p>
                                </div>
                                <Switch
                                    id="publish_now"
                                    checked={publishNow}
                                    onCheckedChange={handlePublishNowChange}
                                />
                            </div>

                            {!publishNow && (
                                <div className="space-y-2">
                                    <Label htmlFor="published_at">
                                        Publish date{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <DatePicker
                                        id="published_at"
                                        value={data.published_at}
                                        onChange={(value) =>
                                            setData('published_at', value)
                                        }
                                        ariaInvalid={Boolean(
                                            errors.published_at
                                        )}
                                        className="h-10 border-border bg-card shadow-none"
                                    />
                                    {errors.published_at && (
                                        <p className="text-xs font-medium text-destructive">
                                            {errors.published_at}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-0.5">
                                    <Label
                                        htmlFor="has_expiry"
                                        className="text-sm font-medium"
                                    >
                                        Set an expiry date
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Expired announcements stop appearing in
                                        the employee feed.
                                    </p>
                                </div>
                                <Switch
                                    id="has_expiry"
                                    checked={hasExpiry}
                                    onCheckedChange={handleExpiryChange}
                                />
                            </div>

                            {hasExpiry && (
                                <div className="space-y-2">
                                    <Label htmlFor="expires_at">
                                        Expiry date{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <DatePicker
                                        id="expires_at"
                                        value={data.expires_at}
                                        minDate={data.published_at}
                                        onChange={(value) =>
                                            setData('expires_at', value)
                                        }
                                        ariaInvalid={Boolean(errors.expires_at)}
                                        className="h-10 border-border bg-card shadow-none"
                                    />
                                    {errors.expires_at && (
                                        <p className="text-xs font-medium text-destructive">
                                            {errors.expires_at}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <aside className="space-y-5">
                    <Card className="shadow-none">
                        <CardHeader className="border-b border-border/70 p-5">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
                                <Eye className="h-4 w-4 text-primary" />
                                Visibility
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Control priority and whether the announcement
                                is live.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-0.5">
                                    <Label
                                        htmlFor="is_pinned"
                                        className="flex items-center gap-1.5 text-sm font-medium"
                                    >
                                        <Pin className="h-3.5 w-3.5" />
                                        Pin to top
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Pinned notices appear first in a
                                        highlighted section.
                                    </p>
                                </div>
                                <Switch
                                    id="is_pinned"
                                    checked={Boolean(data.is_pinned)}
                                    onCheckedChange={(checked) =>
                                        setData('is_pinned', checked)
                                    }
                                />
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-0.5">
                                    <Label
                                        htmlFor="is_active"
                                        className="text-sm font-medium"
                                    >
                                        Active
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Inactive announcements are retained
                                        for records but hidden from employees.
                                    </p>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={Boolean(data.is_active)}
                                    onCheckedChange={(checked) =>
                                        setData('is_active', checked)
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/20 bg-primary/[0.035] shadow-none">
                        <CardHeader className="p-5 pb-3">
                            <CardTitle className="text-sm font-semibold tracking-tight">
                                Save changes
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Updates are written to the audit trail and take
                                effect immediately.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-2 p-5 pt-0">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full shadow-none"
                            >
                                <Save className="h-4 w-4" />
                                {processing ? 'Saving…' : 'Save changes'}
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="w-full shadow-none"
                            >
                                <Link href={route('announcements.index')}>
                                    Cancel
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-destructive/20 bg-destructive/[0.035] shadow-none">
                        <CardHeader className="p-5 pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight text-destructive">
                                <Trash2 className="h-4 w-4" />
                                Danger zone
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Deleting permanently removes this announcement
                                for every employee.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeleteOpen(true)}
                                className="w-full border-destructive/30 text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete announcement
                            </Button>
                        </CardContent>
                    </Card>
                </aside>
            </form>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="border-border bg-card shadow-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="tracking-tight">
                            Delete this announcement?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm leading-relaxed">
                            &ldquo;{announcement.title}&rdquo; will be
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
