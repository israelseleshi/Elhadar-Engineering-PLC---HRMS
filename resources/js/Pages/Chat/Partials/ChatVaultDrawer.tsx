import React, { useState } from 'react';
import {
    Download,
    FileCode,
    FileSpreadsheet,
    FileText,
    FolderArchive,
    Image as ImageIcon,
    Mail,
    MessageSquare,
    Paperclip,
    Phone,
    Search,
    Shield,
    User as UserIcon,
    Users,
    X,
} from 'lucide-react';
import EmployeeAvatar from '@/Components/EmployeeAvatar';

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
    department?: string;
    phone: string;
    email?: string;
    initials: string;
    profile_photo_url?: string | null;
}

interface VaultData {
    media: MediaItem[];
    files: FileItem[];
    members: MemberItem[];
    pinned: any;
}

interface Props {
    channelName: string;
    vaultData: VaultData;
    onlineUserIds: number[];
    isDirect?: boolean;
    colleague?: any;
    currentUser: {
        id: number;
        name: string;
        role: string;
        department_id: number | null;
        position: string;
        initials: string;
    };
    onSelectColleague: (member: MemberItem | any) => void;
}

type TabType = 'files' | 'media' | 'members';

export default function ChatVaultDrawer({
    channelName,
    vaultData,
    onlineUserIds,
    isDirect = false,
    colleague = null,
    currentUser,
    onSelectColleague,
}: Props) {
    const [activeTab, setActiveTab] = useState<TabType>(isDirect ? 'members' : 'files');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

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

    const filteredFiles = (vaultData?.files || []).filter((f) =>
        f.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredMembers = (vaultData?.members || []).filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.department && m.department.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const isColleagueOnline = colleague ? onlineUserIds.includes(colleague.id) : false;

    return (
        <aside className="w-72 lg:w-80 border-l border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#18181b] flex flex-col h-full shrink-0 select-none">
            {/* Panel Header - Permanent, No Close Button */}
            <div className="p-3.5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50/70 dark:bg-neutral-900/50">
                <div className="flex items-center justify-between">
                    <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                            {isDirect ? 'Direct Dossier' : 'Shared Vault & Staff'}
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {channelName}
                        </p>
                    </div>
                    <span className="text-[10px] font-medium text-[#0066cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-900/60">
                        {isDirect ? '1-to-1' : 'Workspace'}
                    </span>
                </div>
            </div>

            {/* Segmented Pill Tabs */}
            <div className="px-3 py-2.5 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#18181b]">
                <div className="flex p-1 bg-gray-100 dark:bg-neutral-800/80 rounded-xl gap-1">
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'files'
                                ? 'bg-white dark:bg-neutral-700 text-[#0066cc] dark:text-blue-400 shadow-xs'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <Paperclip className="w-3.5 h-3.5" />
                        Files ({vaultData?.files?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'media'
                                ? 'bg-white dark:bg-neutral-700 text-[#0066cc] dark:text-blue-400 shadow-xs'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Media ({vaultData?.media?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'members'
                                ? 'bg-white dark:bg-neutral-700 text-[#0066cc] dark:text-blue-400 shadow-xs'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5" />
                        {isDirect ? 'Profile' : `Staff (${vaultData?.members?.length || 0})`}
                    </button>
                </div>

                {/* Search Bar within Vault */}
                {(!isDirect || activeTab !== 'members') && (
                    <div className="mt-2.5 relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={
                                activeTab === 'files'
                                    ? 'Filter documents...'
                                    : activeTab === 'members'
                                    ? 'Find colleague in room...'
                                    : 'Filter photos...'
                            }
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1 text-xs rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-900 focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] dark:text-white transition"
                        />
                    </div>
                )}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-3 divide-y divide-gray-100 dark:divide-neutral-800">
                {/* 1. Files Tab */}
                {activeTab === 'files' && (
                    filteredFiles.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                            <Paperclip className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-neutral-700" />
                            <p className="text-xs font-medium">No documents shared yet</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">PDFs, CAD drawings, and spreadsheets sent here will be vaulted.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 pt-1">
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className="group p-2.5 rounded-xl border border-gray-100 dark:border-neutral-800 hover:border-blue-200 dark:hover:border-blue-900/50 bg-gray-50/60 dark:bg-neutral-900/40 hover:bg-blue-50/30 dark:hover:bg-neutral-800/60 transition flex items-center justify-between gap-2.5"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center shrink-0 shadow-xs">
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
                    (vaultData?.media || []).length === 0 ? (
                        <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-neutral-700" />
                            <p className="text-xs font-medium">No photos or media yet</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Photos uploaded in chat are saved here.</p>
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
                                        <Download className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* 3. Members / Colleague Profile Tab */}
                {activeTab === 'members' && (
                    isDirect && colleague ? (
                        /* Direct Colleague Profile Dossier */
                        <div className="pt-2 space-y-4">
                            <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-neutral-900/50 border border-gray-200/80 dark:border-neutral-800 text-center">
                                <div className="relative inline-block mx-auto mb-2.5">
                                    <EmployeeAvatar
                                        name={colleague.name}
                                        src={colleague.profile_photo_url}
                                        size="lg"
                                        className="shadow-sm"
                                    />
                                    {isColleagueOnline && (
                                        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900" />
                                    )}
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                                    <span>{colleague.name}</span>
                                    {['HRAdmin', 'SysAdmin', 'SuperAdmin'].includes(colleague.role) && (
                                        <Shield className="w-3.5 h-3.5 text-[#0066cc]" />
                                    )}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                    {colleague.position}
                                </p>
                                <span className="inline-block mt-2 text-[10px] font-medium bg-blue-100 dark:bg-blue-950/60 text-[#0066cc] dark:text-blue-300 px-2.5 py-0.5 rounded-full">
                                    {colleague.department}
                                </span>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="p-2.5 rounded-xl border border-gray-100 dark:border-neutral-800 flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div className="min-w-0">
                                        <span className="text-[10px] text-gray-400 block">Phone</span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                                            {colleague.phone || '—'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl border border-gray-100 dark:border-neutral-800 flex items-center gap-3">
                                    <Shield className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div className="min-w-0">
                                        <span className="text-[10px] text-gray-400 block">Role Assignment</span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">
                                            {colleague.role}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-[11px] text-blue-900 dark:text-blue-200">
                                <p className="leading-relaxed">
                                    🔒 Direct conversations and attached engineering files are confidential and end-to-end isolated to you and {colleague.name}.
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Workspace Department Staff List with 1-to-1 Chat Buttons */
                        filteredMembers.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-neutral-700" />
                                <p className="text-xs font-medium">No staff members match search</p>
                            </div>
                        ) : (
                            <div className="space-y-1.5 pt-1">
                                {filteredMembers.map((member) => {
                                    const isOnline = onlineUserIds.includes(member.id);
                                    const isMe = Number(member.id) === Number(currentUser.id);

                                    return (
                                        <div
                                            key={member.id}
                                            className="group flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800/60 transition border border-transparent hover:border-gray-200/60 dark:hover:border-neutral-700/60"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="relative shrink-0">
                                                    <EmployeeAvatar
                                                        name={member.name}
                                                        src={member.profile_photo_url}
                                                        size="sm"
                                                    />
                                                    {isOnline && (
                                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
                                                        <span>{member.name}</span>
                                                        {isMe && (
                                                            <span className="text-[10px] text-gray-400 font-normal">
                                                                (You)
                                                            </span>
                                                        )}
                                                        {['HRAdmin', 'SysAdmin', 'SuperAdmin'].includes(member.role) && (
                                                            <Shield className="w-3 h-3 text-[#0066cc] shrink-0" />
                                                        )}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                        {member.position}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Button: 1-to-1 Direct Chat */}
                                            {!isMe && (
                                                <button
                                                    onClick={() => onSelectColleague(member)}
                                                    className="p-1.5 rounded-lg text-gray-400 group-hover:text-[#0066cc] dark:group-hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition shrink-0"
                                                    title={`Start 1-to-1 chat with ${member.name}`}
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )
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
