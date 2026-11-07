import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
    Send,
} from 'lucide-react';

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

export default function AnnouncementsCreate() {
    const [publishNow, setPublishNow] = useState(true);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        title: '',
        content: '',
        is_pinned: false,
        is_active: true,
        published_at: today(),
        expires_at: '',
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

        post(route('announcements.store'), {
            preserveScroll: true,
            onError: () => {
                toast.error(
                    'Please review the highlighted fields before publishing.'
                );
            },
        });
    };

    return (
        <AuthenticatedLayout
            title="New announcement"
            subtitle="Create a company-wide announcement for all employees."
        >
            <Head title="New Announcement - Elhadar Engineering HRMS" />

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

                <p className="text-xs text-muted-foreground">
                    Visible to every employee once published.
                </p>
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
                                Write a clear headline and the full message
                                employees should receive.
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
                                Choose when the announcement goes live and
                                whether it should expire automatically.
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
                                        Employees see the announcement as soon
                                        as it is saved.
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
                                Ready to publish?
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Review the content and visibility settings, then
                                publish to the company feed.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-2 p-5 pt-0">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full shadow-none"
                            >
                                <Send className="h-4 w-4" />
                                {processing
                                    ? 'Publishing…'
                                    : 'Publish announcement'}
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
                </aside>
            </form>
        </AuthenticatedLayout>
    );
}
