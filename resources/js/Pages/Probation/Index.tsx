import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/Components/ui/table';
import { 
    CalendarClock, 
    CheckCircle2, 
    AlertTriangle, 
    Search, 
    Users, 
    Eye, 
    Building2,
    Clock
} from 'lucide-react';

interface Candidate {
    id: number;
    file_no: string;
    full_name: string;
    position: string;
    employment_type: string;
    employment_date_ec: string;
    probation_end_date?: string;
    probation_status: string;
    status: string;
    days_remaining: number;
    is_urgent: boolean;
    is_overdue: boolean;
    department?: { name: string };
    current_salary?: { basic_salary: number; total_salary: number };
}

interface Props {
    candidates: {
        data: Candidate[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        status?: string;
        search?: string;
    };
    stats: {
        total_under_probation: number;
        urgent_reviews: number;
        confirmed_permanent: number;
    };
}

export default function Index({ candidates, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'Probation');

    const handleFilter = (updates: Record<string, string>) => {
        router.get(
            route('probation.index'),
            {
                status,
                search,
                ...updates,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleConfirm = (candidate: Candidate) => {
        if (confirm(`Confirm ${candidate.full_name} (${candidate.file_no}) as a Permanent employee under Ethiopian Labour Proclamation 1156/2019?`)) {
            router.post(route('probation.confirm', candidate.id));
        }
    };

    return (
        <AuthenticatedLayout
            title="Statutory Probation Pipeline"
            subtitle="Track 60-working-day evaluation periods and confirm permanent appointments per Ethiopian Labour Proclamation 1156/2019."
        >
            <Head title="Probation Pipeline - Elhadar Engineering HRMS" />

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="border-[#d8d9da] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">
                                Active Probation
                            </p>
                            <p className="text-2xl font-bold text-black mt-0.5">
                                {stats.total_under_probation}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#effcf8] text-[#008254] flex items-center justify-center font-bold">
                            <Clock className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#d8d9da] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">
                                Urgent Reviews (&lt;15 Days)
                            </p>
                            <p className="text-2xl font-bold text-[#de2828] mt-0.5">
                                {stats.urgent_reviews}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#fee2e2] text-[#de2828] flex items-center justify-center font-bold">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#d8d9da] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">
                                Confirmed Permanent
                            </p>
                            <p className="text-2xl font-bold text-[#008254] mt-0.5">
                                {stats.confirmed_permanent}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#e3faf2] text-[#008254] flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <Card className="border-[#d8d9da] bg-white mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-[#64666a]" />
                            <Input
                                placeholder="Search by name, file no..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleFilter({ search });
                                }}
                                className="pl-9 bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                            />
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="inline-flex rounded-xs border border-[#d8d9da] p-1 bg-[#f7f7f7]">
                                <button
                                    onClick={() => {
                                        setStatus('Probation');
                                        handleFilter({ status: 'Probation' });
                                    }}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-colors ${
                                        status === 'Probation'
                                            ? 'bg-white text-[#008254] shadow-xs'
                                            : 'text-[#64666a] hover:text-black'
                                    }`}
                                >
                                    Under Review
                                </button>
                                <button
                                    onClick={() => {
                                        setStatus('Passed');
                                        handleFilter({ status: 'Passed' });
                                    }}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-colors ${
                                        status === 'Passed'
                                            ? 'bg-white text-[#008254] shadow-xs'
                                            : 'text-[#64666a] hover:text-black'
                                    }`}
                                >
                                    Confirmed Permanent
                                </button>
                                <button
                                    onClick={() => {
                                        setStatus('All');
                                        handleFilter({ status: 'All' });
                                    }}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-colors ${
                                        status === 'All'
                                            ? 'bg-white text-[#008254] shadow-xs'
                                            : 'text-[#64666a] hover:text-black'
                                    }`}
                                >
                                    All Records
                                </button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Candidate Table */}
            <Card className="border-[#d8d9da] bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24">File no</TableHead>
                            <TableHead>Staff name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Employment date (E.C)</TableHead>
                            <TableHead>Deadline date</TableHead>
                            <TableHead className="text-center">Working days left</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {candidates.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-[#64666a]">
                                    No personnel records found for the selected probation filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            candidates.data.map((candidate) => (
                                <TableRow key={candidate.id} className="hover:bg-[#effcf8]/50">
                                    <TableCell className="font-bold text-[#008254] text-xs">
                                        {candidate.file_no}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-black text-sm">{candidate.full_name}</div>
                                        <div className="text-xs text-[#64666a]">{candidate.position}</div>
                                    </TableCell>
                                    <TableCell className="text-xs text-[#3d4045]">
                                        {candidate.department?.name || 'General Operations'}
                                    </TableCell>
                                    <TableCell className="text-xs text-[#64666a]">
                                        {candidate.employment_date_ec}
                                    </TableCell>
                                    <TableCell className="text-xs font-medium text-black">
                                        {candidate.probation_end_date || '60 days from start'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {candidate.status === 'Probation' ? (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-xs font-bold ${
                                                candidate.is_overdue ? 'bg-[#fee2e2] text-[#de2828]' :
                                                candidate.is_urgent ? 'bg-[#fef9c3] text-[#854d0e]' :
                                                'bg-[#effcf8] text-[#008254]'
                                            }`}>
                                                {candidate.is_overdue ? 'Overdue' : `${candidate.days_remaining} Days`}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-[#64666a]">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={
                                                candidate.probation_status === 'Passed' ? 'mint' :
                                                candidate.is_urgent ? 'destructive' : 'lime'
                                            }
                                        >
                                            {candidate.probation_status === 'Passed' ? 'Confirmed Permanent' : 'Under Probation'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {candidate.status === 'Probation' && (
                                                <Button
                                                    onClick={() => handleConfirm(candidate)}
                                                    size="sm"
                                                    className="bg-[#008254] hover:bg-[#006642] text-white font-bold text-xs h-8 px-2.5 rounded-xs"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                                    Confirm
                                                </Button>
                                            )}
                                            <Link href={route('employees.show', candidate.id)}>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="border-[#d8d9da] hover:bg-[#effcf8] text-[#008254] font-semibold text-xs h-8 px-2.5 rounded-xs"
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                                    Profile
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {candidates.last_page > 1 && (
                    <div className="p-4 border-t border-[#ebebec] bg-[#f7f7f7] flex items-center justify-between text-xs text-[#64666a]">
                        <div>
                            Showing <strong>{candidates.from || 0}</strong> to <strong>{candidates.to || 0}</strong> of <strong>{candidates.total}</strong> candidates
                        </div>
                        <div className="flex gap-1">
                            {candidates.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveState
                                    className={`px-3 py-1.5 rounded-xs text-xs font-medium border transition-colors ${
                                        link.active
                                            ? 'bg-[#008254] text-white border-[#008254] font-bold'
                                            : link.url
                                            ? 'bg-white text-[#3d4045] border-[#d8d9da] hover:bg-[#effcf8]'
                                            : 'bg-white/50 text-[#b1b3b5] border-[#ebebec] cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
