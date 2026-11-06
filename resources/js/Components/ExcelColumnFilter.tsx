import React, { useState, useMemo, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { Checkbox } from '@/Components/ui/checkbox';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { 
    Filter, 
    ArrowUp, 
    ArrowDown, 
    Search, 
    X, 
    RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
    label: string;
    value: string;
    count?: number;
}

export interface ExcelColumnFilterProps {
    title: string;
    columnKey?: string;
    options?: FilterOption[];
    selectedValues?: string[];
    onApply?: (values: string[]) => void;
    onReset?: () => void;
    enableSort?: boolean;
    sortKey?: string;
    currentSortBy?: string;
    currentSortDir?: 'asc' | 'desc';
    onSort?: (sortKey: string, direction: 'asc' | 'desc') => void;
    align?: 'start' | 'center' | 'end';
    className?: string;
}

export default function ExcelColumnFilter({
    title,
    columnKey,
    options = [],
    selectedValues = [],
    onApply,
    onReset,
    enableSort = false,
    sortKey,
    currentSortBy,
    currentSortDir = 'asc',
    onSort,
    align = 'start',
    className,
}: ExcelColumnFilterProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [tempSelected, setTempSelected] = useState<string[]>(selectedValues);

    // Sync temporary state whenever popover is opened or external selectedValues change
    useEffect(() => {
        setTempSelected(selectedValues);
        if (!open) {
            setSearch('');
        }
    }, [selectedValues, open]);

    const isSortedThisColumn = Boolean(enableSort && sortKey && currentSortBy === sortKey);
    const isFiltered = Boolean(selectedValues && selectedValues.length > 0);

    // Filter options by internal search query
    const filteredOptions = useMemo(() => {
        if (!search.trim()) return options;
        const q = search.toLowerCase();
        return options.filter(
            (opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
        );
    }, [options, search]);

    const allVisibleSelected = useMemo(() => {
        if (filteredOptions.length === 0) return false;
        return filteredOptions.every((opt) => tempSelected.includes(opt.value));
    }, [filteredOptions, tempSelected]);

    const someVisibleSelected = useMemo(() => {
        if (filteredOptions.length === 0) return false;
        return filteredOptions.some((opt) => tempSelected.includes(opt.value)) && !allVisibleSelected;
    }, [filteredOptions, tempSelected, allVisibleSelected]);

    const toggleSelectAll = () => {
        if (allVisibleSelected) {
            // Uncheck visible options
            const visibleValues = new Set(filteredOptions.map((o) => o.value));
            setTempSelected((prev) => prev.filter((val) => !visibleValues.has(val)));
        } else {
            // Check all visible options
            const newSet = new Set(tempSelected);
            filteredOptions.forEach((o) => newSet.add(o.value));
            setTempSelected(Array.from(newSet));
        }
    };

    const toggleOption = (val: string) => {
        setTempSelected((prev) => 
            prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
        );
    };

    const handleApply = () => {
        onApply?.(tempSelected);
        setOpen(false);
    };

    const handleClear = () => {
        setTempSelected([]);
        onReset?.();
        setOpen(false);
    };

    const handleSortClick = (direction: 'asc' | 'desc') => {
        if (sortKey && onSort) {
            onSort(sortKey, direction);
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "group inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0066cc] rounded-xs px-1 py-0.5 -mx-1",
                        (isFiltered || isSortedThisColumn) && "text-foreground font-bold",
                        className
                    )}
                    title={`Filter by ${title}`}
                >
                    <span className="truncate">{title}</span>

                    <span className="inline-flex items-center gap-0.5 shrink-0">
                        {isSortedThisColumn && (
                            currentSortDir === 'asc' ? (
                                <ArrowUp className="w-3 h-3 text-[#0066cc] shrink-0" />
                            ) : (
                                <ArrowDown className="w-3 h-3 text-[#0066cc] shrink-0" />
                            )
                        )}

                        {options.length > 0 && (
                            <span 
                                className={cn(
                                    "p-0.5 rounded transition-colors",
                                    isFiltered 
                                        ? "text-[#0066cc] bg-[#0066cc]/10 font-bold" 
                                        : "text-muted-foreground/50 group-hover:text-muted-foreground group-hover:bg-muted/60"
                                )}
                            >
                                <Filter className="w-3 h-3 shrink-0" />
                            </span>
                        )}

                        {isFiltered && (
                            <span className="inline-flex items-center justify-center min-w-[15px] h-3.5 px-1 rounded-full text-[9px] font-bold bg-[#0066cc] text-white">
                                {selectedValues.length}
                            </span>
                        )}
                    </span>
                </button>
            </PopoverTrigger>

            <PopoverContent
                align={align}
                className="w-64 p-0 bg-background border border-border shadow-lg rounded-xl overflow-hidden text-foreground text-xs font-sans z-50"
            >
                {/* Header */}
                <div className="px-3 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground tracking-tight">
                        Filter &amp; Sort: {title}
                    </span>
                    {(isFiltered || tempSelected.length > 0) && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-[11px] text-[#0066cc] hover:underline flex items-center gap-1 font-medium"
                        >
                            <RotateCcw className="w-2.5 h-2.5" />
                            Reset
                        </button>
                    )}
                </div>

                {/* Optional Sort Actions */}
                {enableSort && sortKey && onSort && (
                    <div className="p-1 border-b border-border/70 bg-background/50 space-y-0.5">
                        <button
                            type="button"
                            onClick={() => handleSortClick('asc')}
                            className={cn(
                                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-left transition-colors hover:bg-muted/60",
                                isSortedThisColumn && currentSortDir === 'asc' && "bg-[#0066cc]/10 text-[#0066cc] font-semibold"
                            )}
                        >
                            <ArrowUp className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span>Sort Ascending (A to Z / Low to High)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSortClick('desc')}
                            className={cn(
                                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-left transition-colors hover:bg-muted/60",
                                isSortedThisColumn && currentSortDir === 'desc' && "bg-[#0066cc]/10 text-[#0066cc] font-semibold"
                            )}
                        >
                            <ArrowDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span>Sort Descending (Z to A / High to Low)</span>
                        </button>
                    </div>
                )}

                {/* Checkbox Options List */}
                {options.length > 0 ? (
                    <div>
                        {/* Search Input for values */}
                        {options.length > 5 && (
                            <div className="p-2 border-b border-border/60">
                                <div className="relative">
                                    <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder={`Search ${title}...`}
                                        className="h-8 pl-7 pr-7 text-xs bg-muted/40 border-border/70 rounded-md focus-visible:ring-1 focus-visible:ring-[#0066cc]"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Select All Row */}
                        <div className="px-3 py-1.5 border-b border-border/50 bg-muted/20 flex items-center gap-2">
                            <Checkbox
                                id={`${columnKey || title}-select-all`}
                                checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                                onCheckedChange={toggleSelectAll}
                                className="h-3.5 w-3.5 rounded-xs border-muted-foreground/40 data-[state=checked]:bg-[#0066cc] data-[state=checked]:border-[#0066cc]"
                            />
                            <label
                                htmlFor={`${columnKey || title}-select-all`}
                                className="text-[11px] font-medium text-muted-foreground cursor-pointer select-none"
                            >
                                (Select All {search ? 'Filtered' : ''})
                            </label>
                        </div>

                        {/* Options List */}
                        <div className="max-h-48 overflow-y-auto p-1 divide-y divide-border/20 custom-scrollbar">
                            {filteredOptions.length === 0 ? (
                                <div className="py-4 text-center text-xs text-muted-foreground">
                                    No values match &ldquo;{search}&rdquo;
                                </div>
                            ) : (
                                filteredOptions.map((opt) => {
                                    const checked = tempSelected.includes(opt.value);
                                    return (
                                        <label
                                            key={opt.value}
                                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer select-none text-xs text-foreground transition-colors"
                                        >
                                            <Checkbox
                                                checked={checked}
                                                onCheckedChange={() => toggleOption(opt.value)}
                                                className="h-3.5 w-3.5 rounded-xs border-muted-foreground/40 data-[state=checked]:bg-[#0066cc] data-[state=checked]:border-[#0066cc]"
                                            />
                                            <span className="truncate flex-1" title={opt.label}>
                                                {opt.label}
                                            </span>
                                            {typeof opt.count === 'number' && (
                                                <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                                                    {opt.count}
                                                </span>
                                            )}
                                        </label>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="p-2 border-t border-border bg-muted/30 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-muted-foreground">
                                {tempSelected.length} of {options.length} selected
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setOpen(false)}
                                    className="h-7 px-2.5 text-xs rounded-md text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleApply}
                                    className="h-7 px-3 text-xs font-semibold rounded-md bg-[#0066cc] hover:bg-[#0071e3] text-white shadow-xs"
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Sort-only column footer if no checkbox options */
                    <div className="p-2 border-t border-border bg-muted/30 flex justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpen(false)}
                            className="h-7 px-2.5 text-xs rounded-md text-muted-foreground hover:text-foreground"
                        >
                            Close
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
