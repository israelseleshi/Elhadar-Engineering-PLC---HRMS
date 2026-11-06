import { useEffect, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'table' | 'grid';

const STORAGE_PREFIX = 'hrms:view-mode:';

interface ViewToggleProps {
    value: ViewMode;
    onChange: (mode: ViewMode) => void;
    className?: string;
}

const options: { mode: ViewMode; label: string; Icon: typeof List }[] = [
    { mode: 'table', label: 'Table view', Icon: List },
    { mode: 'grid', label: 'Grid view', Icon: LayoutGrid },
];

/**
 * Segmented control for switching a record list between table and card grid.
 * Styled to match the shadcn control set used across the HRMS.
 */
export default function ViewToggle({ value, onChange, className }: ViewToggleProps) {
    return (
        <div
            role="group"
            aria-label="Switch between table and grid view"
            className={cn(
                'inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5',
                className
            )}
        >
            {options.map(({ mode, label, Icon }) => {
                const isActive = value === mode;

                return (
                    <button
                        key={mode}
                        type="button"
                        aria-label={label}
                        aria-pressed={isActive}
                        title={label}
                        onClick={() => onChange(mode)}
                        className={cn(
                            'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
                            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                            isActive
                                ? 'bg-card text-foreground shadow-xs border border-border'
                                : 'border border-transparent text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{mode === 'grid' ? 'Grid' : 'Table'}</span>
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Persists the preferred view mode per page in localStorage.
 */
export function useViewMode(storageKey: string, fallback: ViewMode = 'table') {
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        if (typeof window === 'undefined') {
            return fallback;
        }

        const stored = window.localStorage.getItem(STORAGE_PREFIX + storageKey);

        return stored === 'grid' || stored === 'table' ? stored : fallback;
    });

    useEffect(() => {
        window.localStorage.setItem(STORAGE_PREFIX + storageKey, viewMode);
    }, [storageKey, viewMode]);

    return [viewMode, setViewMode] as const;
}

