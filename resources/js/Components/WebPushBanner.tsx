import { useEffect, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Bell, X, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export default function WebPushBanner() {
    const [visible, setVisible] = useState(false);
    const [requesting, setRequesting] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return;
        }

        const dismissedAt = localStorage.getItem('elhadar_push_dismissed_at');
        if (dismissedAt) {
            const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
            if (daysSince < 7) {
                return;
            }
        }

        if (Notification.permission === 'default') {
            // Show prompt after a gentle 3-second delay so page settles
            const timer = setTimeout(() => setVisible(true), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleEnable = async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        setRequesting(true);

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                setVisible(false);
                toast.success('Desktop notifications enabled!', {
                    description: 'You will receive pop-up alerts for urgent company circulars.',
                });

                // Trigger sample welcome notification
                new Notification('El-Hadar Engineering HRMS', {
                    body: 'Desktop notifications are active. You will receive circulars directly on your screen.',
                    icon: '/elhadar_logo.png',
                });

                // Register subscription placeholder on backend
                try {
                    await axios.post('/notifications/push-subscribe', {
                        endpoint: 'browser_native_notification_api',
                        public_key: null,
                        auth_token: null,
                    });
                } catch {
                    // Ignore background sync error
                }
            } else {
                setVisible(false);
                toast.info('Notification permission was not granted.');
            }
        } catch {
            toast.error('Could not request notification permission.');
        } finally {
            setRequesting(false);
        }
    };

    const handleDismiss = () => {
        setVisible(false);
        localStorage.setItem('elhadar_push_dismissed_at', Date.now().toString());
    };

    if (!visible) return null;

    return (
        <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-primary/[0.08] via-primary/[0.04] to-background border border-primary/20 shadow-sm flex items-center justify-between gap-3 animate-in fade-in-50 slide-in-from-top-2">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
                    <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
                        Enable Desktop Notifications
                    </h4>
                    <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                        Get instant on-screen alerts for official engineering directives, public holidays, and HR circulars.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <Button
                    size="sm"
                    onClick={handleEnable}
                    disabled={requesting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl h-8 px-3 shadow-xs"
                >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    <span>{requesting ? 'Enabling...' : 'Enable Alerts'}</span>
                </Button>
                <button
                    onClick={handleDismiss}
                    aria-label="Dismiss banner"
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
