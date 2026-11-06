import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { 
    ChevronLeft, 
    ChevronRight, 
    X, 
    Sparkles, 
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
    tourTitle = 'Staff Directory Interactive Tour',
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
                            borderRadius: '6px',
                        }}
                        className="pointer-events-none z-[9992] border-2 border-[#0066cc] ring-4 ring-[#0066cc]/30 shadow-[0_0_25px_rgba(0,130,84,0.5)] transition-all duration-300 ease-out"
                    />

                    {/* Animated Pulsing Beacon Marker */}
                    <div
                        style={{
                            position: 'fixed',
                            left: targetRect.left - 6,
                            top: targetRect.top - 6,
                        }}
                        className="pointer-events-none z-[9993] flex h-5 w-5"
                    >
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0066cc] opacity-80" />
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-[#0066cc] border-2 border-white shadow-sm" />
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
                    width: '380px',
                    maxWidth: 'calc(100vw - 32px)',
                }}
                className="z-[9995] bg-white rounded-xs border border-[#d2d2d7] shadow-[0_20px_50px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden transition-all duration-300 ease-out animate-in fade-in zoom-in-95"
            >
                {/* Popover Header */}
                <div className="bg-[#0066cc] text-white p-3.5 flex items-center justify-between border-b border-[#0071e3]">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-xs bg-[#f5f5f7] text-[#0066cc] flex items-center justify-center font-bold">
                            <Compass className="w-3.5 h-3.5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-wider uppercase text-[#f5f5f7]">
                                {tourTitle}
                            </p>
                            <p className="text-xs font-bold text-white">
                                Step {currentStepIndex + 1} of {steps.length}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {step.badge && (
                            <Badge className="bg-[#2997ff] hover:bg-[#2997ff] text-[#1d1d1f] text-[10px] font-bold px-1.5 py-0.5 rounded-xs border-0">
                                {step.badge}
                            </Badge>
                        )}
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-1 rounded-xs hover:bg-[#0071e3] transition-colors"
                            title="Close Tour (Esc)"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#e8e8ed] h-1">
                    <div
                        className="bg-[#0066cc] h-1 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Popover Body */}
                <div className="p-4 space-y-3 bg-white">
                    <div>
                        <h3 className="text-base font-bold text-black tracking-tight leading-tight flex items-center gap-1.5">
                            <span>{step.title}</span>
                        </h3>
                        <p className="text-xs text-[#424245] leading-relaxed mt-1.5 font-normal">
                            {step.content}
                        </p>
                    </div>

                    {step.tip && (
                        <div className="bg-[#f5f5f7] border border-[#0066cc]/25 p-2.5 rounded-xs flex items-start gap-2 text-[11px] text-[#1d1d1f] font-medium leading-normal">
                            <Sparkles className="w-3.5 h-3.5 text-[#0066cc] shrink-0 mt-0.5" />
                            <span>{step.tip}</span>
                        </div>
                    )}
                </div>

                {/* Popover Footer with Actions */}
                <div className="px-4 py-3 bg-[#f5f5f7] border-t border-[#e8e8ed] flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="text-xs font-semibold text-[#6e6e73] hover:text-black transition-colors"
                    >
                        Skip Tour
                    </button>

                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                            disabled={isFirstStep}
                            className="h-8 px-2.5 text-xs font-semibold border-[#d2d2d7] text-[#424245] rounded-xs disabled:opacity-40"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                            Back
                        </Button>

                        {isLastStep ? (
                            <Button
                                size="sm"
                                onClick={onClose}
                                className="h-8 px-3.5 text-xs font-bold bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-xs gap-1 shadow-sm"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Done
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                                className="h-8 px-3.5 text-xs font-bold bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-xs gap-1 shadow-sm"
                            >
                                Next
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

