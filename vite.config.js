import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './resources/js'),
            '@/boardui': path.resolve(import.meta.dirname, './resources/js/Components/boardui'),
            'next/link': path.resolve(import.meta.dirname, './resources/js/Components/boardui/shims/next-link.tsx'),
            'next/image': path.resolve(import.meta.dirname, './resources/js/Components/boardui/shims/next-image.tsx'),
            'next/navigation': path.resolve(import.meta.dirname, './resources/js/Components/boardui/shims/next-navigation.ts'),
        },
    },
});
