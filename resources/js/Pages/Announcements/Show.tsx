import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import {
    ArrowLeft,
    Clock,
    FileText,
    Download,
    CheckCircle2,
    Shield,
    ShieldCheck,
    AlertTriangle,
    Bell,
    Pin,
    User as UserIcon,
    ThumbsUp,
    Heart,
    PartyPopper,
} from 'lucide-react';
import { AnnouncementItem } from '@/Components/AnnouncementReaderModal';

interface Props {
    announcement: AnnouncementItem;
    is_acknowledged: boolean;
    user_reaction: string | null;
}

export default function AnnouncementsShow({
    announcement,
    is_acknowledged,
    user_reaction,
}: Props) {
    const [lang, setLang] = useState<'en' | 'am'>('en');
    const [acknowledged, setAcknowledged] = useState(is_acknowledged);
    const [acknowledging, setAcknowledging] = useState(false);
    const [currentReaction, setCurrentReaction] = useState<string | null>(user_reaction);
    const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(
        announcement.reactions || { clap: 0, party: 0, heart: 0, thumbs_up: 0, verified: 0 }
    );

    const hasAmharic = Boolean(announcement.title_am || announcement.content_am);
    const title = (lang === 'am' && announcement.title_am) ? announcement.title_am : announcement.title;
    const content = (lang === 'am' && announcement.content_am) ? announcement.content_am : announcement.content;

    const handleAcknowledge = async () => {
        setAcknowledging(true);
        try {
            const res = await axios.post(`/announcements/${announcement.id}/acknowledge`);
            if (res.data.success) {
                setAcknowledged(true);
                toast.success('Circular acknowledgment recorded.');
            }
        } catch {
            toast.error('Could not record acknowledgment.');
        } finally {
            setAcknowledging(false);
        }
    };

    const handleReact = async (r: string) => {
        if (!announcement.allow_reactions) return;

        const prev = currentReaction;
        setCurrentReaction(prev === r ? null : r);

        try {
            const res = await axios.post(`/announcements/${announcement.id}/react`, { reaction: r });
            setCurrentReaction(res.data.user_reaction);
            setReactionCounts(res.data.reactions);
        } catch {
            setCurrentReaction(prev);
            toast.error('Could not save reaction.');
        }
    };

    return (
        <AuthenticatedLayout
            title="Official Company Circular"
            subtitle="Review full directive, policies, and attachments."
        >
            <Head title={`${title} - Elhadar Engineering HRMS`} />

            <div className="max-w-3xl mx-auto space-y-6">
                <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground">
                    <Link href={route('announcements.index')}>
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Notice Board</span>
                    </Link>
                </Button>

                <Card className="rounded-2xl border border-border shadow-xs overflow-hidden bg-card">
                    {/* Header Banner */}
                    <div className={`p-6 sm:p-8 border-b border-border/60 ${
                        announcement.priority === 'critical'
                            ? 'bg-red-500/[0.04]'
                            : announcement.priority === 'important'
                            ? 'bg-amber-500/[0.04]'
                            : 'bg-muted/20'
                    }`}>
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                {announcement.priority === 'critical' && (
                                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-xs font-semibold">
                                        <AlertTriangle className="w-3 h-3 mr-1" /> Critical Notice
                                    </Badge>
                                )}
                                {announcement.priority === 'important' && (
                                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs font-semibold">
                                        <Bell className="w-3 h-3 mr-1" /> Important
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-xs uppercase text-muted-foreground">
                                    {announcement.category}
                                </Badge>
                                {announcement.is_pinned && (
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
                                        <Pin className="w-3 h-3 mr-1" /> Pinned
                                    </Badge>
                                )}
                            </div>

                            {hasAmharic && (
                                <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5 text-xs">
                                    <button
                                        onClick={() => setLang('en')}
                                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                                            lang === 'en'
                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => setLang('am')}
                                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                                            lang === 'am'
                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        አማርኛ
                                    </button>
                                </div>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
                            {title}
                        </h1>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 flex-wrap">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(announcement.published_at || announcement.created_at).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </span>
                            {announcement.creator && (
                                <span className="flex items-center gap-1.5">
                                    <UserIcon className="w-3.5 h-3.5" />
                                    <span>Issued by <strong>{announcement.creator.name}</strong> ({announcement.creator.role})</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Content Body */}
                    <CardContent className="p-6 sm:p-8 space-y-6">
                        <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-foreground/90">
                            {content}
                        </div>

                        {/* Attachment Download */}
                        {announcement.attachment_url && (
                            <div className="p-4 rounded-xl border border-border bg-accent/30 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-foreground truncate">
                                            {announcement.attachment_name || 'Official Circular Attachment'}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">Official stamped circular document</p>
                                    </div>
                                </div>
                                <a
                                    href={announcement.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium shrink-0 hover:bg-primary/90 shadow-xs"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download</span>
                                </a>
                            </div>
                        )}

                        {/* Compliance Acknowledgment Box */}
                        {announcement.requires_acknowledgment && (
                            <div className={`p-5 rounded-2xl border ${
                                acknowledged
                                    ? 'bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-primary/[0.04] border-primary/20 text-foreground'
                            }`}>
                                <div className="flex items-start gap-3">
                                    {acknowledged ? (
                                        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    ) : (
                                        <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                        <h4 className="text-xs font-bold uppercase tracking-wider">
                                            {acknowledged ? 'Receipt Acknowledged' : 'Formal Employee Acknowledgment Required'}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {acknowledged
                                                ? 'You have formally acknowledged reading and understanding this company directive.'
                                                : 'By confirming receipt, you certify that you have read, understood, and agreed to adhere to this circular.'}
                                        </p>
                                        {!acknowledged && (
                                            <Button
                                                onClick={handleAcknowledge}
                                                disabled={acknowledging}
                                                className="mt-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl h-8"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                                <span>{acknowledging ? 'Recording...' : 'I Acknowledge & Confirm Receipt'}</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reactions Bar */}
                        {announcement.allow_reactions && (
                            <div className="pt-4 border-t border-border flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground font-medium mr-1">Reactions:</span>
                                {[
                                    { key: 'thumbs_up', emoji: '👍' },
                                    { key: 'clap', emoji: '👏' },
                                    { key: 'party', emoji: '🎉' },
                                    { key: 'heart', emoji: '❤️' },
                                    { key: 'verified', emoji: '🛡️' },
                                ].map((b) => {
                                    const count = reactionCounts[b.key] || 0;
                                    const isSelected = currentReaction === b.key;
                                    return (
                                        <button
                                            key={b.key}
                                            onClick={() => handleReact(b.key)}
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                                isSelected
                                                    ? 'bg-primary/15 text-primary border border-primary/30 shadow-xs'
                                                    : 'bg-muted/40 hover:bg-muted border border-border text-foreground/80'
                                            }`}
                                        >
                                            <span>{b.emoji}</span>
                                            {count > 0 && <span className="font-semibold text-[11px]">{count}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
