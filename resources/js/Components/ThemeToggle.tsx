"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "light" | "dark" | "system";
const options: { value: Mode; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function ThemeToggle({
    className,
    appearance = "light", // 'light' or 'dark' background context
}: {
    className?: string;
    appearance?: "light" | "dark";
}) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <div className={cn("inline-flex h-9 items-center rounded-full border border-border/80 bg-background/70 p-1 backdrop-blur-xl", className)} aria-hidden>
                <div className="h-7 w-7 rounded-full" /><div className="h-7 w-7 rounded-full" /><div className="h-7 w-7 rounded-full" />
            </div>
        );
    }

    const active = (theme as Mode) || "system";
    const onDark = appearance === "dark";

    return (
        <div
            role="radiogroup"
            aria-label="Theme"
            className={cn(
                "inline-flex h-9 items-center gap-0.5 rounded-full border border-border/70 p-1 shadow-sm backdrop-blur-xl transition-colors",
                onDark ? "dark:border-white/20 dark:bg-white/10" : "bg-background/70",
                className
            )}
        >
            {options.map(({ value, icon: Icon, label }) => {
                const selected = active === value;
                return (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={label}
                        title={label}
                        onClick={() => setTheme(value)}
                        className={cn(
                            "relative inline-flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-background",
                            selected
                                ? onDark
                                    ? "bg-white/15 text-white shadow-[0_1px_2px_rgba(255,255,255,0.10)]"
                                    : "bg-card text-card-foreground shadow-sm shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                                : onDark
                                    ? "text-white/50 hover:text-white"
                                    : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
                    </button>
                );
            })}
            <span className="sr-only">Current: {resolvedTheme}</span>
        </div>
    );
}
