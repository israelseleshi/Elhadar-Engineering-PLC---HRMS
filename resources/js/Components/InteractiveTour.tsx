import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/Components/ui/button';
import { 
    ChevronLeft, 
    ChevronRight, 
    X, 
    Check, 
    Compass
} from 'lucide-react';

export interface TourStep {
    target: string; // CSS selector, e.g. '[data-tour="onboard-btn"]'
    title: string;
    content: string;
    badge?: string;
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
    tip?: string;
}

interface InteractiveTourProps {
    steps: TourStep[];
    isOpen: boolean;
    onClose: () => void;
    tourTitle?: string;
}

interface TargetRect {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
}

export default function InteractiveTour({
    steps,
    isOpen,
    onClose,
    tourTitle = 'Page tour',
}: InteractiveTourProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
    const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; placement: string }>({
        top: 0,
        left: 0,
        placement: 'bottom',
    });
    const [isTargetVisible, setIsTargetVisible] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const step = steps[currentStepIndex];

    // Reset step when opening
    useEffect(() => {
        if (isOpen) {
            setCurrentStepIndex(0);
        }
    }, [isOpen]);

    // Calculate position for current step's target
    const updateTargetPosition = useCallback(() => {
        if (!isOpen || !step) return;

        const el = document.querySelector(step.target);
        if (!el) {
            setIsTargetVisible(false);
            return;
        }

        const rect = el.getBoundingClientRect();
        const pad = 8;
        const paddedRect: TargetRect = {
            top: Math.max(0, rect.top - pad),
            left: Math.max(0, rect.left - pad),
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            bottom: rect.bottom + pad,
            right: rect.right + pad,
        };

        setTargetRect(paddedRect);
        setIsTargetVisible(true);

        // Position popover
        const popoverEl = popoverRef.current;
        const popoverWidth = popoverEl ? popoverEl.offsetWidth : 360;
        const popoverHeight = popoverEl ? popoverEl.offsetHeight : 240;

        const spaceBelow = window.innerHeight - paddedRect.bottom;
        const spaceAbove = paddedRect.top;
        const preferredPlacement = step.placement || 'auto';

        let placement = 'bottom';
        if (preferredPlacement === 'top' || (preferredPlacement === 'auto' && spaceBelow < 280 && spaceAbove > spaceBelow)) {
            placement = 'top';
        } else if (preferredPlacement === 'left') {
            placement = 'left';
        } else if (preferredPlacement === 'right') {
            placement = 'right';
        }

        let calculatedTop = 0;
        let calculatedLeft = 0;

        if (placement === 'bottom') {
            calculatedTop = paddedRect.bottom + 14;
            calculatedLeft = paddedRect.left + (paddedRect.width / 2) - (popoverWidth / 2);
        } else if (placement === 'top') {
            calculatedTop = paddedRect.top - popoverHeight - 14;
            calculatedLeft = paddedRect.left + (paddedRect.width / 2) - (popoverWidth / 2);
        } else if (placement === 'left') {
            calculatedTop = paddedRect.top + (paddedRect.height / 2) - (popoverHeight / 2);
            calculatedLeft = paddedRect.left - popoverWidth - 14;
        } else if (placement === 'right') {
            calculatedTop = paddedRect.top + (paddedRect.height / 2) - (popoverHeight / 2);
            calculatedLeft = paddedRect.right + 14;
        }

        // Clamp to screen boundaries with 16px margin
        calculatedLeft = Math.max(16, Math.min(calculatedLeft, window.innerWidth - popoverWidth - 16));
        calculatedTop = Math.max(16, Math.min(calculatedTop, window.innerHeight - popoverHeight - 16));

        setPopoverPos({ top: calculatedTop, left: calculatedLeft, placement });
    }, [isOpen, step]);

    // Scroll element into view when step changes
    useEffect(() => {
        if (!isOpen || !step) return;

        const el = document.querySelector(step.target);
        if (el) {
            el.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest',
            });
            // Update immediately and after smooth scroll completes
            const timer1 = setTimeout(updateTargetPosition, 100);
            const timer2 = setTimeout(updateTargetPosition, 400);
            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        } else {
            setIsTargetVisible(false);
        }
    }, [currentStepIndex, isOpen, step, updateTargetPosition]);

    // Listen to resize and scroll
    useEffect(() => {
        if (!isOpen) return;

        const handleScrollOrResize = () => {
            window.requestAnimationFrame(updateTargetPosition);
        };

        window.addEventListener('resize', handleScrollOrResize);
        window.addEventListener('scroll', handleScrollOrResize, true);

        return () => {
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('scroll', handleScrollOrResize, true);
        };
    }, [isOpen, updateTargetPosition]);

    // Keyboard navigation (Escape, ArrowRight, ArrowLeft)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowRight') {
                if (currentStepIndex < steps.length - 1) {
                    setCurrentStepIndex((prev) => prev + 1);
                } else {
                    onClose();
                }
            } else if (e.key === 'ArrowLeft') {
                if (currentStepIndex > 0) {
                    setCurrentStepIndex((prev) => prev - 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentStepIndex, steps.length, onClose]);

    if (!isOpen || !step) return null;

    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;
    const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

    return (
        <div className="fixed inset-0 z-[9990] overflow-hidden select-none font-['Inter_Tight',sans-serif]">
            {/* SVG Mask Spotlight Cutout */}
            <svg className="fixed inset-0 w-full h-full pointer-events-none z-[9991]">
                <defs>
                    <mask id="tour-spotlight-mask">
                        {/* White rectangle covers entire viewport (transparent cutout allows through) */}
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {targetRect && isTargetVisible && (
                            /* Black rectangle cuts out transparent hole over target */
                            <rect
                                x={targetRect.left}
                                y={targetRect.top}
                                width={targetRect.width}
                                height={targetRect.height}
                                rx="6"
                                ry="6"
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                {/* Darkened overlay using the mask */}
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(10, 20, 16, 0.68)"
                    mask="url(#tour-spotlight-mask)"
                    className="pointer-events-auto cursor-pointer"
                    onClick={onClose}
                />
            </svg>

            {/* Glowing Spotlight Ring around target */}
            {targetRect && isTargetVisible && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            left: targetRect.left,
                            top: targetRect.top,
                            width: targetRect.width,
                            height: targetRect.height,
                            borderRadius: '10px',
                        }}
                        className="pointer-events-none z-[9992] border-2 border-primary ring-4 ring-primary/25 shadow-[0_0_20px_rgba(37,99,235,0.35)] transition-all duration-300 ease-out"
                    />

                    {/* Animated Pulsing Beacon Marker */}
                    <div
                        style={{
                            position: 'fixed',
                            left: targetRect.left - 5,
                            top: targetRect.top - 5,
                        }}
                        className="pointer-events-none z-[9993] flex h-4 w-4"
                    >
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-background shadow-xs" />
                    </div>
                </>
            )}

            {/* Floating Popover Tooltip Card */}
            <div
                ref={popoverRef}
                style={{
                    position: 'fixed',
                    top: popoverPos.top,
                    left: popoverPos.left,
                    width: '340px',
                    maxWidth: 'calc(100vw - 32px)',
                }}
                className="z-[9995] bg-card text-card-foreground rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ease-out animate-in fade-in zoom-in-95"
            >
                {/* Popover Header */}
                <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-border/50">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Compass className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground truncate">
                            {tourTitle}
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors -mr-1"
                        title="Close tour (Esc)"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Popover Body */}
                <div className="p-4 space-y-1.5">
                    <h3 className="text-sm font-semibold text-foreground tracking-tight leading-snug">
                        {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                        {step.content}
                    </p>
                </div>

                {/* Popover Footer with Actions */}
                <div className="px-4 py-3 bg-muted/30 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                        {currentStepIndex + 1} of {steps.length}
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={onClose}
                            className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 transition-colors mr-1"
                        >
                            Skip
                        </button>

                        {!isFirstStep && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                                className="h-7 px-2.5 text-xs font-medium rounded-lg border-border bg-card hover:bg-muted text-foreground"
                            >
                                <ChevronLeft className="w-3 h-3 mr-0.5" />
                                Back
                            </Button>
                        )}

                        {isLastStep ? (
                            <Button
                                size="sm"
                                onClick={onClose}
                                className="h-7 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-xs"
                            >
                                <Check className="w-3 h-3 mr-1" />
                                Done
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                                className="h-7 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-xs"
                            >
                                Next
                                <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

