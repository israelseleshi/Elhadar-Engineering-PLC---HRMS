"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AnimatedThemeToggler, type TransitionVariant } from "@/Components/ui/animated-theme-toggler";
import { cn } from "@/lib/utils";

export interface ThemeToggleProps {
    className?: string;
    appearance?: "light" | "dark";
    variant?: TransitionVariant;
    duration?: number;
    fromCenter?: boolean;
}

export function ThemeToggle({
    className,
    appearance = "light",
    variant = "circle",
    duration = 450,
    fromCenter = false,
}: ThemeToggleProps) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const onDark = appearance === "dark";

    if (!mounted) {
        return (
            <div
                className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full border p-0 backdrop-blur-xl shadow-sm",
                    onDark ? "border-white/20 bg-white/10 text-white" : "border-border/70 bg-background/80 text-muted-foreground",
                    className
                )}
                aria-hidden
            >
                <div className="h-4 w-4 rounded-full bg-muted-foreground/30 animate-pulse" />
            </div>
        );
    }

    const currentTheme = (resolvedTheme === "dark" || theme === "dark" ? "dark" : "light") as "light" | "dark";

    return (
        <AnimatedThemeToggler
            theme={currentTheme}
            onThemeChange={(nextTheme) => setTheme(nextTheme)}
            variant={variant}
            duration={duration}
            fromCenter={fromCenter}
            aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
            className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border p-0 shadow-sm backdrop-blur-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer",
                onDark
                    ? "border-white/20 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
                    : "border-border/70 bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground",
                className
            )}
        />
    );
}

export default ThemeToggle;
