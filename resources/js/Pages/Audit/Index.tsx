import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Calendar } from '@/Components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/Components/ui/dialog';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/Components/ui/table';
import { 
    ShieldCheck, 
    Search, 
    Filter, 
    Eye, 
    Clock, 
    Activity, 
    Users, 
    Terminal, 
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    FileDiff,
    X
} from 'lucide-react';

interface AuditItem {
    id: number;
    action: string;
    auditable_type: string | null;
    auditable_id: number | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    old_values?: Record<string, any> | null;
    new_values?: Record<string, any> | null;
}

interface Props {
    auditLogs: {
        data: AuditItem[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        action?: string;
        search?: string;
        date_from?: string;
        date_to?: string;
    };
    stats: {
        total_events: number;
        events_today: number;
        unique_operators: number;
        system_modifications: number;
    };
    distinctActions: string[];
}

export default function Index({ auditLogs, filters, stats, distinctActions }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [action, setAction] = useState(filters.action || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [fromOpen, setFromOpen] = useState(false);
    const [toOpen, setToOpen] = useState(false);

    const [selectedLog, setSelectedLog] = useState<AuditItem | null>(null);
    const [diffModalOpen, setDiffModalOpen] = useState(false);

    const handleFilter = (updates: Record<string, string>) => {
        router.get(
            route('audit.index'),
            {
                search,
                action,
                date_from: dateFrom,
                date_to: dateTo,
                ...updates,
            },
            { preserveState: true, replace: true }
        );
    };

    const openDiffInspector = (log: AuditItem) => {
        setSelectedLog(log);
        setDiffModalOpen(true);
    };

    const getActionBadge = (act: string) => {
        if (act.includes('CREATE') || act.includes('CONFIRM')) {
            return <Badge className="bg-[#effcf8] text-[#008254] border border-[#008254]/30 text-[10px]">{act}</Badge>;
        }
        if (act.includes('UPDATE') || act.includes('SETTINGS')) {
            return <Badge className="bg-[#eff8ff] text-[#1570ef] border border-[#1570ef]/30 text-[10px]">{act}</Badge>;
        }
        if (act.includes('DELETE') || act.includes('SEPARATION')) {
            return <Badge className="bg-[#fdf2f2] text-[#de2828] border border-[#de2828]/30 text-[10px]">{act}</Badge>;
        }
        return <Badge variant="outline" className="text-[10px]">{act}</Badge>;
    };

    // Calculate changed keys between old and new state
    const computeChangedKeys = (oldVal: any, newVal: any) => {
        const keys = new Set<string>();
        if (oldVal && typeof oldVal === 'object') {
            Object.keys(oldVal).forEach((k) => keys.add(k));
        }
        if (newVal && typeof newVal === 'object') {
            Object.keys(newVal).forEach((k) => keys.add(k));
        }
        return Array.from(keys);
    };

    const isPhotoField = (key: string) => key === 'profile_photo_path' || key === 'profile_photo_url';
    const photoFileName = (value: any) => {
        if (value === null || value === undefined || value === '') return 'No photo';
        const s = String(value);
        const parts = s.split(/[\\/]/);
        return parts[parts.length - 1] || s;
    };
    const renderAuditValue = (key: string, value: any, action: string, side: 'old' | 'new') => {
        if (!isPhotoField(key)) {
            return <>{value !== null && value !== undefined ? String(value) : '—'}</>;
        }
        if (value === null || value === undefined || value === '') {
            if (side === 'old' && (action.includes('PHOTO_UPDATE') || action.includes('PHOTO_REMOVE'))) return <>No previous photo</>;
            if (side === 'new' && action.includes('PHOTO_REMOVE')) return <>Photo removed</>;
            return <>No photo</>;
        }
        const file = photoFileName(value);
        const src = `/storage/${String(value).replace(/^\/+/, '')}`;
        const label = action.includes('PHOTO_REMOVE') && side === 'old' ? `Previous photo (${file})` : `Profile photo (${file})`;
        return (
            <span className="inline-flex items-center gap-2 max-w-full">
                <img src={src} alt="" className="w-8 h-8 rounded-full object-cover border border-[#d8d9da] shrink-0 bg-white" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                <span className="truncate" title={file}>{label}</span>
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            title="Immutable Security Audit Log & Changes Inspector"
            subtitle="Append-only legal audit trail capturing all employee record adjustments, statutory parameter calibrations, and administrative operations."
        >
            <Head title="Audit Log - Elhadar Engineering HRMS" />

            {/* Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-[#d8d9da] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">Total Audit Records</p>
                            <p className="text-2xl font-bold text-black mt-0.5">{stats.total_events}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#effcf8] text-[#008254] flex items-center justify-center font-bold">
                            <Activity className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#d8d9da] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">Events Logged Today</p>
                            <p className="text-2xl font-bold text-black mt-0.5">{stats.events_today}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#effcf8] text-[#008254] flex items-center justify-center font-bold">
                            <Clock className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#d8d9da] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">Master Record Updates</p>
                            <p className="text-2xl font-bold text-black mt-0.5">{stats.system_modifications}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#eff8ff] text-[#1570ef] flex items-center justify-center font-bold">
                            <FileDiff className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#d8d9da] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">Active Operators</p>
                            <p className="text-2xl font-bold text-black mt-0.5">{stats.unique_operators}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#e8fdac] text-[#00482f] flex items-center justify-center font-bold">
                            <Users className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Card */}
            <Card className="border-[#d8d9da] bg-white mb-6">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                        <div className="relative md:col-span-1">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-[#64666a]" />
                            <Input
                                placeholder="Search by user, IP address, target..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleFilter({ search });
                                }}
                                className="pl-9 bg-[#f7f7f7] border-[#d8d9da] text-xs h-10 rounded-xs"
                            />
                        </div>

                        <div>
                            <Select value={action || '__all__'} onValueChange={(v) => { const next = v === '__all__' ? '' : v; setAction(next); handleFilter({ action: next }); }}>
                                <SelectTrigger className="w-full h-10 rounded-xs border-[#d8d9da] bg-[#f7f7f7] text-xs text-[#3d4045]">
                                    <SelectValue placeholder={`All Audit Actions (${distinctActions.length})`} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Audit Actions ({distinctActions.length})</SelectItem>
                                    {distinctActions.map((act) => (
                                        <SelectItem key={act} value={act}>{act}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Popover open={fromOpen} onOpenChange={setFromOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            'w-full h-10 justify-start text-left font-normal bg-[#f7f7f7] border-[#d8d9da] text-xs rounded-xs hover:bg-[#f7f7f7]',
                                            !dateFrom && 'text-[#64666a]'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-[#64666a]" />
                                        {dateFrom ? format(new Date(`${dateFrom}T00:00:00`), 'PPP') : 'From date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-white" align="start">
                                    <Calendar
                                        mode="single"
                                        captionLayout="dropdown"
                                        selected={dateFrom ? new Date(`${dateFrom}T00:00:00`) : undefined}
                                        onSelect={(d) => {
                                            const next = d ? format(d, 'yyyy-MM-dd') : '';
                                            setDateFrom(next);
                                            handleFilter({ date_from: next });
                                            setFromOpen(false);
                                        }}
                                        autoFocus
                                    />
                                    {dateFrom && (
                                        <div className="p-2 border-t border-[#ebebec]">
                                            <Button type="button" variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setDateFrom(''); handleFilter({ date_from: '' }); setFromOpen(false); }}>
                                                Clear
                                            </Button>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div>
                            <Popover open={toOpen} onOpenChange={setToOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            'w-full h-10 justify-start text-left font-normal bg-[#f7f7f7] border-[#d8d9da] text-xs rounded-xs hover:bg-[#f7f7f7]',
                                            !dateTo && 'text-[#64666a]'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-[#64666a]" />
                                        {dateTo ? format(new Date(`${dateTo}T00:00:00`), 'PPP') : 'To date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-white" align="start">
                                    <Calendar
                                        mode="single"
                                        captionLayout="dropdown"
                                        selected={dateTo ? new Date(`${dateTo}T00:00:00`) : undefined}
                                        onSelect={(d) => {
                                            const next = d ? format(d, 'yyyy-MM-dd') : '';
                                            setDateTo(next);
                                            handleFilter({ date_to: next });
                                            setToOpen(false);
                                        }}
                                        autoFocus
                                    />
                                    {dateTo && (
                                        <div className="p-2 border-t border-[#ebebec]">
                                            <Button type="button" variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setDateTo(''); handleFilter({ date_to: '' }); setToOpen(false); }}>
                                                Clear
                                            </Button>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Logs Table */}
            <Card className="border-[#d8d9da] bg-white">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-[#f7f7f7]">
                                <TableRow>
                                    <TableHead className="text-xs font-bold text-black">Timestamp</TableHead>
                                    <TableHead className="text-xs font-bold text-black">Action</TableHead>
                                    <TableHead className="text-xs font-bold text-black">Operator</TableHead>
                                    <TableHead className="text-xs font-bold text-black">Audited resource</TableHead>
                                    <TableHead className="text-xs font-bold text-black">IP address</TableHead>
                                    <TableHead className="text-xs font-bold text-black text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {auditLogs.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-xs text-[#64666a]">
                                            No audit events match the specified filter criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    auditLogs.data.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-[#f7f7f7]/60">
                                            <TableCell className="text-xs text-[#3d4045] whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                {getActionBadge(log.action)}
                                            </TableCell>
                                            <TableCell className="text-xs font-medium text-black">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-[#008254] text-white flex items-center justify-center text-[10px] font-bold">
                                                        {log.user?.name?.charAt(0) || 'S'}
                                                    </div>
                                                    <span>{log.user?.name || 'System Service'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-[#3d4045]">
                                                {log.auditable_type ? (
                                                    <span className="font-mono text-[11px] bg-[#f7f7f7] px-1.5 py-0.5 rounded-xs border border-[#d8d9da]">
                                                        {log.auditable_type.split('\\').pop()} #{log.auditable_id}
                                                    </span>
                                                ) : (
                                                    <span className="text-[#64666a]">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-[#64666a] font-mono">
                                                {log.ip_address || '127.0.0.1'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openDiffInspector(log)}
                                                    className="h-8 text-xs font-semibold gap-1 border-[#d8d9da] hover:bg-[#effcf8] hover:text-[#008254] rounded-xs"
                                                >
                                                    <Eye className="w-3.5 h-3.5 text-[#008254]" />
                                                    <span>Inspect</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {auditLogs.last_page > 1 && (
                        <div className="p-4 border-t border-[#ebebec] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <span className="text-xs text-[#64666a]">
                                Showing {auditLogs.from} to {auditLogs.to} of {auditLogs.total} events
                            </span>
                            <div className="flex items-center gap-1">
                                {auditLogs.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        size="sm"
                                        variant={link.active ? 'default' : 'outline'}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={`h-8 px-3 text-xs rounded-xs ${
                                            link.active ? 'bg-[#008254] hover:bg-[#006a44] text-white' : 'border-[#d8d9da]'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Interactive Before/After State Diff Inspector Modal (Shadcn Dialog) */}
            <Dialog open={diffModalOpen} onOpenChange={setDiffModalOpen}>
                <DialogContent className="max-w-2xl bg-white border-[#d8d9da] p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-black flex items-center gap-2">
                            <FileDiff className="w-4 h-4 text-[#008254]" />
                            Audit Event #{selectedLog?.id} State Inspector
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#64666a]">
                            Immutable ledger state difference recorded for this action.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4 py-2">
                            {/* Metadata Ribbon */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#f7f7f7] rounded-xs text-xs">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-[#64666a]">Action</p>
                                    <p className="font-semibold text-black mt-0.5">{selectedLog.action}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-[#64666a]">Operator</p>
                                    <p className="font-semibold text-black mt-0.5">{selectedLog.user?.name || 'System'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-[#64666a]">IP Address</p>
                                    <p className="font-mono text-[#64666a] mt-0.5">{selectedLog.ip_address || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-[#64666a]">Recorded At</p>
                                    <p className="text-[#64666a] mt-0.5">{new Date(selectedLog.created_at).toLocaleTimeString()}</p>
                                </div>
                            </div>

                            {/* Diff Comparison Table */}
                            <div className="border border-[#d8d9da] rounded-xs overflow-hidden">
                                <div className="bg-[#f7f7f7] px-3 py-2 border-b border-[#ebebec] text-xs font-bold text-black uppercase tracking-wider flex items-center justify-between">
                                    <span>Field Name</span>
                                    <div className="flex items-center gap-6">
                                        <span className="text-[#de2828]">Prior State</span>
                                        <span className="text-[#008254]">New State</span>
                                    </div>
                                </div>

                                <div className="max-h-72 overflow-y-auto divide-y divide-[#ebebec]">
                                    {computeChangedKeys(selectedLog.old_values, selectedLog.new_values).map((key) => {
                                        const oldV = selectedLog.old_values ? selectedLog.old_values[key] : null;
                                        const newV = selectedLog.new_values ? selectedLog.new_values[key] : null;
                                        const isDifferent = JSON.stringify(oldV) !== JSON.stringify(newV);

                                        return (
                                            <div key={key} className={`p-3 text-xs flex items-center justify-between gap-4 ${isDifferent ? 'bg-[#effcf8]/30' : ''}`}>
                                                <span className="font-mono font-semibold text-black shrink-0">{key}</span>
                                                <div className="flex items-center gap-4 text-right">
                                                    <span className={`font-mono text-[#de2828] bg-[#fdf2f2] px-2 py-0.5 rounded-xs line-through text-[11px] max-w-xs ${isPhotoField(key) ? '' : 'truncate'}`}>
                                                        {renderAuditValue(key, oldV, selectedLog.action, 'old')}
                                                    </span>
                                                    <ArrowRight className="w-3.5 h-3.5 text-[#64666a] shrink-0" />
                                                    <span className={`font-mono text-[#008254] bg-[#effcf8] px-2 py-0.5 rounded-xs font-semibold text-[11px] max-w-xs ${isPhotoField(key) ? '' : 'truncate'}`}>
                                                        {renderAuditValue(key, newV, selectedLog.action, 'new')}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {computeChangedKeys(selectedLog.old_values, selectedLog.new_values).length === 0 && (
                                        <div className="p-6 text-center text-xs text-[#64666a]">
                                            No structured key-value state differences recorded for this event.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="border-t border-[#ebebec] pt-3 mt-4 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setDiffModalOpen(false)}
                            className="text-xs font-semibold border-[#d8d9da] rounded-xs"
                        >
                            Close Inspector
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
