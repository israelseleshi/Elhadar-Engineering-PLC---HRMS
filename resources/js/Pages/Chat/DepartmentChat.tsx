import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
    MessageSquare,
    MessageSquarePlus,
    Paperclip,
    Pin,
    PinOff,
    Reply,
    Search,
    Shield,
    Sparkles,
    User as UserIcon,
    Users,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import getEchoInstance from '@/echo';
import EmployeeAvatar from '@/Components/EmployeeAvatar';
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
    type?: 'department' | 'direct';
    colleague?: {
        id: number;
        name: string;
        role: string;
        position: string;
        department: string;
        phone: string;
        initials: string;
        profile_photo_url?: string | null;
    } | null;
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
        profile_photo_url?: string | null;
    };
    reply_to: {
        id: number;
        sender_name: string;
        body_preview: string;
    } | null;
    attachments: MessageAttachment[];
    reactions: MessageReaction[];
}

interface SearchedColleague {
    id: number;
    employee_id: number;
    name: string;
    role: string;
    position: string;
    department: string;
    phone: string;
    initials: string;
    profile_photo_url?: string | null;
    has_conversation: boolean;
    conversation_id: number | null;
}

interface Props {
    channels: Channel[];
    directConversations?: Channel[];
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
        profile_photo_url?: string | null;
    };
}

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '👏', '🎉', '💡'];

export default function DepartmentChat({
    channels,
    directConversations = [],
    activeChannel,
    initialMessages,
    hasMoreMessages: initialHasMore,
    vaultData: initialVaultData,
    currentUser,
}: Props) {
    const [currentActiveChannel, setCurrentActiveChannel] = useState<Channel>(activeChannel);
    const [directs, setDirects] = useState<Channel[]>(directConversations || []);
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
    const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
    const [page, setPage] = useState<number>(1);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);

    // Composer state
    const [inputText, setInputText] = useState<string>('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [isSending, setIsSending] = useState<boolean>(false);

    // Initiation / Draft mode for 1-to-1 conversations
    const [initiatingColleague, setInitiatingColleague] = useState<SearchedColleague | null>(null);

    // Vault & Modals state
    const [vaultData, setVaultData] = useState<any>(initialVaultData);
    const [receiptsMessageId, setReceiptsMessageId] = useState<number | null>(null);
    const [pinnedMessage, setPinnedMessage] = useState<any>(initialVaultData?.pinned || null);

    // Search & Presence state
    const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
    const [channelSearch, setChannelSearch] = useState<string>('');
    const [searchedColleagues, setSearchedColleagues] = useState<SearchedColleague[]>([]);
    const [isSearchingColleagues, setIsSearchingColleagues] = useState<boolean>(false);
    const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Keep active channel in sync if prop changes
    useEffect(() => {
        setCurrentActiveChannel(activeChannel);
        setMessages(initialMessages || []);
        setHasMore(initialHasMore);
        setVaultData(initialVaultData);
        setPinnedMessage(initialVaultData?.pinned || null);
        setInitiatingColleague(null);
    }, [activeChannel?.id]);

    // Scroll to bottom on initial load or new message
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        scrollToBottom('auto');
    }, [currentActiveChannel?.id, initiatingColleague]);

    // Live search colleagues when search text is entered
    useEffect(() => {
        const query = channelSearch.trim();
        if (query.length < 2) {
            setSearchedColleagues([]);
            setIsSearchingColleagues(false);
            return;
        }

        setIsSearchingColleagues(true);
        const timer = setTimeout(() => {
            axios
                .get(route('chat.colleagues'), { params: { search: query } })
                .then((res) => {
                    setSearchedColleagues(res.data.colleagues || []);
                })
                .catch(() => {})
                .finally(() => setIsSearchingColleagues(false));
        }, 250);

        return () => clearTimeout(timer);
    }, [channelSearch]);

    // Setup Real-Time WebSockets with Laravel Echo
    useEffect(() => {
        const echo = getEchoInstance();
        if (!currentActiveChannel?.id || !echo || initiatingColleague) return;

        const conversationChannelName = `chat.conversation.${currentActiveChannel.id}`;
        const presenceChannelName = currentActiveChannel.department_id
            ? `presence.department.${currentActiveChannel.department_id}`
            : null;

        // 1. Subscribe to conversation message events
        const convChannel = echo.private(conversationChannelName);

        convChannel.listen('ChatMessageSent', (e: { message: ChatMessage }) => {
            if (e.message) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === e.message.id)) return prev;
                    return [...prev, { ...e.message, is_mine: e.message.sender.id === currentUser.id }];
                });
                scrollToBottom();

                // Auto mark as read if received in active conversation
                axios.post(route('chat.read', currentActiveChannel.id), { message_id: e.message.id }).catch(() => {});
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

        // 2. Subscribe to presence channel if available
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
    }, [currentActiveChannel?.id, currentUser.id, initiatingColleague]);

    // Handle Infinite Scrolling up for older messages
    const handleScroll = () => {
        if (!messagesContainerRef.current || loadingMore || !hasMore || initiatingColleague) return;

        if (messagesContainerRef.current.scrollTop === 0) {
            const currentScrollHeight = messagesContainerRef.current.scrollHeight;
            setLoadingMore(true);

            axios
                .get(route('chat.messages', currentActiveChannel.id), {
                    params: { page: page + 1 },
                })
                .then((res) => {
                    const olderMessages: ChatMessage[] = res.data.messages || [];
                    if (olderMessages.length > 0) {
                        setMessages((prev) => [...olderMessages, ...prev]);
                        setPage((p) => p + 1);
                        setHasMore(res.data.has_more);

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

    // Send Message (Channel or Direct)
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

        // 1. If currently in 1-to-1 initiation mode:
        if (initiatingColleague) {
            try {
                const res = await axios.post(
                    route('chat.direct.start', initiatingColleague.id),
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );

                if (res.data.success && res.data.conversation) {
                    const newConv = res.data.conversation;
                    const newMsg = res.data.message;

                    setDirects((prev) => [newConv, ...prev.filter((d) => d.id !== newConv.id)]);
                    setCurrentActiveChannel(newConv);
                    setMessages([newMsg]);
                    setInitiatingColleague(null);
                    setInputText('');
                    setSelectedFiles([]);
                    setReplyTo(null);
                    scrollToBottom();

                    // Update URL without full reload
                    window.history.pushState(null, '', route('chat.show', newConv.id));
                    toast.success(`Direct chat started with ${initiatingColleague.name}`);

                    // Fetch fresh vault
                    axios.get(route('chat.vault', newConv.id)).then((vRes) => setVaultData(vRes.data));
                }
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to start direct conversation.');
            } finally {
                setIsSending(false);
            }
            return;
        }

        // 2. Normal message in active conversation
        try {
            const res = await axios.post(route('chat.send', currentActiveChannel.id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.success && res.data.message) {
                setMessages((prev) => [...prev, res.data.message]);
                setInputText('');
                setSelectedFiles([]);
                setReplyTo(null);
                scrollToBottom();

                if (selectedFiles.length > 0) {
                    axios.get(route('chat.vault', currentActiveChannel.id)).then((vRes) => setVaultData(vRes.data));
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
            const res = await axios.post(route('chat.pin', { conversation: currentActiveChannel.id, messageId }));
            if (res.data.success) {
                setPinnedMessage(res.data.pinned);
                toast.success(res.data.pinned ? 'Message pinned to channel top' : 'Message unpinned');
            }
        } catch {
            toast.error('Only department managers or executives can pin messages.');
        }
    };

    // Colleague selection from Search or Vault
    const handleSelectColleague = (colleague: SearchedColleague | any) => {
        // If it's myself, do nothing
        if (Number(colleague.id) === Number(currentUser.id)) return;

        // Check if we already have an active direct conversation in state
        const existing = directs.find(
            (d) => Number(d.colleague?.id) === Number(colleague.id) || Number(d.id) === Number(colleague.conversation_id)
        );

        if (existing) {
            setInitiatingColleague(null);
            setChannelSearch('');
            setSearchedColleagues([]);
            if (existing.id === currentActiveChannel.id) {
                return;
            }
            router.visit(route('chat.show', existing.id));
            return;
        }

        // If no existing conversation: activate initiation prompt state in center pane
        setInitiatingColleague({
            id: colleague.id,
            employee_id: colleague.employee_id || 0,
            name: colleague.name,
            role: colleague.role || 'Employee',
            position: colleague.position || 'Staff Member',
            department: colleague.department || 'Staff',
            phone: colleague.phone || '—',
            initials: colleague.initials || colleague.name.slice(0, 2).toUpperCase(),
            profile_photo_url: colleague.profile_photo_url || null,
            has_conversation: false,
            conversation_id: null,
        });
        setChannelSearch('');
        setSearchedColleagues([]);
        setInputText('');
        setSelectedFiles([]);
        setReplyTo(null);
    };

    // Filter Channels & Directs List
    const filteredChannels = channels.filter((c) =>
        c.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
        c.department_name.toLowerCase().includes(channelSearch.toLowerCase())
    );

    const filteredDirects = directs.filter((d) =>
        d.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
        (d.colleague?.position && d.colleague.position.toLowerCase().includes(channelSearch.toLowerCase()))
    );

    const isColleagueOnline = currentActiveChannel.colleague
        ? onlineUserIds.includes(currentActiveChannel.colleague.id)
        : false;

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
            subtitle="Official secure intra-department messaging, 1-to-1 direct chats, and engineering vault"
            fullHeight
        >
            <Head title={`${initiatingColleague ? initiatingColleague.name : currentActiveChannel.name} - Chat`} />

            <div className="flex flex-1 min-h-0 h-full w-full bg-white dark:bg-[#121214] overflow-hidden border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm">
                {/* ─────────────────────────────────────────────────────────── */}
                {/* 1. LEFT PANE: Workspaces, Direct Messages & Search          */}
                {/* ─────────────────────────────────────────────────────────── */}
                <aside className="w-72 lg:w-80 border-r border-gray-200 dark:border-neutral-800 bg-gray-50/70 dark:bg-[#18181b]/70 flex flex-col shrink-0">
                    {/* Header & Search */}
                    <div className="p-3 border-b border-gray-200 dark:border-neutral-800">
                        <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#0066cc] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                                    Communications
                                </h2>
                            </div>
                            <span className="text-[11px] font-medium text-gray-400 bg-gray-200/60 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                                {channels.length + directs.length} active
                            </span>
                        </div>

                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search channels or colleagues..."
                                value={channelSearch}
                                onChange={(e) => setChannelSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] dark:text-white transition"
                            />
                            {channelSearch && (
                                <button
                                    onClick={() => setChannelSearch('')}
                                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Channels & Direct Messages List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-3">
                        {/* ─── Search Results View (when typing in search) ─── */}
                        {channelSearch.trim().length > 0 ? (
                            <div className="space-y-3">
                                {/* Matched Workspaces */}
                                {filteredChannels.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2 mb-1 tracking-wider">
                                            Workspaces
                                        </p>
                                        <div className="space-y-1">
                                            {filteredChannels.map((channel) => (
                                                <Link
                                                    key={channel.id}
                                                    href={route('chat.show', channel.id)}
                                                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                                                >
                                                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#0066cc] flex items-center justify-center shrink-0">
                                                        {channel.is_all_company ? <Users className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <span className="truncate font-medium text-gray-800 dark:text-gray-200">{channel.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Matched Direct Chats */}
                                {filteredDirects.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2 mb-1 tracking-wider">
                                            Existing Direct Chats
                                        </p>
                                        <div className="space-y-1">
                                            {filteredDirects.map((d) => (
                                                <Link
                                                    key={d.id}
                                                    href={route('chat.show', d.id)}
                                                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                                                >
                                                    <EmployeeAvatar
                                                        name={d.name}
                                                        src={d.colleague?.profile_photo_url}
                                                        size="xs"
                                                        className="shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-gray-800 dark:text-gray-200">{d.name}</p>
                                                        <p className="truncate text-[10px] text-gray-400">{d.colleague?.position}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Matched Staff Colleagues to Start 1-to-1 Chat */}
                                <div>
                                    <div className="flex items-center justify-between px-2 mb-1">
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                            Colleagues (Start Chat)
                                        </p>
                                        {isSearchingColleagues && (
                                            <div className="w-3 h-3 border border-[#0066cc] border-t-transparent rounded-full animate-spin" />
                                        )}
                                    </div>

                                    {searchedColleagues.length === 0 && !isSearchingColleagues ? (
                                        <p className="text-[11px] text-gray-400 px-2 py-1">No colleagues found.</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {searchedColleagues.map((colleague) => (
                                                <button
                                                    key={colleague.id}
                                                    onClick={() => handleSelectColleague(colleague)}
                                                    className="w-full text-left flex items-center justify-between p-2 rounded-xl text-xs hover:bg-blue-50/70 dark:hover:bg-neutral-800 transition group border border-transparent hover:border-blue-200/50"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <EmployeeAvatar
                                                            name={colleague.name}
                                                            src={colleague.profile_photo_url}
                                                            size="xs"
                                                            className="shrink-0"
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                                                                {colleague.name}
                                                            </p>
                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                                {colleague.position} • {colleague.department}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-[#0066cc] dark:text-blue-400 shrink-0 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full group-hover:bg-[#0066cc] group-hover:text-white transition">
                                                        {colleague.has_conversation ? 'Open' : '+ Chat'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* ─── Default Sidebar View (Workspaces + Direct Messages) ─── */
                            <>
                                {/* Section A: Workspaces */}
                                <div>
                                    <div className="px-2 mb-1.5 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                            Workspaces
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {channels.length}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        {channels.map((channel) => {
                                            const isActive = !initiatingColleague && channel.id === currentActiveChannel.id;
                                            return (
                                                <Link
                                                    key={channel.id}
                                                    href={route('chat.show', channel.id)}
                                                    className={`group flex items-start gap-2.5 p-2 rounded-xl transition text-left relative ${
                                                        isActive
                                                            ? 'bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 text-blue-950 dark:text-blue-100 shadow-xs'
                                                            : 'hover:bg-gray-100/80 dark:hover:bg-neutral-800/50 text-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-semibold text-xs transition ${
                                                            isActive
                                                                ? 'bg-[#0066cc] text-white shadow-xs'
                                                                : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-neutral-700'
                                                        }`}
                                                    >
                                                        {channel.is_all_company ? (
                                                            <Users className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <Hash className="w-3.5 h-3.5" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className={`text-xs font-semibold truncate ${isActive ? 'text-[#0066cc] dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                                                {channel.name}
                                                            </p>
                                                            {channel.unread_count > 0 && (
                                                                <span className="w-4 h-4 rounded-full bg-[#0066cc] text-white text-[10px] font-bold flex items-center justify-center shrink-0 animate-pulse">
                                                                    {channel.unread_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                            {channel.last_message ? channel.last_message.body : channel.department_name}
                                                        </p>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Section B: Direct Messages */}
                                <div className="pt-2 border-t border-gray-200/60 dark:border-neutral-800">
                                    <div className="px-2 mb-1.5 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                            Direct Messages
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {directs.length}
                                        </span>
                                    </div>

                                    {directs.length === 0 ? (
                                        <div className="px-3 py-3 text-center rounded-xl bg-gray-100/50 dark:bg-neutral-900/30 border border-dashed border-gray-200 dark:border-neutral-800">
                                            <MessageSquarePlus className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                                            <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300">No direct chats yet</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">Click any colleague in the Staff Vault to start chatting.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {directs.map((direct) => {
                                                const isActive = !initiatingColleague && direct.id === currentActiveChannel.id;
                                                const isOnline = direct.colleague ? onlineUserIds.includes(direct.colleague.id) : false;

                                                return (
                                                    <Link
                                                        key={direct.id}
                                                        href={route('chat.show', direct.id)}
                                                        className={`group flex items-start gap-2.5 p-2 rounded-xl transition text-left relative ${
                                                            isActive
                                                                ? 'bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 text-blue-950 dark:text-blue-100 shadow-xs'
                                                                : 'hover:bg-gray-100/80 dark:hover:bg-neutral-800/50 text-gray-700 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        <div className="relative shrink-0">
                                                            <EmployeeAvatar
                                                                name={direct.name}
                                                                src={direct.colleague?.profile_photo_url}
                                                                size="sm"
                                                            />
                                                            {isOnline && (
                                                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900" />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className={`text-xs font-semibold truncate ${isActive ? 'text-[#0066cc] dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                                                    {direct.name}
                                                                </p>
                                                                {direct.unread_count > 0 && (
                                                                    <span className="w-4 h-4 rounded-full bg-[#0066cc] text-white text-[10px] font-bold flex items-center justify-center shrink-0 animate-pulse">
                                                                        {direct.unread_count}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                                {direct.last_message ? direct.last_message.body : direct.description}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </aside>

                {/* ─────────────────────────────────────────────────────────── */}
                {/* 2. CENTER PANE: Conversation Stream & Composer              */}
                {/* ─────────────────────────────────────────────────────────── */}
                <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#121214]">
                    {/* Channel / Colleague Top Bar */}
                    <div className="px-5 py-3 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-[#121214] shrink-0">
                        {initiatingColleague ? (
                            /* Top Bar: 1-to-1 Initiation State */
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3 min-w-0">
                                    <EmployeeAvatar
                                        name={initiatingColleague.name}
                                        src={initiatingColleague.profile_photo_url}
                                        size="sm"
                                        className="shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                                            <span>Chat with {initiatingColleague.name}</span>
                                            {['HRAdmin', 'SysAdmin', 'SuperAdmin'].includes(initiatingColleague.role) && (
                                                <Shield className="w-3.5 h-3.5 text-[#0066cc]" />
                                            )}
                                        </h1>
                                        <p className="text-xs text-[#0066cc] dark:text-blue-400 truncate font-medium">
                                            {initiatingColleague.position} • {initiatingColleague.department}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setInitiatingColleague(null)}
                                    className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition flex items-center gap-1 shrink-0"
                                    title="Cancel and return to channel"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Cancel</span>
                                </button>
                            </div>
                        ) : (
                            /* Top Bar: Standard Active Channel / Active Direct Chat */
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3 min-w-0">
                                    {currentActiveChannel.type === 'direct' ? (
                                        <div className="relative shrink-0">
                                            <EmployeeAvatar
                                                name={currentActiveChannel.name}
                                                src={currentActiveChannel.colleague?.profile_photo_url}
                                                size="sm"
                                            />
                                            {isColleagueOnline && (
                                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900" />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0066cc] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center font-bold text-sm shrink-0">
                                            {currentActiveChannel.is_all_company ? <Users className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                                            <span>{currentActiveChannel.name}</span>
                                            {currentActiveChannel.type === 'direct' ? (
                                                <span className="text-[10px] font-medium bg-blue-100 dark:bg-blue-950/60 text-[#0066cc] dark:text-blue-300 px-2 py-0.5 rounded-full">
                                                    Direct 1-on-1
                                                </span>
                                            ) : currentActiveChannel.is_all_company && (
                                                <span className="text-[10px] font-medium bg-blue-100 dark:bg-blue-950/60 text-[#0066cc] dark:text-blue-300 px-2 py-0.5 rounded-full">
                                                    All Company
                                                </span>
                                            )}
                                        </h1>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-2">
                                            {currentActiveChannel.type === 'direct' ? (
                                                <>
                                                    <span>{currentActiveChannel.colleague?.position || 'Colleague'}</span>
                                                    <span>•</span>
                                                    <span className={isColleagueOnline ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-400'}>
                                                        {isColleagueOnline ? 'Online now' : currentActiveChannel.colleague?.department || 'Staff'}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>{currentActiveChannel.member_count} members</span>
                                                    <span>•</span>
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        {onlineUserIds.length > 0 ? `${onlineUserIds.length} online now` : 'Active'}
                                                    </span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pinned Announcement Bar (if present) */}
                    {pinnedMessage && !initiatingColleague && (
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

                        {/* ─── Initiation View (if user clicked colleague who has not conversed yet) ─── */}
                        {initiatingColleague ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <EmployeeAvatar
                                    name={initiatingColleague.name}
                                    src={initiatingColleague.profile_photo_url}
                                    size="hero"
                                    className="mb-3 shadow-lg ring-4 ring-blue-50 dark:ring-blue-950/40"
                                />
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    Start a conversation with {initiatingColleague.name}
                                </h3>
                                <p className="text-xs text-[#0066cc] dark:text-blue-400 font-semibold mt-1">
                                    {initiatingColleague.position} • {initiatingColleague.department}
                                </p>

                                <div className="max-w-md mt-5 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 text-xs text-gray-700 dark:text-gray-300 space-y-2">
                                    <p className="font-medium flex items-center justify-center gap-1.5 text-blue-950 dark:text-blue-200">
                                        <Sparkles className="w-4 h-4 text-[#0066cc]" />
                                        <span>No previous messages found</span>
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                        Send a message below to begin this private 1-on-1 direct conversation. Files, CAD drawings, and documents sent here will be confidential between the two of you.
                                    </p>
                                </div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 dark:text-gray-500">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0066cc] flex items-center justify-center mb-3">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    Welcome to {currentActiveChannel.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1">
                                    {currentActiveChannel.type === 'direct'
                                        ? 'This is the start of your direct messaging stream. Send messages and share engineering files.'
                                        : 'This is the official departmental communication channel. Share site logs, CAD drawings, spreadsheets, or collaborate with colleagues.'}
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
                                        {!isMine && (
                                            <EmployeeAvatar
                                                name={message.sender.name}
                                                src={message.sender.profile_photo_url}
                                                size="sm"
                                                className="mt-0.5 shrink-0"
                                            />
                                        )}

                                        <div className={`max-w-[85%] sm:max-w-md lg:max-w-lg flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
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

                                            <div
                                                className={`rounded-2xl px-4 py-2.5 shadow-xs transition-all relative ${
                                                    isMine
                                                        ? 'bg-[#0066cc] text-white rounded-br-xs'
                                                        : 'bg-gray-100/90 dark:bg-neutral-800/90 text-gray-900 dark:text-gray-100 rounded-bl-xs border border-gray-200/60 dark:border-neutral-700/60'
                                                }`}
                                            >
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

                                                {message.body && (
                                                    <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                                                        {message.body}
                                                    </p>
                                                )}

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
                                                                        <p className="truncate font-medium">{att.file_name}</p>
                                                                        <span className="text-[10px] opacity-80">{formatBytes(att.file_size)}</span>
                                                                    </div>
                                                                </div>
                                                                <a
                                                                    href={att.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1 rounded-lg hover:bg-black/10 transition shrink-0"
                                                                >
                                                                    <Download className="w-3.5 h-3.5" />
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Timestamp & Telegram Checkmarks */}
                                                <div className={`flex items-center gap-1.5 mt-1 text-[10px] ${isMine ? 'justify-end text-blue-100' : 'justify-start text-gray-400'}`}>
                                                    <span>{message.created_at_formatted}</span>
                                                    {isMine && message.read_status && (
                                                        <button
                                                            onClick={() => setReceiptsMessageId(message.id)}
                                                            className="hover:scale-110 transition flex items-center gap-0.5"
                                                            title={message.read_status === 'read' ? 'Seen by colleagues' : 'Delivered'}
                                                        >
                                                            {message.read_status === 'read' ? (
                                                                <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                                                            ) : (
                                                                <Check className="w-3.5 h-3.5 text-blue-200/70" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Reactions Display */}
                                            {message.reactions && message.reactions.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {message.reactions.map((r) => (
                                                        <button
                                                            key={r.emoji}
                                                            onClick={() => handleToggleReaction(message.id, r.emoji)}
                                                            className={`px-2 py-0.5 text-xs rounded-full border transition flex items-center gap-1 ${
                                                                r.has_reacted
                                                                    ? 'bg-blue-50 border-[#0066cc] text-[#0066cc] dark:bg-blue-950/60'
                                                                    : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600'
                                                            }`}
                                                        >
                                                            <span>{r.emoji}</span>
                                                            <span className="text-[10px] font-bold">{r.count}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Hover Actions: Reply, Quick Emojis, Pin */}
                                        {isHovered && (
                                            <div className={`absolute top-0 flex items-center gap-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-1 shadow-md z-10 ${isMine ? 'right-full mr-2' : 'left-full ml-2'}`}>
                                                <button
                                                    onClick={() => setReplyTo(message)}
                                                    className="p-1 rounded-lg text-gray-500 hover:text-[#0066cc] hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
                                                    title="Reply"
                                                >
                                                    <Reply className="w-3.5 h-3.5" />
                                                </button>

                                                <div className="flex items-center border-l border-gray-200 dark:border-neutral-700 pl-1 ml-0.5">
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

                                                <button
                                                    onClick={() => handleTogglePin(message.id)}
                                                    className="p-1 rounded-lg text-gray-500 hover:text-[#0066cc] hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
                                                    title="Pin message"
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
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

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

                        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
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

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:text-[#0066cc] dark:hover:text-blue-400 hover:bg-gray-100 transition shrink-0"
                                title="Attach documents, CAD drawings, spreadsheets, or media"
                            >
                                <Paperclip className="w-4 h-4" />
                            </button>

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
                                        initiatingColleague
                                            ? `Message ${initiatingColleague.name}... (Press Enter to start chat)`
                                            : currentActiveChannel.is_read_only && !['HRAdmin', 'SysAdmin', 'Manager'].includes(currentUser.role)
                                            ? 'This channel is broadcast-only for department heads...'
                                            : currentActiveChannel.type === 'direct'
                                            ? `Message ${currentActiveChannel.name}... (Press Enter to send)`
                                            : `Message #${currentActiveChannel.name}... (Press Enter to send)`
                                    }
                                    disabled={!initiatingColleague && currentActiveChannel.is_read_only && !['HRAdmin', 'SysAdmin', 'Manager'].includes(currentUser.role)}
                                    rows={1}
                                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-900 focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] dark:text-white resize-none transition max-h-32 disabled:opacity-50"
                                />
                            </div>

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
                {/* 3. RIGHT PANE: Permanent Shared Media & Files Vault         */}
                {/* ─────────────────────────────────────────────────────────── */}
                <ChatVaultDrawer
                    channelName={initiatingColleague ? initiatingColleague.name : currentActiveChannel.name}
                    vaultData={initiatingColleague ? { media: [], files: [], members: [], pinned: null } : vaultData}
                    onlineUserIds={onlineUserIds}
                    isDirect={initiatingColleague ? true : currentActiveChannel.type === 'direct'}
                    colleague={initiatingColleague || currentActiveChannel.colleague}
                    currentUser={currentUser}
                    onSelectColleague={handleSelectColleague}
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
