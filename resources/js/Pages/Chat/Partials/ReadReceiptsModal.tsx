import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCheck, Clock, Users, X } from 'lucide-react';
import { Avatar } from '@/Components/boardui';

interface Reader {
    user_id: number;
    name: string;
    position: string;
    initials: string;
    read_at: string;
}

interface Props {
    messageId: number | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ReadReceiptsModal({ messageId, isOpen, onClose }: Props) {
    const [readers, setReaders] = useState<Reader[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!isOpen || !messageId) {
            setReaders([]);
            return;
        }

        let isMounted = true;
        setLoading(true);

        axios.get(route('chat.receipts', { messageId }))
            .then((res) => {
                if (isMounted) {
                    setReaders(res.data.readers || []);
                }
            })
            .catch((err) => {
                console.error('Failed to load read receipts', err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, messageId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="w-full max-w-md bg-white dark:bg-[#1a1b1e] rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#0066cc] dark:text-blue-400 flex items-center justify-center">
                            <CheckCheck className="w-4 h-4 text-[#0066cc]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                                Message Read Receipts
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {readers.length} {readers.length === 1 ? 'colleague has' : 'colleagues have'} seen this message
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Roster */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-neutral-800 p-2">
                    {loading ? (
                        <div className="py-8 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <div className="w-6 h-6 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Checking delivery status...</span>
                        </div>
                    ) : readers.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 dark:text-gray-500">
                            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-neutral-700" />
                            <p className="text-xs font-medium">Not yet read by other colleagues</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Double checks ✓✓ will appear as soon as a colleague opens this chat.</p>
                        </div>
                    ) : (
                        readers.map((reader) => (
                            <div
                                key={reader.user_id}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800/60 transition"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium text-xs flex items-center justify-center shrink-0 shadow-sm">
                                        {reader.initials}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {reader.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {reader.position}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                        <CheckCheck className="w-3 h-3" />
                                        {reader.read_at}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-gray-50/80 dark:bg-neutral-900/80 border-t border-gray-100 dark:border-neutral-800 text-center">
                    <button
                        onClick={onClose}
                        className="w-full py-2 px-4 rounded-xl bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
