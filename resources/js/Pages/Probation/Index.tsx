import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
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
    const [candidateToConfirm, setCandidateToConfirm] = useState<Candidate | null>(null);

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
        setCandidateToConfirm(candidate);
    };

    const executePermanentConfirm = () => {
        if (!candidateToConfirm) return;
        router.post(route('probation.confirm', candidateToConfirm.id), {}, {
            preserveScroll: true,
            onFinish: () => setCandidateToConfirm(null),
        });
    };

    return (
        <AuthenticatedLayout
            title="Statutory Probation Pipeline"
            subtitle="Track 60-working-day evaluation periods and confirm permanent appointments per Ethiopian Labour Proclamation 1156/2019."
        >
            <Head title="Probation Pipeline - Elhadar Engineering HRMS" />

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="border-[#d2d2d7] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e73]">
                                Active Probation
                            </p>
                            <p className="text-2xl font-bold text-black mt-0.5">
                                {stats.total_under_probation}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#f5f5f7] text-[#0066cc] flex items-center justify-center font-bold">
                            <Clock className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#d2d2d7] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e73]">
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

                <Card className="border-[#d2d2d7] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e73]">
                                Confirmed Permanent
                            </p>
                            <p className="text-2xl font-bold text-[#0066cc] mt-0.5">
                                {stats.confirmed_permanent}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#f5f5f7] text-[#0066cc] flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <Card className="border-[#d2d2d7] bg-white mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-[#6e6e73]" />
                            <Input
                                placeholder="Search by name, file no..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleFilter({ search });
                                }}
                                className="pl-9 bg-[#f5f5f7] border-[#d2d2d7] text-xs h-10"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <div className="inline-flex rounded-xs border border-[#d2d2d7] p-1 bg-[#f5f5f7]">
                                <button
                                    onClick={() => {
                                        setStatus('Probation');
                                        handleFilter({ status: 'Probation' });
                                    }}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-colors ${
                                        status === 'Probation'
                                            ? 'bg-white text-[#0066cc] shadow-xs'
                                            : 'text-[#6e6e73] hover:text-black'
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
                                            ? 'bg-white text-[#0066cc] shadow-xs'
                                            : 'text-[#6e6e73] hover:text-black'
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
                                            ? 'bg-white text-[#0066cc] shadow-xs'
                                            : 'text-[#6e6e73] hover:text-black'
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
            <Card className="border-[#d2d2d7] bg-white overflow-hidden shadow-sm">
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
                                <TableCell colSpan={8} className="text-center py-12 text-[#6e6e73]">
                                    No personnel records found for the selected probation filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            candidates.data.map((candidate) => (
                                <TableRow key={candidate.id} className="hover:bg-[#f5f5f7]/50">
                                    <TableCell className="font-bold text-[#0066cc] text-xs">
                                        {candidate.file_no}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-black text-sm">{candidate.full_name}</div>
                                        <div className="text-xs text-[#6e6e73]">{candidate.position}</div>
                                    </TableCell>
                                    <TableCell className="text-xs text-[#424245]">
                                        {candidate.department?.name || 'General Operations'}
                                    </TableCell>
                                    <TableCell className="text-xs text-[#6e6e73]">
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
                                                'bg-[#f5f5f7] text-[#0066cc]'
                                            }`}>
                                                {candidate.is_overdue ? 'Overdue' : `${candidate.days_remaining} Days`}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-[#6e6e73]">â€”</span>
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
                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                            {candidate.status === 'Probation' && (
                                                <Button
                                                    onClick={() => handleConfirm(candidate)}
                                                    size="sm"
                                                    className="bg-[#0066cc] hover:bg-[#0071e3] text-white font-bold text-xs h-8 px-2.5 rounded-xs"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                                    Confirm
                                                </Button>
                                            )}
                                            <Link href={route('employees.show', candidate.id)}>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="border-[#d2d2d7] hover:bg-[#f5f5f7] text-[#0066cc] font-semibold text-xs h-8 px-2.5 rounded-xs"
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
                    <div className="p-4 border-t border-[#e8e8ed] bg-[#f5f5f7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[#6e6e73]">
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
                                            ? 'bg-[#0066cc] text-white border-[#0066cc] font-bold'
                                            : link.url
                                            ? 'bg-white text-[#424245] border-[#d2d2d7] hover:bg-[#f5f5f7]'
                                            : 'bg-white/50 text-[#b1b3b5] border-[#e8e8ed] cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Statutory Permanent Confirmation Dialog */}
            <AlertDialog open={Boolean(candidateToConfirm)} onOpenChange={(open) => !open && setCandidateToConfirm(null)}>
                <AlertDialogContent className="bg-white border-[#d2d2d7]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-black flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-[#0066cc]" />
                            Confirm Permanent Appointment
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-[#6e6e73] space-y-2">
                            <p>
                                Are you sure you want to officially confirm <strong className="text-black">{candidateToConfirm?.full_name} ({candidateToConfirm?.file_no})</strong> as a Permanent Employee?
                            </p>
                            <p className="bg-[#f5f5f7] border border-[#d2d2d7] p-2.5 rounded-sm text-[#0066cc] font-medium text-[11px]">
                                Legal Reference: Ethiopian Labour Proclamation 1156/2019. This converts the probationary tenure to permanent status and seals statutory pension & seniority entitlements.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="text-xs h-9 border-[#d2d2d7] hover:bg-[#f5f5f7]">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executePermanentConfirm}
                            className="text-xs h-9 bg-[#0066cc] hover:bg-[#0071e3] text-white font-bold"
                        >
                            Approve Permanent Appointment
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthenticatedLayout>
    );
}

