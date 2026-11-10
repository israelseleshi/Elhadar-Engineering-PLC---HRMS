import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<'reverb'> | Echo<'pusher'> | undefined;
    }
}

window.Pusher = Pusher;

export function getEchoInstance(): Echo<'reverb'> | Echo<'pusher'> | null {
    if (typeof window === 'undefined') {
        return null;
    }

    if (window.Echo) {
        return window.Echo;
    }

    const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
    const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;

    if (reverbKey) {
        window.Echo = new Echo({
            broadcaster: 'reverb',
            key: reverbKey,
            wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
            wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
            wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
            forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
            enabledTransports: ['ws', 'wss'],
        });
        return window.Echo;
    }

    if (pusherKey) {
        window.Echo = new Echo({
            broadcaster: 'pusher',
            key: pusherKey,
            cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
            forceTLS: true,
        });
        return window.Echo;
    }

    return null;
}

export default getEchoInstance;
