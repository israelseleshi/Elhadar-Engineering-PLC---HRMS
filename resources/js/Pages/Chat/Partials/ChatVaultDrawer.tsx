import React, { useState } from 'react';
import {
    Download,
    ExternalLink,
    FileCode,
    FileSpreadsheet,
    FileText,
    FolderArchive,
    Image as ImageIcon,
    Link as LinkIcon,
    Paperclip,
    Search,
    Shield,
    Users,
    X,
} from 'lucide-react';
import { Badge, Button, IconButton } from '@/Components/boardui';

interface MediaItem {
    id: number;
    file_name: string;
    file_size: number;
    url: string;
    created_at: string;
}

interface FileItem {
    id: number;
    file_name: string;
    file_size: number;
    mime_type: string;
    url: string;
    created_at: string;
}

interface MemberItem {
    id: number;
    name: string;
    role: string;
    position: string;
    phone: string;
    initials: string;
}

interface VaultData {
    media: MediaItem[];
    files: FileItem[];
    members: MemberItem[];
    pinned: any;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    channelName: string;
    vaultData: VaultData;
    onlineUserIds: number[];
}

type TabType = 'media' | 'files' | 'members';

export default function ChatVaultDrawer({ isOpen, onClose, channelName, vaultData, onlineUserIds }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('files');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    if (!isOpen) return null;

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
            return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
        }
        if (ext === 'dwg' || ext === 'dxf') {
            return <FileCode className="w-5 h-5 text-indigo-600" />;
        }
        if (ext === 'zip' || ext === 'rar' || ext === '7z') {
            return <FolderArchive className="w-5 h-5 text-amber-600" />;
        }
        return <FileText className="w-5 h-5 text-[#0066cc]" />;
    };

    const filteredFiles = (vaultData.files || []).filter((f) =>
        f.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredMembers = (vaultData.members || []).filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.position.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <aside className="w-80 md:w-96 border-l border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#18181b] flex flex-col h-full shrink-0 shadow-lg z-20 transition-all duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gray-50/50 dark:bg-neutral-900/50">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        Shared Vault & Roster
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {channelName}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                    title="Close Vault"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Segmented Pill Tabs */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#18181b]">
                <div className="flex p-1 bg-gray-100 dark:bg-neutral-800/80 rounded-xl gap-1">
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'files'
                                ? 'bg-white dark:bg-neutral-700 text-[#0066cc] dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <Paperclip className="w-3.5 h-3.5" />
                        Files ({vaultData.files?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'media'
                                ? 'bg-white dark:bg-neutral-700 text-[#0066cc] dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Media ({vaultData.media?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'members'
                                ? 'bg-white dark:bg-neutral-700 text-[#0066cc] dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5" />
                        Staff ({vaultData.members?.length || 0})
                    </button>
                </div>

                {/* Search Bar within Vault */}
                <div className="mt-3 relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={
                            activeTab === 'files'
                                ? 'Search shared files...'
                                : activeTab === 'members'
                                ? 'Search staff by name/role...'
                                : 'Filter media...'
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-900 focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] dark:text-white transition"
                    />
                </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-3 divide-y divide-gray-100 dark:divide-neutral-800">
                {/* 1. Files Tab */}
                {activeTab === 'files' && (
                    filteredFiles.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                            <Paperclip className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-neutral-700" />
                            <p className="text-xs font-medium">No shared documents yet</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Attach drawings, spreadsheets, or PDFs in chat.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 pt-1">
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className="group p-2.5 rounded-xl border border-gray-100 dark:border-neutral-800 hover:border-blue-200 dark:hover:border-blue-900/50 bg-gray-50/60 dark:bg-neutral-900/40 hover:bg-blue-50/30 dark:hover:bg-neutral-800/60 transition flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-9 h-9 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center shrink-0 shadow-xs">
                                            {getFileIcon(file.file_name)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate" title={file.file_name}>
                                                {file.file_name}
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                                                <span>{formatBytes(file.file_size)}</span>
                                                <span>•</span>
                                                <span>{file.created_at}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#0066cc] dark:hover:text-blue-400 hover:bg-white dark:hover:bg-neutral-700 transition shrink-0"
                                        title="Download document"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* 2. Media Tab */}
                {activeTab === 'media' && (
                    (vaultData.media || []).length === 0 ? (
                        <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-neutral-700" />
                            <p className="text-xs font-medium">No media shared yet</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Images and photos posted to this channel will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                            {vaultData.media.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setPreviewImage(item.url)}
                                    className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-800 cursor-pointer border border-gray-200 dark:border-neutral-700 hover:shadow-md transition"
                                >
                                    <img
                                        src={item.url}
                                        alt={item.file_name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Download className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* 3. Members Tab */}
                {activeTab === 'members' && (
                    filteredMembers.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-neutral-700" />
                            <p className="text-xs font-medium">No members match search</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 pt-1">
                            {filteredMembers.map((member) => {
                                const isOnline = onlineUserIds.includes(member.id);
                                return (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800/60 transition"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-medium text-xs flex items-center justify-center shrink-0">
                                                    {member.initials}
                                                </div>
                                                {isOnline && (
                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
                                                    <span>{member.name}</span>
                                                    {['HRAdmin', 'SysAdmin', 'SuperAdmin'].includes(member.role) && (
                                                        <span title="Administrator">
                                                            <Shield className="w-3 h-3 text-[#0066cc] shrink-0" />
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                    {member.position}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                                                isOnline
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`}>
                                                {isOnline ? 'Online' : member.phone || 'Staff'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>

            {/* Image Lightbox Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-h-[85vh] rounded-xl shadow-2xl object-contain"
                        />
                    </div>
                </div>
            )}
        </aside>
    );
}
