import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Migrate default theme from legacy 'dark' to 'light'
if (typeof window !== 'undefined') {
    if (!localStorage.getItem('hrms_theme_default_light_v1')) {
        localStorage.removeItem('theme');
        localStorage.setItem('theme', 'light');
        localStorage.setItem('hrms_theme_default_light_v1', 'true');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    }
    // Deep Titanium is locked in as the preferred dark theme tone
    localStorage.setItem('hrms_dark_tone', 'titanium');
    document.documentElement.setAttribute('data-dark-tone', 'titanium');
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
                <App {...props} />
            </ThemeProvider>
        );
    },
    progress: { color: '#0066cc' },
});
