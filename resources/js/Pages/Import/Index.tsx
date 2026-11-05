import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Input } from '@/Components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/Components/ui/table';
import { 
    UploadCloud, 
    Download, 
    FileSpreadsheet, 
    CheckCircle2, 
    AlertTriangle, 
    RefreshCw, 
    Users, 
    ShieldCheck, 
    ArrowRight,
    FileText,
    History
} from 'lucide-react';

interface Props {
    stats: {
        total_employees: number;
        permanent_count: number;
        contract_count: number;
        probation_count: number;
    };
    recentImports: {
        id: number;
        action: string;
        created_at: string;
        user?: { name: string };
        ip_address: string;
    }[];
}

interface PreviewSummary {
    total_scanned: number;
    new_count: number;
    update_count: number;
    error_count: number;
}

interface RecordItem {
    row: number;
    file_no: string;
    full_name: string;
    department_name: string;
    position: string;
    work_place: string;
    gender: string;
    basic_salary: number;
    employment_date: string;
    employment_date_ec: string;
    errors?: string[];
}

export default function Index({ stats, recentImports }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [committing, setCommitting] = useState(false);
    const [previewData, setPreviewData] = useState<{
        summary: PreviewSummary;
        new_records: RecordItem[];
        update_records: RecordItem[];
        error_records: RecordItem[];
        all_valid_payload: any[];
    } | null>(null);
    const [activeTab, setActiveTab] = useState<'new' | 'update' | 'errors'>('new');
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadError(null);
            setPreviewData(null);
        }
    };

    const runSimulation = async () => {
        if (!file) return;
        setLoading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch(route('import.preview'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': token || '',
                    'Accept': 'application/json',
                },
                body: formData,
            });

            if (!res.ok) {
                const errJson = await res.json();
                throw new Error(errJson.message || 'Validation failed. Please verify spreadsheet structure.');
            }

            const data = await res.json();
            setPreviewData(data);
            if (data.summary.new_count > 0) setActiveTab('new');
            else if (data.summary.update_count > 0) setActiveTab('update');
            else setActiveTab('errors');
        } catch (err: any) {
            setUploadError(err.message || 'An error occurred while inspecting the spreadsheet.');
        } finally {
            setLoading(false);
        }
    };

    const handleCommit = () => {
        if (!previewData || previewData.all_valid_payload.length === 0) return;
        setCommitting(true);
        router.post(route('import.execute'), {
            records: previewData.all_valid_payload,
        }, {
            onFinish: () => setCommitting(false),
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AuthenticatedLayout
            title="Bulk Excel Import & Reconciliation Center"
            subtitle="Ingest, validate, dry-run simulate, and synchronize staff master spreadsheets against the central database."
        >
            <Head title="Excel Ingestion & Export - Elhadar Engineering HRMS" />

            {/* Top Operational Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-[#d8d9da] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">Active Database Roster</p>
                            <p className="text-2xl font-bold text-black mt-0.5">{stats.total_employees}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#effcf8] text-[#008254] flex items-center justify-center font-bold">
                            <Users className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#d8d9da] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">Permanent Personnel</p>
                            <p className="text-2xl font-bold text-black mt-0.5">{stats.permanent_count}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#effcf8] text-[#008254] flex items-center justify-center font-bold">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#d8d9da] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">Project Contracts</p>
                            <p className="text-2xl font-bold text-black mt-0.5">{stats.contract_count}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#e3faf2] text-[#008254] flex items-center justify-center font-bold">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#d8d9da] bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64666a]">Under Probation</p>
                            <p className="text-2xl font-bold text-black mt-0.5">{stats.probation_count}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xs bg-[#e8fdac] text-[#00482f] flex items-center justify-center font-bold">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Upload & Dry-Run Simulator Card */}
                <Card className="lg:col-span-2 border-[#d8d9da] bg-white min-w-0">
                    <CardHeader className="border-b border-[#ebebec] pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold text-black flex items-center gap-2">
                                    <UploadCloud className="w-4 h-4 text-[#008254]" />
                                    Spreadsheet Ingestion Engine
                                </CardTitle>
                                <p className="text-xs text-[#64666a] mt-0.5">
                                    Upload `.xlsx`, `.xls`, or `.csv` files. Runs a dry-run check before database write.
                                </p>
                            </div>
                            <a href={route('import.template')} download>
                                <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-xs border-[#d8d9da]">
                                    <Download className="w-3.5 h-3.5 text-[#008254]" />
                                    <span>Download Template</span>
                                </Button>
                            </a>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="border-2 border-dashed border-[#d8d9da] hover:border-[#008254] rounded-xs p-6 text-center transition-colors bg-[#f7f7f7]/50">
                            <FileSpreadsheet className="w-10 h-10 text-[#64666a] mx-auto mb-3" />
                            <p className="text-sm font-semibold text-black mb-1">
                                {file ? file.name : 'Select or drop HR Excel Master List here'}
                            </p>
                            <p className="text-xs text-[#64666a] mb-4">
                                Supports multi-sheet Elhadar HR formats. Max file size: 10MB.
                            </p>
                            <label className="inline-block">
                                <Input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#d8d9da] hover:bg-[#effcf8] text-black text-xs font-semibold rounded-xs cursor-pointer shadow-xs transition-colors">
                                    <UploadCloud className="w-3.5 h-3.5 text-[#008254]" />
                                    Choose Spreadsheet File
                                </span>
                            </label>
                        </div>

                        {uploadError && (
                            <div className="mt-4 p-3 bg-[#fdf2f2] border border-[#f8b4b4] rounded-xs text-xs text-[#de2828] flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{uploadError}</span>
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-between pt-4 border-t border-[#ebebec]">
                            <span className="text-xs text-[#64666a]">
                                {file ? `Selected file size: ${(file.size / 1024).toFixed(1)} KB` : 'No file selected yet.'}
                            </span>
                            <Button
                                onClick={runSimulation}
                                disabled={!file || loading}
                                className="bg-[#008254] hover:bg-[#006a44] text-white text-xs font-semibold rounded-xs gap-1.5"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Analyzing Rows...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Run Dry-Run Simulation</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Instant Roster Export Center */}
                <Card className="border-[#d8d9da] bg-white">
                    <CardHeader className="border-b border-[#ebebec] pb-4">
                        <CardTitle className="text-base font-bold text-black flex items-center gap-2">
                            <Download className="w-4 h-4 text-[#008254]" />
                            Roster Export Center
                        </CardTitle>
                        <p className="text-xs text-[#64666a] mt-0.5">
                            Download real-time normalized CSV datasets.
                        </p>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="p-3 border border-[#d8d9da] rounded-xs hover:border-[#008254] transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[#f7f7f7]/40">
                            <div>
                                <p className="text-xs font-bold text-black">Complete Staff Master</p>
                                <p className="text-[11px] text-[#64666a]">All {stats.total_employees} active &amp; historical staff</p>
                            </div>
                            <a href={route('export.employees')} download>
                                <Button size="sm" variant="outline" className="text-xs font-semibold gap-1 rounded-xs">
                                    <Download className="w-3.5 h-3.5 text-[#008254]" /> Export
                                </Button>
                            </a>
                        </div>

                        <div className="p-3 border border-[#d8d9da] rounded-xs hover:border-[#008254] transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[#f7f7f7]/40">
                            <div>
                                <p className="text-xs font-bold text-black">Permanent Personnel</p>
                                <p className="text-[11px] text-[#64666a]">{stats.permanent_count} confirmed permanent profiles</p>
                            </div>
                            <a href={`${route('export.employees')}?status=Permanent`} download>
                                <Button size="sm" variant="outline" className="text-xs font-semibold gap-1 rounded-xs">
                                    <Download className="w-3.5 h-3.5 text-[#008254]" /> Export
                                </Button>
                            </a>
                        </div>

                        <div className="p-3 border border-[#d8d9da] rounded-xs hover:border-[#008254] transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[#f7f7f7]/40">
                            <div>
                                <p className="text-xs font-bold text-black">Regional Project Sites</p>
                                <p className="text-[11px] text-[#64666a]">Site engineers, surveyors &amp; foremen</p>
                            </div>
                            <a href={`${route('export.employees')}?work_place=Project`} download>
                                <Button size="sm" variant="outline" className="text-xs font-semibold gap-1 rounded-xs">
                                    <Download className="w-3.5 h-3.5 text-[#008254]" /> Export
                                </Button>
                            </a>
                        </div>

                        <div className="p-3 border border-[#d8d9da] rounded-xs hover:border-[#008254] transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[#f7f7f7]/40">
                            <div>
                                <p className="text-xs font-bold text-black">Addis Ababa Head Office</p>
                                <p className="text-[11px] text-[#64666a]">Corporate executive &amp; admin staff</p>
                            </div>
                            <a href={`${route('export.employees')}?work_place=Head+Office`} download>
                                <Button size="sm" variant="outline" className="text-xs font-semibold gap-1 rounded-xs">
                                    <Download className="w-3.5 h-3.5 text-[#008254]" /> Export
                                </Button>
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dry-Run Simulation Results Panel */}
            {previewData && (
                <div className="space-y-4 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-[#effcf8] border border-[#008254]/30 rounded-xs">
                        <div>
                            <h3 className="text-base font-bold text-[#00482f] flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-[#008254]" />
                                Simulation Analysis Completed
                            </h3>
                            <p className="text-xs text-[#00482f]/80 mt-0.5">
                                Scanned {previewData.summary.total_scanned} candidate rows. Ready to execute database synchronization.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleCommit}
                                disabled={committing || previewData.all_valid_payload.length === 0}
                                className="bg-[#008254] hover:bg-[#006a44] text-white font-bold text-xs gap-2 rounded-xs shadow-sm"
                            >
                                {committing ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Writing to Database...</span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                        <span>Commit Ingestion ({previewData.all_valid_payload.length} Records)</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Simulation Metrics Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`p-3 border rounded-xs text-left transition-colors ${
                                activeTab === 'new'
                                    ? 'border-[#008254] bg-[#effcf8]'
                                    : 'border-[#d8d9da] bg-white hover:bg-[#f7f7f7]'
                            }`}
                        >
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#008254]">New Personnel (Insert)</p>
                            <p className="text-2xl font-bold text-black mt-0.5">{previewData.summary.new_count}</p>
                        </button>

                        <button
                            onClick={() => setActiveTab('update')}
                            className={`p-3 border rounded-xs text-left transition-colors ${
                                activeTab === 'update'
                                    ? 'border-[#1570ef] bg-[#eff8ff]'
                                    : 'border-[#d8d9da] bg-white hover:bg-[#f7f7f7]'
                            }`}
                        >
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#1570ef]">Existing Profiles (Update)</p>
                            <p className="text-2xl font-bold text-black mt-0.5">{previewData.summary.update_count}</p>
                        </button>

                        <button
                            onClick={() => setActiveTab('errors')}
                            className={`p-3 border rounded-xs text-left transition-colors ${
                                activeTab === 'errors'
                                    ? 'border-[#de2828] bg-[#fdf2f2]'
                                    : 'border-[#d8d9da] bg-white hover:bg-[#f7f7f7]'
                            }`}
                        >
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#de2828]">Validation Warnings</p>
                            <p className="text-2xl font-bold text-black mt-0.5">{previewData.summary.error_count}</p>
                        </button>
                    </div>

                    {/* Simulation Preview Table */}
                    <Card className="border-[#d8d9da] bg-white">
                        <CardHeader className="border-b border-[#ebebec] py-3 px-4">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#64666a]">
                                {activeTab === 'new' && 'Preview: New Personnel Records Ready for Insertion'}
                                {activeTab === 'update' && 'Preview: Existing Profiles to be Synchronized'}
                                {activeTab === 'errors' && 'Validation Exceptions & Rejected Rows'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-[#f7f7f7]">
                                        <TableRow>
                                            <TableHead className="text-xs font-bold text-black">Row</TableHead>
                                            <TableHead className="text-xs font-bold text-black">File no</TableHead>
                                            <TableHead className="text-xs font-bold text-black">Full name</TableHead>
                                            <TableHead className="text-xs font-bold text-black">Department</TableHead>
                                            <TableHead className="text-xs font-bold text-black">Position</TableHead>
                                            <TableHead className="text-xs font-bold text-black">Work site</TableHead>
                                            <TableHead className="text-xs font-bold text-black">Basic salary</TableHead>
                                            <TableHead className="text-xs font-bold text-black">Status / note</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeTab === 'new' && previewData.new_records.map((r) => (
                                            <TableRow key={r.file_no}>
                                                <TableCell className="text-xs text-[#64666a]">#{r.row}</TableCell>
                                                <TableCell className="text-xs font-bold text-black">{r.file_no}</TableCell>
                                                <TableCell className="text-xs font-medium text-black">{r.full_name}</TableCell>
                                                <TableCell className="text-xs text-[#3d4045]">{r.department_name}</TableCell>
                                                <TableCell className="text-xs text-[#3d4045]">{r.position}</TableCell>
                                                <TableCell className="text-xs text-[#3d4045]">{r.work_place}</TableCell>
                                                <TableCell className="text-xs font-semibold text-black">{formatCurrency(r.basic_salary)}</TableCell>
                                                <TableCell>
                                                    <Badge className="bg-[#effcf8] text-[#008254] border border-[#008254]/30 text-[10px]">
                                                        Ready (New)
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {activeTab === 'update' && previewData.update_records.map((r) => (
                                            <TableRow key={r.file_no}>
                                                <TableCell className="text-xs text-[#64666a]">#{r.row}</TableCell>
                                                <TableCell className="text-xs font-bold text-black">{r.file_no}</TableCell>
                                                <TableCell className="text-xs font-medium text-black">{r.full_name}</TableCell>
                                                <TableCell className="text-xs text-[#3d4045]">{r.department_name}</TableCell>
                                                <TableCell className="text-xs text-[#3d4045]">{r.position}</TableCell>
                                                <TableCell className="text-xs text-[#3d4045]">{r.work_place}</TableCell>
                                                <TableCell className="text-xs font-semibold text-black">{formatCurrency(r.basic_salary)}</TableCell>
                                                <TableCell>
                                                    <Badge className="bg-[#eff8ff] text-[#1570ef] border border-[#1570ef]/30 text-[10px]">
                                                        Update Match
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {activeTab === 'errors' && previewData.error_records.map((r) => (
                                            <TableRow key={r.row} className="bg-[#fdf2f2]/30">
                                                <TableCell className="text-xs text-[#64666a]">#{r.row}</TableCell>
                                                <TableCell className="text-xs font-bold text-[#de2828]">{r.file_no || 'MISSING'}</TableCell>
                                                <TableCell className="text-xs font-medium text-[#de2828]">{r.full_name || 'MISSING'}</TableCell>
                                                <TableCell className="text-xs text-[#3d4045]">{r.department_name}</TableCell>
                                                <TableCell className="text-xs text-[#3d4045]">{r.position}</TableCell>
                                                <TableCell className="text-xs text-[#3d4045]">{r.work_place}</TableCell>
                                                <TableCell className="text-xs text-[#3d4045]">{formatCurrency(r.basic_salary)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="destructive" className="text-[10px]">
                                                        {r.errors?.join(', ') || 'Invalid Row'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Historical Import Audit Feed */}
            {recentImports.length > 0 && (
                <Card className="border-[#d8d9da] bg-white">
                    <CardHeader className="border-b border-[#ebebec] pb-3">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#64666a] flex items-center gap-2">
                            <History className="w-3.5 h-3.5 text-[#008254]" />
                            Recent Ingestion &amp; Synchronization Audits
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-[#f7f7f7]">
                                <TableRow>
                                    <TableHead className="text-xs font-bold text-black">Timestamp</TableHead>
                                    <TableHead className="text-xs font-bold text-black">Action</TableHead>
                                    <TableHead className="text-xs font-bold text-black">Operator</TableHead>
                                    <TableHead className="text-xs font-bold text-black">IP address</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentImports.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs text-[#3d4045]">{new Date(log.created_at).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge className="bg-[#effcf8] text-[#008254] border border-[#008254]/30 text-[10px]">
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-black">{log.user?.name || 'System Admin'}</TableCell>
                                        <TableCell className="text-xs text-[#64666a]">{log.ip_address}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </AuthenticatedLayout>
    );
}
