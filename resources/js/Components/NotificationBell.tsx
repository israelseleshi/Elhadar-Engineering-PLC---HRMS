import { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/Components/ui/popover';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { toast } from 'sonner';
import AnnouncementReaderModal, { AnnouncementItem } from './AnnouncementReaderModal';
import {
    Bell,
    Check,
    CheckCheck,
    AlertTriangle,
    Shield,
    FileText,
    Pin,
    ExternalLink,
    ChevronRight,
    Megaphone,
    Volume2,
} from 'lucide-react';

// Helper to trigger native OS desktop notifications via Service Worker or Web Notification API
const triggerDesktopNotification = async (title: string, body: string, url: string = '/announcements') => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
                await reg.showNotification(title, {
                    body,
                    icon: '/elhadar_logo.png',
                    badge: '/elhadar_logo.png',
                    data: { url },
                });
                return;
            }
        }
    } catch {
        // Fallback to standard Notification API
    }

    try {
        new Notification(title, {
            body,
            icon: '/elhadar_logo.png',
        });
    } catch {
        // Ignored
    }
};

const getToastedIds = (): Set<number> => {
    try {
        const stored = localStorage.getItem('elhadar_toasted_announcements');
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
        return new Set();
    }
};

const markAsToasted = (ids: number[]) => {
    try {
        const current = getToastedIds();
        ids.forEach((id) => current.add(id));
        const arr = Array.from(current).slice(-100);
        localStorage.setItem('elhadar_toasted_announcements', JSON.stringify(arr));
    } catch {
        // Ignored
    }
};

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [notifications, setNotifications] = useState<AnnouncementItem[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
    const [isReaderOpen, setIsReaderOpen] = useState(false);
    const isInitialMountRef = useRef(true);

    const fetchFeed = async () => {
        try {
            const res = await axios.get('/notifications/feed');
            const data = res.data;
            const newCount: number = data.unread_count || 0;
            const items: AnnouncementItem[] = data.notifications || [];

            const toastedIds = getToastedIds();
            const unreadItems = items.filter((it) => !it.is_read);

            // Pop toast for any unread announcement not yet toasted in this browser
            const untoaastedUnread = unreadItems.filter((it) => !toastedIds.has(it.id));

            if (untoaastedUnread.length > 0) {
                const topItem = untoaastedUnread[0];

                toast.info(`New Announcement: ${topItem.title}`, {
                    description:
                        topItem.priority === 'critical'
                            ? '⚠️ Critical company directive'
                            : topItem.content.slice(0, 100) + '...',
                    action: {
                        label: 'Read',
                        onClick: () => {
                            handleOpenReader(topItem);
                        },
                    },
                });

                triggerDesktopNotification(
                    `El-Hadar HRMS: ${topItem.title}`,
                    topItem.content.slice(0, 120) + '...',
                    `/announcements/${topItem.id}`
                );

                markAsToasted(untoaastedUnread.map((n) => n.id));
            }

            setUnreadCount(newCount);
            setNotifications(items);
            isInitialMountRef.current = false;
        } catch {
            // Silently fail background poll
        }
    };

    useEffect(() => {
        // Register Service Worker for background desktop popups
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }

        fetchFeed();

        // Responsive polling every 10 seconds for real-time updates across browsers
        const timer = setInterval(fetchFeed, 10000);

        // Instantly poll whenever employee focuses or switches to this tab
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchFeed();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await axios.post('/notifications/mark-all-read');
            setUnreadCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            toast.success('All announcements marked as read.');
        } catch {
            toast.error('Could not mark all as read.');
        }
    };

    const handleTestNotification = async () => {
        toast.info('Test Alert: Real-time notification system is active!', {
            description: 'You will receive on-screen alerts whenever new engineering directives are published.',
        });

        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                triggerDesktopNotification(
                    'El-Hadar Engineering HRMS',
                    'Desktop notifications are active and verified on this browser.'
                );
            } else if (Notification.permission === 'default') {
                const res = await Notification.requestPermission();
                if (res === 'granted') {
                    triggerDesktopNotification(
                        'El-Hadar Engineering HRMS',
                        'Desktop notifications enabled successfully!'
                    );
                }
            } else {
                toast.warning('Browser notification permission is blocked in your browser settings.');
            }
        }
    };

    const handleOpenReader = async (item: AnnouncementItem) => {
        setSelectedAnnouncement(item);
        setIsReaderOpen(true);
        setOpen(false);

        if (!item.is_read) {
            setUnreadCount((c) => Math.max(0, c - 1));
            setNotifications((prev) =>
                prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
            );
            try {
                await axios.post(`/notifications/${item.id}/read`);
            } catch {
                // Silently ignore
            }
        }
    };

    const handleAcknowledged = (id: number) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_acknowledged: true, is_read: true } : n))
        );
        if (selectedAnnouncement && selectedAnnouncement.id === id) {
            setSelectedAnnouncement((prev) => (prev ? { ...prev, is_acknowledged: true, is_read: true } : null));
        }
    };

    const formatRelativeTime = (isoString: string) => {
        const d = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const filteredNotifications =
        activeTab === 'unread'
            ? notifications.filter((n) => !n.is_read)
            : notifications;

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="View notifications & announcements"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold leading-none shadow-xs animate-in zoom-in-50">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    align="end"
                    sideOffset={8}
                    className="w-[360px] sm:w-[420px] p-0 rounded-2xl border border-black/[0.08] dark:border-white/[0.12] bg-white/95 dark:bg-[#1d1d1f]/95 backdrop-blur-2xl shadow-[0_16px_44px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                    {/* Popover Header */}
                    <div className="p-4 pb-3 border-b border-border/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
                                Company Notices
                            </h3>
                            {unreadCount > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-semibold bg-primary/10 text-primary">
                                    {unreadCount} new
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handleTestNotification}
                                title="Test browser alert sound & toast"
                                className="text-[11px] text-muted-foreground hover:text-foreground p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors flex items-center gap-1"
                            >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Test</span>
                            </button>

                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleMarkAllRead}
                                    className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-primary/5 transition-colors"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    <span>Mark all read</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="px-4 py-2 bg-muted/30 border-b border-border/40 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all ${
                                activeTab === 'all'
                                    ? 'bg-background text-foreground shadow-xs font-semibold'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('unread')}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all ${
                                activeTab === 'unread'
                                    ? 'bg-background text-foreground shadow-xs font-semibold'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40 custom-scrollbar">
                        {filteredNotifications.length === 0 ? (
                            <div className="py-12 px-4 text-center">
                                <Megaphone className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                                <p className="text-xs font-medium text-foreground">No circulars to display</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {activeTab === 'unread'
                                        ? 'You have caught up with all engineering directives.'
                                        : 'No announcements have been published yet.'}
                                </p>
                            </div>
                        ) : (
                            filteredNotifications.map((item) => {
                                const isCritical = item.priority === 'critical';
                                const isImportant = item.priority === 'important';

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleOpenReader(item)}
                                        className={`p-3.5 hover:bg-accent/60 transition-colors cursor-pointer flex items-start gap-3 text-left ${
                                            !item.is_read ? 'bg-primary/[0.04]' : ''
                                        }`}
                                    >
                                        <div className="shrink-0 mt-0.5">
                                            {isCritical ? (
                                                <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
                                                    <AlertTriangle className="w-4 h-4" />
                                                </div>
                                            ) : isImportant ? (
                                                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                                    <Bell className="w-4 h-4" />
                                                </div>
                                            ) : item.is_pinned ? (
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                                    <Pin className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <div className="w-7 h-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className={`text-xs truncate ${!item.is_read ? 'font-bold text-[#1d1d1f] dark:text-[#f5f5f7]' : 'font-medium text-foreground/80'}`}>
                                                    {item.title}
                                                </h4>
                                                <span className="text-[10px] text-muted-foreground shrink-0">
                                                    {formatRelativeTime(item.published_at || item.created_at)}
                                                </span>
                                            </div>

                                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                                                {item.content}
                                            </p>

                                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
                                                    {item.category}
                                                </span>

                                                {item.requires_acknowledgment && (
                                                    <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                                                        item.is_acknowledged ? 'text-emerald-600' : 'text-primary font-bold'
                                                    }`}>
                                                        <Shield className="w-2.5 h-2.5" />
                                                        {item.is_acknowledged ? 'Acknowledged' : 'Sign-off required'}
                                                    </span>
                                                )}

                                                {item.attachment_url && (
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                        <FileText className="w-2.5 h-2.5" /> PDF
                                                    </span>
                                                )}

                                                {!item.is_read && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 ml-auto" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Popover Footer */}
                    <div className="p-2.5 px-4 bg-muted/40 border-t border-border/40 flex items-center justify-between text-xs">
                        <Link
                            href={route('announcements.index')}
                            onClick={() => setOpen(false)}
                            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                        >
                            <span>Browse All Company Circulars</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </PopoverContent>
            </Popover>

            <AnnouncementReaderModal
                announcement={selectedAnnouncement}
                isOpen={isReaderOpen}
                onClose={() => setIsReaderOpen(false)}
                onAcknowledged={handleAcknowledged}
            />
        </>
    );
}
