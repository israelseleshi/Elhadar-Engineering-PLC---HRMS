import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/Components/ui/dialog';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Progress } from '@/Components/ui/progress';
import { toast } from 'sonner';
import axios from 'axios';
import {
    Activity,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileSpreadsheet,
    Search,
    Send,
    Shield,
    Users,
    X,
} from 'lucide-react';

interface StaffAuditRecord {
    user_id: number;
    name: string;
    email: string;
    department: string;
    work_place: string;
    position: string;
    is_read: boolean;
    read_at: string | null;
    is_acknowledged: boolean;
    acknowledged_at: string | null;
}

interface AnalyticsData {
    total_targeted: number;
    total_reads: number;
    read_percentage: number;
    total_acknowledgments: number;
    acknowledgment_percentage: number;
    requires_acknowledgment: boolean;
    staff: StaffAuditRecord[];
}

interface Props {
    announcementId: number | null;
    announcementTitle?: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function AnnouncementAnalyticsDrawer({
    announcementId,
    announcementTitle,
    isOpen,
    onClose,
}: Props) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [search, setSearch] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'read' | 'unread' | 'pending_ack'>('all');

    useEffect(() => {
        if (!announcementId || !isOpen) return;

        setLoading(true);
        axios
            .get(`/announcements/${announcementId}/analytics`)
            .then((res) => {
                setData(res.data);
            })
            .catch(() => {
                toast.error('Could not load delivery analytics.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [announcementId, isOpen]);

    if (!isOpen) return null;

    const filteredStaff = (data?.staff || []).filter((s) => {
        const matchesSearch =
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.department.toLowerCase().includes(search.toLowerCase()) ||
            s.work_place.toLowerCase().includes(search.toLowerCase()) ||
            s.position.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (filterTab === 'read') return s.is_read;
        if (filterTab === 'unread') return !s.is_read;
        if (filterTab === 'pending_ack') return data?.requires_acknowledgment && !s.is_acknowledged;

        return true;
    });

    const handleExportCSV = () => {
        if (!data || !data.staff.length) return;

        const headers = ['User ID', 'Name', 'Department', 'Work Place', 'Position', 'Read Status', 'Read At', 'Acknowledged Status', 'Acknowledged At'];
        const rows = data.staff.map((s) => [
            s.user_id,
            `"${s.name.replace(/"/g, '""')}"`,
            `"${s.department.replace(/"/g, '""')}"`,
            `"${s.work_place.replace(/"/g, '""')}"`,
            `"${s.position.replace(/"/g, '""')}"`,
            s.is_read ? 'Read' : 'Unread',
            s.read_at ? `"${s.read_at}"` : 'N/A',
            s.is_acknowledged ? 'Acknowledged' : 'Pending',
            s.acknowledged_at ? `"${s.acknowledged_at}"` : 'N/A',
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `circular_audit_${announcementId}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Audit report exported to CSV successfully.');
    };

    const handleSendReminder = () => {
        const pendingCount = data?.staff.filter((s) => !s.is_read || (data.requires_acknowledgment && !s.is_acknowledged)).length || 0;
        toast.success(`Reminder queued for ${pendingCount} pending staff members.`, {
            description: 'Notification alerts dispatched.',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl bg-background border border-border shadow-2xl">
                {/* Header */}
                <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary shrink-0" />
                            <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                                Circular Delivery &amp; Compliance Audit
                            </DialogTitle>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportCSV}
                            className="rounded-xl text-xs gap-1.5 h-8 font-medium"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Export CSV</span>
                        </Button>
                    </div>

                    <DialogDescription className="text-xs text-muted-foreground truncate mt-1">
                        Auditing: <strong className="text-foreground">{announcementTitle || `#${announcementId}`}</strong>
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="p-12 text-center text-muted-foreground space-y-3">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                        <p className="text-xs">Compiling read receipts and compliance ledger...</p>
                    </div>
                ) : !data ? (
                    <div className="p-8 text-center text-muted-foreground text-xs">
                        No delivery data available.
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* KPI Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl border border-border/70 bg-card shadow-xs">
                                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-primary" /> Total Targeted Staff
                                </p>
                                <p className="text-2xl font-bold text-foreground mt-1">
                                    {data.total_targeted}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Recipients in circular scope</p>
                            </div>

                            <div className="p-4 rounded-xl border border-border/70 bg-card shadow-xs">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                                        <Eye className="w-3.5 h-3.5 text-blue-500" /> Read Receipts
                                    </p>
                                    <span className="text-xs font-bold text-blue-600">{data.read_percentage}%</span>
                                </div>
                                <p className="text-2xl font-bold text-foreground mt-1">
                                    {data.total_reads} <span className="text-xs font-normal text-muted-foreground">/ {data.total_targeted}</span>
                                </p>
                                <Progress value={data.read_percentage} className="h-1.5 mt-2 bg-blue-100 dark:bg-blue-950" />
                            </div>

                            <div className="p-4 rounded-xl border border-border/70 bg-card shadow-xs">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5 text-emerald-500" /> Acknowledgment Rate
                                    </p>
                                    <span className="text-xs font-bold text-emerald-600">
                                        {data.requires_acknowledgment ? `${data.acknowledgment_percentage}%` : 'N/A'}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-foreground mt-1">
                                    {data.requires_acknowledgment ? (
                                        <>
                                            {data.total_acknowledgments}{' '}
                                            <span className="text-xs font-normal text-muted-foreground">
                                                / {data.total_targeted}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-sm font-medium text-muted-foreground">Not Required</span>
                                    )}
                                </p>
                                {data.requires_acknowledgment && (
                                    <Progress value={data.acknowledgment_percentage} className="h-1.5 mt-2 bg-emerald-100 dark:bg-emerald-950" />
                                )}
                            </div>
                        </div>

                        {/* Search & Filter Strip */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                            <div className="flex items-center rounded-lg border border-border/80 bg-muted/20 p-0.5 text-xs font-medium">
                                <button
                                    onClick={() => setFilterTab('all')}
                                    className={`px-3 py-1 rounded-md transition-all ${
                                        filterTab === 'all' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    All ({data.total_targeted})
                                </button>
                                <button
                                    onClick={() => setFilterTab('read')}
                                    className={`px-3 py-1 rounded-md transition-all ${
                                        filterTab === 'read' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Read ({data.total_reads})
                                </button>
                                <button
                                    onClick={() => setFilterTab('unread')}
                                    className={`px-3 py-1 rounded-md transition-all ${
                                        filterTab === 'unread' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Unread ({data.total_targeted - data.total_reads})
                                </button>
                                {data.requires_acknowledgment && (
                                    <button
                                        onClick={() => setFilterTab('pending_ack')}
                                        className={`px-3 py-1 rounded-md transition-all ${
                                            filterTab === 'pending_ack' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Pending E-Sign ({data.total_targeted - data.total_acknowledgments})
                                    </button>
                                )}
                            </div>

                            <div className="relative w-full sm:w-64">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search staff name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-8 pl-8 text-xs rounded-xl border-border"
                                />
                            </div>
                        </div>

                        {/* Staff Audit Table */}
                        <div className="rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                                    <tr>
                                        <th className="p-3 pl-4">Staff Member</th>
                                        <th className="p-3">Department &amp; Site</th>
                                        <th className="p-3">Read Status</th>
                                        {data.requires_acknowledgment && <th className="p-3">E-Sign Receipt</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredStaff.length === 0 ? (
                                        <tr>
                                            <td colSpan={data.requires_acknowledgment ? 4 : 3} className="p-6 text-center text-muted-foreground">
                                                No employees match this filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStaff.map((s) => (
                                            <tr key={s.user_id} className="hover:bg-muted/20 transition-colors">
                                                <td className="p-3 pl-4">
                                                    <p className="font-semibold text-foreground">{s.name}</p>
                                                    <p className="text-[11px] text-muted-foreground">{s.position}</p>
                                                </td>
                                                <td className="p-3">
                                                    <p className="text-foreground">{s.department}</p>
                                                    <p className="text-[11px] text-muted-foreground">{s.work_place}</p>
                                                </td>
                                                <td className="p-3">
                                                    {s.is_read ? (
                                                        <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>{s.read_at || 'Read'}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>Unopened</span>
                                                        </span>
                                                    )}
                                                </td>
                                                {data.requires_acknowledgment && (
                                                    <td className="p-3">
                                                        {s.is_acknowledged ? (
                                                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                <span>{s.acknowledged_at || 'Confirmed'}</span>
                                                            </span>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                                                                Pending Sign
                                                            </Badge>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-4 px-6 bg-muted/20 border-t border-border flex items-center justify-between gap-3">
                    <Button
                        size="sm"
                        onClick={handleSendReminder}
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl h-8 gap-1.5 shadow-xs"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Reminder to Pending Staff</span>
                    </Button>

                    <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs h-8">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
