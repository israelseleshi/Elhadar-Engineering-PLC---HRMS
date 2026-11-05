import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/Components/ui/dialog';
import ViewToggle, { useViewMode } from '@/Components/ViewToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/Components/ui/table';
import { 
    Star, 
    Search, 
    Eye, 
    Plus, 
} from 'lucide-react';

interface TrainingItem {
    id: number;
    training_name: string;
    institution: string;
    provider_type?: string;
    start_date?: string;
    end_date?: string;
    certificate_number?: string;
    performance_impact_score: number;
    notes?: string;
    employee: {
        id: number;
        file_no: string;
        full_name: string;
        department?: { name: string };
    };
}

interface StaffOption {
    id: number;
    file_no: string;
    full_name: string;
}

interface Props {
    records: {
        data: TrainingItem[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search?: string;
        impact_score?: string;
    };
    stats: {
        total_certifications: number;
        average_impact_score: number;
        certified_staff_count: number;
    };
    employees: StaffOption[];
}

export default function Index({ records, filters, stats, employees }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [impactScore, setImpactScore] = useState(filters.impact_score || '');
    const [viewMode, setViewMode] = useViewMode('training');
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        employee_id: employees.length > 0 ? String(employees[0].id) : '',
        training_name: '',
        institution: '',
        provider_type: 'Accredited External',
        start_date: '',
        end_date: '',
        certificate_number: '',
        performance_impact_score: '4',
        notes: '',
    });

    const handleFilter = (updates: Record<string, string>) => {
        router.get(
            route('training.index'),
            {
                search,
                impact_score: impactScore,
                ...updates,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('training.store'), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            title="Training & Performance Registry"
            subtitle="Catalog accredited professional certifications, vocational courses, and measurable performance impact scores."
        >
            <Head title="Training Registry - Elhadar Engineering HRMS" />

            {/* Filter and Action Bar */}
            <Card className="border-[#d8d9da] bg-white mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-[#64666a]" />
                                <Input
                                    placeholder="Search course, institution, staff..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleFilter({ search });
                                    }}
                                    className="pl-9 bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                />
                            </div>

                            <Select value={impactScore || '__all__'} onValueChange={(v) => { const next=v==='__all__'?'':v; setImpactScore(next); handleFilter({ impact_score: next }); }}><SelectTrigger className="h-10 rounded-xs border-[#d8d9da] bg-[#f7f7f7] text-xs text-[#3d4045]"><SelectValue placeholder="All Impact Ratings" /></SelectTrigger><SelectContent><SelectItem value="__all__">All Impact Ratings</SelectItem><option value="">All Impact Ratings</option>
                                <SelectItem value="5">Score 5: Exceptional Impact</SelectItem>
                                <SelectItem value="4">Score 4: High Impact</SelectItem>
                                <SelectItem value="3">Score 3: Moderate Impact</SelectItem>
                                <SelectItem value="2">Score 2: Minimal Impact</SelectItem>
                                <SelectItem value="1">Score 1: Low Impact</SelectItem>
                            </SelectContent></Select>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <ViewToggle value={viewMode} onChange={setViewMode} />
                            <Button 
                                onClick={() => setShowModal(true)}
                                className="bg-[#008254] hover:bg-[#006642] text-white text-xs font-bold uppercase rounded-xs h-10 px-4 gap-2 shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                                Log Training Record
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Training Table */}
            <Card className="border-[#d8d9da] bg-white overflow-hidden shadow-sm">
                {viewMode === 'table' ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24">File no</TableHead>
                            <TableHead>Staff name</TableHead>
                            <TableHead>Course / certificate</TableHead>
                            <TableHead>Institution</TableHead>
                            <TableHead className="text-center">Impact score</TableHead>
                            <TableHead>Date / period</TableHead>
                            <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-[#64666a]">
                                    No training certifications logged yet matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            records.data.map((record) => (
                                <TableRow key={record.id} className="hover:bg-[#effcf8]/50">
                                    <TableCell className="font-bold text-[#008254] text-xs">
                                        {record.employee.file_no}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-black text-sm">{record.employee.full_name}</div>
                                        <div className="text-xs text-[#64666a]">{record.employee.department?.name || 'Operations'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-black text-xs">{record.training_name}</div>
                                        {record.certificate_number && (
                                            <div className="text-[11px] text-[#64666a]">Cert #: {record.certificate_number}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-[#3d4045]">
                                        {record.institution}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs bg-[#effcf8] text-[#008254] border border-[#b7ecda] font-bold text-xs">
                                            <Star className="w-3 h-3 fill-[#008254]" />
                                            {record.performance_impact_score} / 5
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-[#64666a]">
                                        {record.end_date || record.start_date || 'Certified'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={route('employees.show', record.employee.id)}>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="border-[#d8d9da] hover:bg-[#effcf8] text-[#008254] font-semibold text-xs h-8 px-2.5 rounded-xs"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1" />
                                                Profile
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                ) : (
                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                        {records.data.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-xs text-[#64666a]">
                                No training certifications logged yet matching your filters.
                            </div>
                        ) : (
                            records.data.map((record) => (
                                <div
                                    key={record.id}
                                    className="rounded-xs border border-[#ebebec] bg-[#f7f7f7] p-4 transition-colors hover:border-[#b7ecda] hover:bg-white"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-black">{record.training_name}</p>
                                            <p className="mt-0.5 text-[11px] font-semibold text-[#008254]">
                                                {record.employee.file_no} · {record.employee.full_name}
                                            </p>
                                            <p className="truncate text-[11px] text-[#64666a]">
                                                {record.employee.department?.name || 'Operations'}
                                            </p>
                                        </div>
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-xs border border-[#b7ecda] bg-[#effcf8] px-2 py-0.5 text-[11px] font-bold text-[#008254]">
                                            <Star className="h-3 w-3 fill-[#008254]" />
                                            {record.performance_impact_score}/5
                                        </span>
                                    </div>

                                    <div className="mt-3 space-y-1 text-[11px] text-[#64666a]">
                                        <p className="truncate">
                                            <span className="font-semibold text-[#3d4045]">Institution:</span> {record.institution}
                                        </p>
                                        {record.certificate_number && (
                                            <p className="truncate">
                                                <span className="font-semibold text-[#3d4045]">Cert #:</span> {record.certificate_number}
                                            </p>
                                        )}
                                        <p>
                                            <span className="font-semibold text-[#3d4045]">Date:</span>{' '}
                                            {record.end_date || record.start_date || 'Certified'}
                                        </p>
                                    </div>

                                    <Link href={route('employees.show', record.employee.id)} className="mt-3 block">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-[#d8d9da] hover:bg-[#effcf8] text-[#008254] font-semibold text-xs h-8 gap-1.5 rounded-xs"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            View Profile
                                        </Button>
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Pagination */}
                {records.last_page > 1 && (
                    <div className="p-4 border-t border-[#ebebec] bg-[#f7f7f7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[#64666a]">
                        <div>
                            Showing <strong>{records.from || 0}</strong> to <strong>{records.to || 0}</strong> of <strong>{records.total}</strong> records
                        </div>
                        <div className="flex gap-1">
                            {records.links.map((link, idx) => (
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

            {/* Log Training Modal (Shadcn Dialog) */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-md bg-white border-[#d8d9da] p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-black flex items-center gap-2">
                            <Plus className="w-4 h-4 text-[#008254]" />
                            Log Certified Training Record
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#64666a]">
                            Register formal vocational, engineering, or safety accreditation for staff.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
                                Employee Candidate <span className="text-[#de2828]">*</span>
                            </label>
                            <Select value={String(data.employee_id)} onValueChange={(v) => setData('employee_id', v)}><SelectTrigger className="w-full h-10 rounded-xs border-[#d8d9da] bg-[#f7f7f7] text-xs text-[#3d4045]"><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((emp) => (<SelectItem key={emp.id} value={String(emp.id)}>{emp.file_no} — {emp.full_name}</SelectItem>))}</SelectContent></Select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
                                Training Course / Certificate Title <span className="text-[#de2828]">*</span>
                            </label>
                            <Input
                                required
                                value={data.training_name}
                                onChange={(e) => setData('training_name', e.target.value)}
                                placeholder="e.g. Structural Concrete Safety Certification"
                                className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-black mb-1">
                                Training Institution / Provider <span className="text-[#de2828]">*</span>
                            </label>
                            <Input
                                required
                                value={data.institution}
                                onChange={(e) => setData('institution', e.target.value)}
                                placeholder="e.g. Ethiopian Institute of Architecture, Building & Construction"
                                className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-black mb-1">
                                    Certificate Number
                                </label>
                                <Input
                                    value={data.certificate_number}
                                    onChange={(e) => setData('certificate_number', e.target.value)}
                                    placeholder="CERT-2025-081"
                                    className="bg-[#f7f7f7] border-[#d8d9da] text-xs h-10"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-black mb-1">
                                    Performance Impact (1-5)
                                </label>
                                <Select value={String(data.performance_impact_score)} onValueChange={(v) => setData('performance_impact_score', v)}><SelectTrigger className="w-full h-10 rounded-xs border-[#d8d9da] bg-[#f7f7f7] text-xs text-[#3d4045]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="5">5 - Transformational</SelectItem>
                                    <SelectItem value="4">4 - High Productivity Gain</SelectItem>
                                    <SelectItem value="3">3 - Moderate Standard</SelectItem>
                                    <SelectItem value="2">2 - Basic Compliance</SelectItem>
                                    <SelectItem value="1">1 - Minimal Impact</SelectItem>
                                </SelectContent></Select>
                            </div>
                        </div>

                        <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-[#ebebec]">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowModal(false)}
                                className="text-xs border-[#d8d9da] rounded-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[#008254] hover:bg-[#006642] text-white text-xs font-bold uppercase rounded-xs"
                            >
                                {processing ? 'Registering...' : 'Register Certificate'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
