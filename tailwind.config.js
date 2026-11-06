import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
    './storage/framework/views/*.php',
    './resources/views/**/*.blade.php',
    './resources/js/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: ['"Inter Tight"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Inter Tight"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        /* Apple-inspired semantic aliases (Inter Tight preserved app-wide) */
        apple: {
          blue: '#0066cc',
          focus: '#0071e3',
          sky: '#2997ff',
          ink: '#1d1d1f',
          muted: '#6e6e73',
          hairline: '#d2d2d7',
          parchment: '#f5f5f7',
          canvas: '#ffffff',
        },
        /* Back-compat aliases mapped to Apple neutrals/blue */
        spruce: { DEFAULT: '#0066cc', deep: '#0071e3', forest: '#1d1d1f' },
        mint: { 50: '#f5f5f7', 100: '#f5f5f7', 200: '#e8e8ed' },
        lime: { hero: '#0066cc', panel: '#f5f5f7', accent: '#e8e8ed', ribbon: '#2997ff' },
        hairline: { DEFAULT: '#d2d2d7', strong: '#b0b0b5' },
        ink: '#1d1d1f',
        bodyText: '#1d1d1f',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        xs: '6px',
        sm: '8px',
        md: '11px',
        lg: '14px',
        xl: '18px',
        xxl: '22px',
        xxxl: '28px',
      },
      boxShadow: {
        apple: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        'apple-sm': '0 1px 2px rgba(0,0,0,0.06)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [forms, tailwindcssAnimate],
};
