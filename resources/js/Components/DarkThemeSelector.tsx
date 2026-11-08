import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Check, Sparkles, X, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';

export type DarkToneId = 'material' | 'obsidian' | 'charcoal' | 'titanium' | 'velvet';

export interface DarkToneConfig {
    id: DarkToneId;
    name: string;
    subtitle: string;
    bgHex: string;
    cardHex: string;
    borderHex: string;
    accentHex: string;
    description: string;
}

export const DARK_TONES: DarkToneConfig[] = [
    {
        id: 'material',
        name: 'Material Dark',
        subtitle: '#121212 • Soft Charcoal (Grok Pick)',
        bgHex: '#121212',
        cardHex: '#1e1e24',
        borderHex: '#2e2e38',
        accentHex: '#3b82f6',
        description: 'Softest pure dark tone. Eliminates harsh contrast and prevents eye fatigue.',
    },
    {
        id: 'obsidian',
        name: 'Obsidian Blue',
        subtitle: '#0D1117 • GitHub Midnight Slate',
        bgHex: '#0d1117',
        cardHex: '#1c2128',
        borderHex: '#30363d',
        accentHex: '#58a6ff',
        description: 'Modern cool blue-gray undertone. Highly readable and professional for data tables.',
    },
    {
        id: 'charcoal',
        name: 'Warm Charcoal',
        subtitle: '#161618 • Apple macOS Sequoia',
        bgHex: '#161618',
        cardHex: '#212125',
        borderHex: '#333338',
        accentHex: '#2997ff',
        description: 'True macOS dark mode with warm graphite undertone. Extremely gentle on the eyes.',
    },
    {
        id: 'titanium',
        name: 'Deep Titanium',
        subtitle: '#18181B • Linear & Raycast Zinc',
        bgHex: '#18181b',
        cardHex: '#27272a',
        borderHex: '#3f3f46',
        accentHex: '#60a5fa',
        description: 'Sleek neutral zinc-800/900 palette. High-end modern developer tool aesthetic.',
    },
    {
        id: 'velvet',
        name: 'Soft Velvet Ash',
        subtitle: '#1A1B1E • Warm Low-Glare Comfort',
        bgHex: '#1a1b1e',
        cardHex: '#282930',
        borderHex: '#3c3d47',
        accentHex: '#818cf8',
        description: 'Deep warm espresso undertone with reduced contrast. Designed for long late-night sessions.',
    },
];

export default function DarkThemeSelector() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [currentTone, setCurrentTone] = useState<DarkToneId>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('hrms_dark_tone') as DarkToneId) || 'titanium';
        }
        return 'titanium';
    });
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Apply tone on initial mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = (localStorage.getItem('hrms_dark_tone') as DarkToneId) || 'titanium';
            setCurrentTone(saved);
            document.documentElement.setAttribute('data-dark-tone', saved);
        }
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectTone = (toneId: DarkToneId) => {
        setCurrentTone(toneId);
        if (typeof window !== 'undefined') {
            localStorage.setItem('hrms_dark_tone', toneId);
            document.documentElement.setAttribute('data-dark-tone', toneId);
        }
        // If in light mode, switch to dark so user sees the new tone
        if (resolvedTheme !== 'dark') {
            setTheme('dark');
        }
    };

    const activeTone = DARK_TONES.find((t) => t.id === currentTone) || DARK_TONES.find((t) => t.id === 'titanium') || DARK_TONES[0];

    return (
        <div ref={containerRef} className="fixed bottom-6 right-6 z-50 select-none">
            {/* The Trigger Floating Pill Button */}
            <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsOpen(!isOpen)}
                className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur-2xl border border-black/10 dark:border-border shadow-[0_12px_36px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all cursor-pointer"
            >
                {/* Tone Color Swatch Orb */}
                <div
                    className="w-4.5 h-4.5 rounded-full border border-white/30 shadow-xs shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: activeTone.bgHex }}
                >
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: activeTone.accentHex }}
                    />
                </div>

                <div className="flex flex-col text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 leading-none">
                        Dark Tone
                    </span>
                    <span className="text-xs font-semibold text-foreground tracking-tight leading-snug">
                        {activeTone.name}
                    </span>
                </div>

                <Moon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors ml-0.5" />
            </motion.button>

            {/* The Floating Popover Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute bottom-full right-0 mb-3 w-88 sm:w-96 bg-white/95 dark:bg-card/95 backdrop-blur-3xl border border-black/10 dark:border-border shadow-[0_24px_60px_rgba(0,0,0,0.25)] rounded-3xl p-4 z-50"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between pb-3 mb-3 border-b border-border/60">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-primary" />
                                    <h3 className="text-sm font-bold text-foreground tracking-tight">
                                        Dark Theme Color Tones
                                    </h3>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Replace pitch-black with comfortable, eye-friendly shades
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 5 Dark Tone Options */}
                        <div className="space-y-2">
                            {DARK_TONES.map((tone) => {
                                const isSelected = tone.id === currentTone;

                                return (
                                    <button
                                        key={tone.id}
                                        type="button"
                                        onClick={() => handleSelectTone(tone.id)}
                                        className={`w-full flex items-start gap-3 p-2.5 rounded-2xl text-left transition-all ${
                                            isSelected
                                                ? 'bg-primary/10 border-2 border-primary'
                                                : 'border border-border/50 hover:bg-black/5 dark:hover:bg-white/5 hover:border-border'
                                        }`}
                                    >
                                        {/* Multi-layered Palette Preview Swatch */}
                                        <div
                                            className="w-10 h-10 rounded-xl p-1 shrink-0 border border-border/80 shadow-xs flex flex-col justify-between"
                                            style={{ backgroundColor: tone.bgHex }}
                                        >
                                            <div
                                                className="w-full h-3.5 rounded-md flex items-center justify-between px-1"
                                                style={{ backgroundColor: tone.cardHex }}
                                            >
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{ backgroundColor: tone.accentHex }}
                                                />
                                            </div>
                                            <div
                                                className="w-3/4 h-1.5 rounded-full"
                                                style={{ backgroundColor: tone.borderHex }}
                                            />
                                        </div>

                                        {/* Tone Meta */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-foreground tracking-tight">
                                                    {tone.name}
                                                </span>
                                                {isSelected && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                                                        <Check className="w-3 h-3 stroke-[3]" /> Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-mono font-medium text-muted-foreground mt-0.5">
                                                {tone.subtitle}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                                                {tone.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>💡 Automatically applies whenever Dark mode is active</span>
                            {resolvedTheme !== 'dark' && (
                                <button
                                    type="button"
                                    onClick={() => setTheme('dark')}
                                    className="font-semibold text-primary hover:underline"
                                >
                                    Enable Dark Mode
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
