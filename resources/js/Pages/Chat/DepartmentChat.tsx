import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import axios from 'axios';
import {
    ArrowUp,
    Check,
    CheckCheck,
    Download,
    FileCode,
    FileSpreadsheet,
    FileText,
    FolderArchive,
    Hash,
    Image as ImageIcon,
    Info,
    MessageSquare,
    Paperclip,
    Pin,
    PinOff,
    Plus,
    Reply,
    Search,
    Send,
    Smile,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import getEchoInstance from '@/echo';
import ChatVaultDrawer from './Partials/ChatVaultDrawer';
import ReadReceiptsModal from './Partials/ReadReceiptsModal';

interface Channel {
    id: number;
    slug: string;
    name: string;
    description: string;
    department_id: number | null;
    department_name: string;
    is_read_only: boolean;
    is_all_company: boolean;
    member_count: number;
    unread_count: number;
    last_message: {
        body: string;
        type: string;
        created_at: string;
        sender_name: string;
    } | null;
}

interface MessageAttachment {
    id: number;
    file_name: string;
    file_size: number;
    mime_type: string;
    category: string;
    url: string;
    thumbnail_url: string | null;
}

interface MessageReaction {
    emoji: string;
    count: number;
    has_reacted: boolean;
}

interface ChatMessage {
    id: number;
    body: string;
    type: string;
    created_at: string;
    created_at_formatted: string;
    created_date_formatted: string;
    is_mine: boolean;
    read_status: 'sent' | 'read' | null;
    seen_count: number;
    is_seen_by_me: boolean;
    sender: {
        id: number;
        name: string;
        role: string;
        initials: string;
    };
    reply_to: {
        id: number;
        sender_name: string;
        body_preview: string;
    } | null;
    attachments: MessageAttachment[];
    reactions: MessageReaction[];
}

interface Props {
    channels: Channel[];
    activeChannel: Channel;
    initialMessages: ChatMessage[];
    hasMoreMessages: boolean;
    vaultData: any;
    currentUser: {
        id: number;
        name: string;
        role: string;
        department_id: number | null;
        position: string;
        initials: string;
    };
}

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '👏', '🎉', '💡'];

export default function DepartmentChat({
    channels,
    activeChannel,
    initialMessages,
    hasMoreMessages: initialHasMore,
    vaultData: initialVaultData,
    currentUser,
}: Props) {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
    const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
    const [page, setPage] = useState<number>(1);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);

    // Composer state
    const [inputText, setInputText] = useState<string>('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [isSending, setIsSending] = useState<boolean>(false);

    // Vault & Modals state
    const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
    const [vaultData, setVaultData] = useState<any>(initialVaultData);
    const [receiptsMessageId, setReceiptsMessageId] = useState<number | null>(null);
    const [pinnedMessage, setPinnedMessage] = useState<any>(initialVaultData?.pinned || null);

    // Presence & UI
    const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
    const [channelSearch, setChannelSearch] = useState<string>('');
    const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom on initial load or new message
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        scrollToBottom('auto');
    }, [activeChannel?.id]);

    // Setup Real-Time WebSockets with Laravel Echo
    useEffect(() => {
        const echo = getEchoInstance();
        if (!activeChannel?.id || !echo) return;

        const conversationChannelName = `chat.conversation.${activeChannel.id}`;
        const presenceChannelName = activeChannel.department_id
            ? `presence.department.${activeChannel.department_id}`
            : null;

        // 1. Subscribe to conversation message events
        const convChannel = echo.private(conversationChannelName);

        convChannel.listen('ChatMessageSent', (e: { message: ChatMessage }) => {
            if (e.message) {
                setMessages((prev) => {
                    // Prevent duplicate if already added locally
                    if (prev.some((m) => m.id === e.message.id)) return prev;
                    return [...prev, { ...e.message, is_mine: e.message.sender.id === currentUser.id }];
                });
                scrollToBottom();

                // Auto mark as read if received in active conversation
                axios.post(route('chat.read', activeChannel.id), { message_id: e.message.id }).catch(() => {});
            }
        });

        convChannel.listen('ChatMessageRead', (e: { messageId?: number; userId: number }) => {
            setMessages((prev) =>
                prev.map((m) => {
                    if (m.is_mine) {
                        return { ...m, read_status: 'read', seen_count: m.seen_count + 1 };
                    }
                    return m;
                })
            );
        });

        convChannel.listen('ChatMessageReactionToggled', (e: { messageId: number; reactionsSummary: MessageReaction[] }) => {
            setMessages((prev) =>
                prev.map((m) => {
                    if (m.id === e.messageId) {
                        return { ...m, reactions: e.reactionsSummary };
                    }
                    return m;
                })
            );
        });

        convChannel.listen('ChatPinnedMessageUpdated', (e: { pinnedMessage: any }) => {
            setPinnedMessage(e.pinnedMessage);
            if (e.pinnedMessage) {
                toast.info(`Announcement pinned by ${e.pinnedMessage.pinned_by_name}`);
            }
        });

        // 2. Subscribe to department presence channel
        let presenceChannel: any = null;
        if (presenceChannelName) {
            presenceChannel = echo.join(presenceChannelName);
            presenceChannel
                .here((users: Array<{ id: number; name: string }>) => {
                    setOnlineUserIds(users.map((u) => u.id));
                })
                .joining((user: { id: number; name: string }) => {
                    setOnlineUserIds((prev) => [...prev.filter((id) => id !== user.id), user.id]);
                })
                .leaving((user: { id: number; name: string }) => {
                    setOnlineUserIds((prev) => prev.filter((id) => id !== user.id));
                });
        }

        return () => {
            echo.leave(conversationChannelName);
            if (presenceChannelName) {
                echo.leave(presenceChannelName);
            }
        };
    }, [activeChannel?.id, currentUser.id]);

    // Handle Infinite Scrolling up for older messages
    const handleScroll = () => {
        if (!messagesContainerRef.current || loadingMore || !hasMore) return;

        if (messagesContainerRef.current.scrollTop === 0) {
            const currentScrollHeight = messagesContainerRef.current.scrollHeight;
            setLoadingMore(true);

            axios
                .get(route('chat.messages', activeChannel.id), {
                    params: { page: page + 1 },
                })
                .then((res) => {
                    const olderMessages: ChatMessage[] = res.data.messages || [];
                    if (olderMessages.length > 0) {
                        setMessages((prev) => [...olderMessages, ...prev]);
                        setPage((p) => p + 1);
                        setHasMore(res.data.has_more);

                        // Maintain scroll position after prepending
                        requestAnimationFrame(() => {
                            if (messagesContainerRef.current) {
                                const newScrollHeight = messagesContainerRef.current.scrollHeight;
                                messagesContainerRef.current.scrollTop = newScrollHeight - currentScrollHeight;
                            }
                        });
                    } else {
                        setHasMore(false);
                    }
                })
                .catch(() => {})
                .finally(() => setLoadingMore(false));
        }
    };

    // Send Message
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = inputText.trim();
        if ((!trimmed && selectedFiles.length === 0) || isSending) return;

        setIsSending(true);

        const formData = new FormData();
        if (trimmed) formData.append('body', trimmed);
        if (replyTo) formData.append('reply_to_id', String(replyTo.id));

        selectedFiles.forEach((file) => {
            formData.append('files[]', file);
        });

        try {
            const res = await axios.post(route('chat.send', activeChannel.id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.success && res.data.message) {
                setMessages((prev) => [...prev, res.data.message]);
                setInputText('');
                setSelectedFiles([]);
                setReplyTo(null);
                scrollToBottom();

                // Refresh vault data if files were attached
                if (selectedFiles.length > 0) {
                    axios.get(route('chat.vault', activeChannel.id)).then((vRes) => setVaultData(vRes.data));
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to deliver message.');
        } finally {
            setIsSending(false);
        }
    };

    // Toggle Reaction
    const handleToggleReaction = async (messageId: number, emoji: string) => {
        try {
            const res = await axios.post(route('chat.react', { messageId }), { emoji });
            if (res.data.reactions) {
                setMessages((prev) =>
                    prev.map((m) => (m.id === messageId ? { ...m, reactions: res.data.reactions } : m))
                );
            }
        } catch {
            toast.error('Unable to record reaction');
        }
    };

    // Toggle Pin Message
    const handleTogglePin = async (messageId: number) => {
        try {
            const res = await axios.post(route('chat.pin', { conversation: activeChannel.id, messageId }));
            if (res.data.success) {
                setPinnedMessage(res.data.pinned);
                toast.success(res.data.pinned ? 'Message pinned to channel top' : 'Message unpinned');
            }
        } catch {
            toast.error('Only department managers or executives can pin messages.');
        }
    };

    // Filter Channels List
    const filteredChannels = channels.filter((c) =>
        c.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
        c.department_name.toLowerCase().includes(channelSearch.toLowerCase())
    );

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
            return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
        }
        if (ext === 'dwg' || ext === 'dxf') {
            return <FileCode className="w-4 h-4 text-indigo-600" />;
        }
        return <FileText className="w-4 h-4 text-[#0066cc]" />;
    };

    return (
        <AuthenticatedLayout
            title="Department Chat & Communications"
            subtitle="Official secure intra-department messaging and shared engineering vault"
            fullHeight
        >
            <Head title={`${activeChannel.name} - Department Chat`} />

            <div className="flex flex-1 min-h-0 h-full w-full bg-white dark:bg-[#121214] overflow-hidden border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm">
                {/* ─────────────────────────────────────────────────────────── */}
                {/* 1. LEFT PANE: Channel Switcher & Department Rooms           */}
                {/* ─────────────────────────────────────────────────────────── */}
                <aside className="w-72 lg:w-80 border-r border-gray-200 dark:border-neutral-800 bg-gray-50/70 dark:bg-[#18181b]/70 flex flex-col shrink-0">
                    {/* Header & Search */}
                    <div className="p-3.5 border-b border-gray-200 dark:border-neutral-800">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#0066cc] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                                    Workspaces
                                </h2>
                            </div>
                            <span className="text-[11px] font-medium text-gray-400 bg-gray-200/60 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                                {channels.length} {channels.length === 1 ? 'room' : 'rooms'}
                            </span>
                        </div>

                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search department rooms..."
                                value={channelSearch}
                                onChange={(e) => setChannelSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] dark:text-white transition"
                            />
                        </div>
                    </div>

                    {/* Channels List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredChannels.map((channel) => {
                            const isActive = channel.id === activeChannel.id;
                            return (
                                <Link
                                    key={channel.id}
                                    href={route('chat.show', channel.id)}
                                    className={`group flex items-start gap-3 p-2.5 rounded-xl transition text-left relative ${
                                        isActive
                                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 text-blue-950 dark:text-blue-100 shadow-xs'
                                            : 'hover:bg-gray-100/80 dark:hover:bg-neutral-800/50 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    <div
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-semibold text-xs transition ${
                                            isActive
                                                ? 'bg-[#0066cc] text-white shadow-sm'
                                                : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-neutral-700 group-hover:border-gray-300'
                                        }`}
                                    >
                                        {channel.is_all_company ? (
                                            <Users className="w-4 h-4" />
                                        ) : (
                                            <Hash className="w-4 h-4" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p
                                                className={`text-xs font-semibold truncate ${
                                                    isActive ? 'text-[#0066cc] dark:text-blue-400' : 'text-gray-900 dark:text-white'
                                                }`}
                                            >
                                                {channel.name}
                                            </p>
                                            {channel.unread_count > 0 && (
                                                <span className="w-4 h-4 rounded-full bg-[#0066cc] text-white text-[10px] font-bold flex items-center justify-center shrink-0 animate-pulse">
                                                    {channel.unread_count}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                            {channel.last_message
                                                ? `${channel.last_message.sender_name}: ${channel.last_message.body}`
                                                : channel.department_name}
                                        </p>

                                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                                            <span>{channel.member_count} staff</span>
                                            {channel.is_read_only && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-amber-600 dark:text-amber-400">Broadcast Only</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </aside>

                {/* ─────────────────────────────────────────────────────────── */}
                {/* 2. CENTER PANE: Active Conversation Stream & Composer       */}
                {/* ─────────────────────────────────────────────────────────── */}
                <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#121214]">
                    {/* Channel Top Bar */}
                    <div className="px-5 py-3 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-[#121214] shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0066cc] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center font-bold text-sm shrink-0">
                                {activeChannel.is_all_company ? <Users className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                                    <span>{activeChannel.name}</span>
                                    {activeChannel.is_all_company && (
                                        <span className="text-[10px] font-medium bg-blue-100 dark:bg-blue-950/60 text-[#0066cc] dark:text-blue-300 px-2 py-0.5 rounded-full">
                                            All Company
                                        </span>
                                    )}
                                </h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-2">
                                    <span>{activeChannel.member_count} members</span>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {onlineUserIds.length > 0 ? `${onlineUserIds.length} online now` : 'Active'}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setIsVaultOpen(!isVaultOpen)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                                    isVaultOpen
                                        ? 'bg-[#0066cc] text-white border-[#0066cc] shadow-sm'
                                        : 'bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-700 hover:bg-gray-100'
                                }`}
                                title="Open Shared Media & Documents Vault"
                            >
                                <FolderArchive className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Shared Vault</span>
                                <span className="text-[10px] opacity-80">
                                    ({(vaultData?.files?.length || 0) + (vaultData?.media?.length || 0)})
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Pinned Announcement Bar (if present) */}
                    {pinnedMessage && (
                        <div className="px-5 py-2 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                                <Pin className="w-3.5 h-3.5 text-[#0066cc] shrink-0 fill-current" />
                                <span className="font-semibold text-[#0066cc] dark:text-blue-400 shrink-0">
                                    Pinned Message:
                                </span>
                                <span className="text-gray-700 dark:text-gray-300 truncate">
                                    {pinnedMessage.body}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-gray-400 text-[11px]">
                                <span>by {pinnedMessage.pinned_by_name}</span>
                                {['HRAdmin', 'SysAdmin', 'Manager'].includes(currentUser.role) && (
                                    <button
                                        onClick={() => handleTogglePin(pinnedMessage.message_id)}
                                        className="text-gray-400 hover:text-red-500 p-0.5 rounded transition"
                                        title="Unpin message"
                                    >
                                        <PinOff className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Messages Scrollable Stream */}
                    <div
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
                    >
                        {loadingMore && (
                            <div className="text-center py-2 text-xs text-gray-400 flex items-center justify-center gap-2">
                                <div className="w-3.5 h-3.5 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
                                <span>Loading older messages...</span>
                            </div>
                        )}

                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 dark:text-gray-500">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0066cc] flex items-center justify-center mb-3">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    Welcome to {activeChannel.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1">
                                    This is the official departmental communication channel. Share site logs, CAD drawings, spreadsheets, or collaborate with colleagues.
                                </p>
                            </div>
                        ) : (
                            messages.map((message) => {
                                const isMine = message.is_mine;
                                const isHovered = hoveredMessageId === message.id;

                                return (
                                    <div
                                        key={message.id}
                                        onMouseEnter={() => setHoveredMessageId(message.id)}
                                        onMouseLeave={() => setHoveredMessageId(null)}
                                        className={`group relative flex gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {/* Colleague Avatar */}
                                        {!isMine && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-medium text-xs flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                                                {message.sender.initials}
                                            </div>
                                        )}

                                        {/* Message Bubble Container */}
                                        <div className={`max-w-[85%] sm:max-w-md lg:max-w-lg flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                            {/* Sender Name & Role */}
                                            {!isMine && (
                                                <div className="flex items-center gap-2 mb-1 px-1">
                                                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-200">
                                                        {message.sender.name}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                        {message.sender.role}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Bubble */}
                                            <div
                                                className={`rounded-2xl px-4 py-2.5 shadow-xs transition-all relative ${
                                                    isMine
                                                        ? 'bg-[#0066cc] text-white rounded-br-xs'
                                                        : 'bg-gray-100/90 dark:bg-neutral-800/90 text-gray-900 dark:text-gray-100 rounded-bl-xs border border-gray-200/60 dark:border-neutral-700/60'
                                                }`}
                                            >
                                                {/* Quoted Reply Snippet */}
                                                {message.reply_to && (
                                                    <div
                                                        className={`mb-2 p-2 rounded-lg text-xs border-l-2 ${
                                                            isMine
                                                                ? 'bg-blue-700/50 border-white/80 text-blue-100'
                                                                : 'bg-white/80 dark:bg-neutral-900/80 border-[#0066cc] text-gray-600 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        <span className="font-semibold block text-[11px]">
                                                            {message.reply_to.sender_name}
                                                        </span>
                                                        <p className="truncate text-[11px] opacity-90">
                                                            {message.reply_to.body_preview}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Message Text Body */}
                                                {message.body && (
                                                    <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                                                        {message.body}
                                                    </p>
                                                )}

                                                {/* Attachments Section */}
                                                {message.attachments && message.attachments.length > 0 && (
                                                    <div className="mt-2 space-y-1.5">
                                                        {message.attachments.map((att) => (
                                                            <div
                                                                key={att.id}
                                                                className={`p-2 rounded-xl flex items-center justify-between gap-3 text-xs border ${
                                                                    isMine
                                                                        ? 'bg-blue-700/40 border-blue-400/30 text-white'
                                                                        : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 text-gray-800 dark:text-gray-200'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    {getFileIcon(att.file_name)}
                                                                    <div className="min-w-0">
                                                                        <p className="font-medium truncate max-w-44" title={att.file_name}>
                                                                            {att.file_name}
                                                                        </p>
                                                                        <span className="text-[10px] opacity-80">
                                                                            {formatBytes(att.file_size)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <a
                                                                    href={att.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`p-1.5 rounded-lg transition shrink-0 ${
                                                                        isMine
                                                                            ? 'hover:bg-blue-600 text-white'
                                                                            : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-[#0066cc]'
                                                                    }`}
                                                                    title="Download file"
                                                                >
                                                                    <Download className="w-3.5 h-3.5" />
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Timestamp & Telegram Read Receipts */}
                                                <div
                                                    className={`flex items-center gap-1.5 justify-end mt-1 text-[10px] select-none ${
                                                        isMine ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'
                                                    }`}
                                                >
                                                    <span>{message.created_at_formatted}</span>

                                                    {/* Telegram Read Receipt Indicators */}
                                                    {isMine && (
                                                        <button
                                                            onClick={() => setReceiptsMessageId(message.id)}
                                                            className="hover:opacity-80 transition flex items-center gap-0.5"
                                                            title={
                                                                message.read_status === 'read'
                                                                    ? `Seen by ${message.seen_count} colleagues (Click to view roster)`
                                                                    : 'Sent (Delivered to department)'
                                                            }
                                                        >
                                                            {message.read_status === 'read' ? (
                                                                <CheckCheck className="w-3.5 h-3.5 text-cyan-300 stroke-[2.5]" />
                                                            ) : (
                                                                <Check className="w-3.5 h-3.5 text-blue-200 stroke-[2]" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Reactions Row below Bubble */}
                                            {message.reactions && message.reactions.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1 px-1">
                                                    {message.reactions.map((r, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleToggleReaction(message.id, r.emoji)}
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all ${
                                                                r.has_reacted
                                                                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-[#0066cc] dark:text-blue-300'
                                                                    : 'bg-gray-100 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            <span>{r.emoji}</span>
                                                            <span className="text-[10px]">{r.count}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Hover Floating Action Bar */}
                                        {isHovered && (
                                            <div
                                                className={`absolute -top-3 z-10 flex items-center gap-1 p-1 bg-white dark:bg-neutral-800 rounded-xl shadow-md border border-gray-200 dark:border-neutral-700 animate-in fade-in duration-100 ${
                                                    isMine ? 'right-2' : 'left-10'
                                                }`}
                                            >
                                                {/* Reply */}
                                                <button
                                                    onClick={() => setReplyTo(message)}
                                                    className="p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
                                                    title="Reply"
                                                >
                                                    <Reply className="w-3.5 h-3.5" />
                                                </button>

                                                {/* Quick Emoji Reactions */}
                                                <div className="flex items-center gap-0.5 px-1 border-x border-gray-100 dark:border-neutral-700">
                                                    {QUICK_EMOJIS.map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleToggleReaction(message.id, emoji)}
                                                            className="text-xs p-1 hover:scale-125 transition-transform"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Pin Message */}
                                                <button
                                                    onClick={() => handleTogglePin(message.id)}
                                                    className="p-1 rounded-lg text-gray-500 hover:text-[#0066cc] hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
                                                    title="Pin to channel"
                                                >
                                                    <Pin className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* ─────────────────────────────────────────────────────────── */}
                    {/* Message Composer & File Attachment Controls                 */}
                    {/* ─────────────────────────────────────────────────────────── */}
                    <div className="p-3 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shrink-0">
                        {/* Replying Banner (if active) */}
                        {replyTo && (
                            <div className="mb-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Reply className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
                                    <span className="font-semibold text-[#0066cc] dark:text-blue-400 shrink-0">
                                        Replying to {replyTo.sender.name}:
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-300 truncate">
                                        {replyTo.body}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setReplyTo(null)}
                                    className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                                    title="Cancel reply"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Selected Files Preview Chips */}
                        {selectedFiles.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-2">
                                {selectedFiles.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 px-2.5 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-xs"
                                    >
                                        <Paperclip className="w-3 h-3 text-[#0066cc]" />
                                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-36">
                                            {file.name}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            ({formatBytes(file.size)})
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                                            className="text-gray-400 hover:text-red-500 transition"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Input Box & Action Row */}
                        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                            {/* Hidden File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
                                    }
                                }}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.png,.jpg,.jpeg,.zip"
                            />

                            {/* Attach File Button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:text-[#0066cc] dark:hover:text-blue-400 hover:bg-gray-100 transition shrink-0"
                                title="Attach documents, CAD drawings, spreadsheets, or media"
                            >
                                <Paperclip className="w-4 h-4" />
                            </button>

                            {/* Text Input */}
                            <div className="flex-1 relative">
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder={
                                        activeChannel.is_read_only && !['HRAdmin', 'SysAdmin', 'Manager'].includes(currentUser.role)
                                            ? 'This channel is broadcast-only for department heads...'
                                            : `Message #${activeChannel.name}... (Press Enter to send)`
                                    }
                                    disabled={activeChannel.is_read_only && !['HRAdmin', 'SysAdmin', 'Manager'].includes(currentUser.role)}
                                    rows={1}
                                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-900 focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] dark:text-white resize-none transition max-h-32 disabled:opacity-50"
                                />
                            </div>

                            {/* Send Button */}
                            <button
                                type="submit"
                                disabled={(!inputText.trim() && selectedFiles.length === 0) || isSending}
                                className="p-2.5 rounded-xl bg-[#0066cc] hover:bg-[#0071e3] text-white font-medium shadow-sm transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
                                title="Send message"
                            >
                                {isSending ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                                )}
                            </button>
                        </form>
                    </div>
                </main>

                {/* ─────────────────────────────────────────────────────────── */}
                {/* 3. RIGHT PANE: Telegram Shared Media & Files Vault Drawer   */}
                {/* ─────────────────────────────────────────────────────────── */}
                <ChatVaultDrawer
                    isOpen={isVaultOpen}
                    onClose={() => setIsVaultOpen(false)}
                    channelName={activeChannel.name}
                    vaultData={vaultData}
                    onlineUserIds={onlineUserIds}
                />
            </div>

            {/* Read Receipts Modal */}
            <ReadReceiptsModal
                isOpen={receiptsMessageId !== null}
                messageId={receiptsMessageId}
                onClose={() => setReceiptsMessageId(null)}
            />
        </AuthenticatedLayout>
    );
}
