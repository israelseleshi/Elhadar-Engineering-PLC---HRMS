import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Separator } from '@/Components/ui/separator';
import { toast } from 'sonner';
import axios from 'axios';
import {
    AlertTriangle,
    Bell,
    CheckCircle2,
    Download,
    FileText,
    Heart,
    PartyPopper,
    Pin,
    Shield,
    ShieldCheck,
    Sparkles,
    ThumbsUp,
    ExternalLink,
    Clock,
    User as UserIcon,
} from 'lucide-react';

export interface AnnouncementItem {
    id: number;
    title: string;
    title_am?: string | null;
    content: string;
    content_am?: string | null;
    priority: 'standard' | 'important' | 'critical';
    category: 'general' | 'policy' | 'safety' | 'payroll' | 'holiday' | 'event';
    is_pinned: boolean;
    requires_acknowledgment: boolean;
    allow_reactions: boolean;
    attachment_url?: string | null;
    attachment_name?: string | null;
    published_at: string | null;
    expires_at?: string | null;
    created_at: string;
    is_read?: boolean;
    is_acknowledged?: boolean;
    user_reaction?: string | null;
    reactions?: Record<string, number>;
    total_reactions?: number;
    creator?: {
        id: number;
        name: string;
        role: string;
    } | null;
}

interface Props {
    announcement: AnnouncementItem | null;
    isOpen: boolean;
    onClose: () => void;
    onAcknowledged?: (id: number) => void;
    onReactionChanged?: (id: number, reaction: string | null, counts: Record<string, number>) => void;
}

const formatGregorianDate = (dateString?: string | null): string => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function AnnouncementReaderModal({
    announcement,
    isOpen,
    onClose,
    onAcknowledged,
    onReactionChanged,
}: Props) {
    const [lang, setLang] = useState<'en' | 'am'>('en');
    const [acknowledging, setAcknowledging] = useState(false);
    const [isAcknowledged, setIsAcknowledged] = useState(Boolean(announcement?.is_acknowledged));
    const [userReaction, setUserReaction] = useState<string | null>(announcement?.user_reaction ?? null);
    const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(
        announcement?.reactions ?? { clap: 0, party: 0, heart: 0, thumbs_up: 0, verified: 0 }
    );

    if (!announcement) return null;

    const hasAmharic = Boolean(announcement.title_am || announcement.content_am);
    const currentTitle = (lang === 'am' && announcement.title_am) ? announcement.title_am : announcement.title;
    const currentContent = (lang === 'am' && announcement.content_am) ? announcement.content_am : announcement.content;

    const handleAcknowledge = async () => {
        if (!announcement) return;
        setAcknowledging(true);
        try {
            const res = await axios.post(`/announcements/${announcement.id}/acknowledge`);
            if (res.data.success) {
                setIsAcknowledged(true);
                toast.success('Official circular receipt confirmed and recorded.');
                onAcknowledged?.(announcement.id);
            }
        } catch {
            toast.error('Failed to record acknowledgment. Please try again.');
        } finally {
            setAcknowledging(false);
        }
    };

    const handleReact = async (reactionType: string) => {
        if (!announcement || !announcement.allow_reactions) return;

        // Optimistic UI update
        const prevReaction = userReaction;
        const newReaction = prevReaction === reactionType ? null : reactionType;
        setUserReaction(newReaction);

        try {
            const res = await axios.post(`/announcements/${announcement.id}/react`, { reaction: reactionType });
            setUserReaction(res.data.user_reaction);
            setReactionCounts(res.data.reactions);
            onReactionChanged?.(announcement.id, res.data.user_reaction, res.data.reactions);
        } catch {
            setUserReaction(prevReaction);
            toast.error('Could not save reaction.');
        }
    };

    const getPriorityBadge = (p: string) => {
        switch (p) {
            case 'critical':
                return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 font-semibold text-[11px]"><AlertTriangle className="w-3 h-3 mr-1" /> Critical Notice</Badge>;
            case 'important':
                return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold text-[11px]"><Bell className="w-3 h-3 mr-1" /> Important</Badge>;
            default:
                return <Badge variant="secondary" className="text-[11px] font-medium text-muted-foreground">General</Badge>;
        }
    };

    const getCategoryBadge = (c: string) => {
        const labels: Record<string, string> = {
            policy: 'HR Policy',
            safety: 'Health & Safety',
            payroll: 'Payroll & Benefits',
            holiday: 'Public Holiday',
            event: 'Company Event',
            general: 'General Memo',
        };
        return <Badge variant="outline" className="text-[11px] border-border/80 text-foreground/80">{labels[c] || 'Circular'}</Badge>;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl bg-background border border-border shadow-2xl">
                {/* Header Banner */}
                <div className={`p-6 pb-4 border-b border-border/60 ${
                    announcement.priority === 'critical'
                        ? 'bg-red-500/[0.04] dark:bg-red-500/[0.08]'
                        : announcement.priority === 'important'
                        ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.08]'
                        : 'bg-muted/30'
                }`}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            {getPriorityBadge(announcement.priority)}
                            {getCategoryBadge(announcement.category)}
                            {announcement.is_pinned && (
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-semibold">
                                    <Pin className="w-2.5 h-2.5 mr-1" /> Pinned
                                </Badge>
                            )}
                        </div>

                        {/* Language Switcher */}
                        {hasAmharic && (
                            <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5 text-xs">
                                <button
                                    onClick={() => setLang('en')}
                                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                                        lang === 'en'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => setLang('am')}
                                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                                        lang === 'am'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    አማርኛ
                                </button>
                            </div>
                        )}
                    </div>

                    <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
                        {currentTitle}
                    </DialogTitle>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatGregorianDate(announcement.published_at || announcement.created_at)}</span>
                        </div>
                        {announcement.creator && (
                            <div className="flex items-center gap-1.5">
                                <UserIcon className="w-3.5 h-3.5" />
                                <span>Issued by: <strong className="text-foreground font-medium">{announcement.creator.name}</strong> ({announcement.creator.role})</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm leading-relaxed text-foreground/90">
                    <div className="whitespace-pre-line font-normal text-[14px] sm:text-[15px] space-y-3">
                        {currentContent}
                    </div>

                    {/* Official Attachment Document Card */}
                    {announcement.attachment_url && (
                        <div className="mt-4 p-4 rounded-xl border border-border/80 bg-accent/40 flex items-center justify-between gap-3 transition-colors hover:bg-accent/70">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate">
                                        {announcement.attachment_name || 'Official Company Circular Document'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Official signed / stamped attachment
                                    </p>
                                </div>
                            </div>
                            <a
                                href={announcement.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shrink-0 transition-all shadow-sm"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                            </a>
                        </div>
                    )}

                    {/* Mandatory Compliance Acknowledgment Box */}
                    {announcement.requires_acknowledgment && (
                        <div className={`mt-6 p-4 rounded-xl border transition-all ${
                            isAcknowledged
                                ? 'bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                : 'bg-primary/[0.04] border-primary/20 text-foreground'
                        }`}>
                            <div className="flex items-start gap-3">
                                {isAcknowledged ? (
                                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                    <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider">
                                        {isAcknowledged ? 'Official Circular Acknowledged' : 'Formal Employee Acknowledgment Required'}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {isAcknowledged
                                            ? 'You have formally acknowledged reading and understanding this company circular. Your confirmation is logged in the compliance ledger.'
                                            : 'By confirming receipt, you certify that you have read, understood, and agreed to adhere to this official circular and any associated directives.'}
                                    </p>

                                    {!isAcknowledged && (
                                        <div className="mt-3">
                                            <Button
                                                size="sm"
                                                onClick={handleAcknowledge}
                                                disabled={acknowledging}
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-sm"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                                <span>{acknowledging ? 'Recording...' : 'I Acknowledge & Confirm Receipt'}</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Bar with Emoji Reactions */}
                <div className="p-4 px-6 bg-muted/20 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                    {/* Emoji Reaction Bar */}
                    {announcement.allow_reactions ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-muted-foreground font-medium mr-1 hidden sm:inline">React:</span>
                            {[
                                { key: 'thumbs_up', emoji: '👍', label: 'Like' },
                                { key: 'clap', emoji: '👏', label: 'Applaud' },
                                { key: 'party', emoji: '🎉', label: 'Celebrate' },
                                { key: 'heart', emoji: '❤️', label: 'Support' },
                                { key: 'verified', emoji: '🛡️', label: 'Noted' },
                            ].map((btn) => {
                                const count = reactionCounts[btn.key] || 0;
                                const isSelected = userReaction === btn.key;
                                return (
                                    <button
                                        key={btn.key}
                                        onClick={() => handleReact(btn.key)}
                                        title={btn.label}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                            isSelected
                                                ? 'bg-primary/15 text-primary border border-primary/30 shadow-xs'
                                                : 'bg-background hover:bg-accent border border-border text-foreground/80'
                                        }`}
                                    >
                                        <span>{btn.emoji}</span>
                                        {count > 0 && <span className="text-[11px] font-semibold">{count}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div />
                    )}

                    <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs font-medium ml-auto">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
