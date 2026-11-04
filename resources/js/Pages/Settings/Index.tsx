import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
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
import { toast } from 'sonner';
import { 
    Scale, 
    ShieldCheck, 
    Save, 
    CheckCircle2, 
    FileText, 
    Calendar, 
    Coins, 
    Building2, 
    Info, 
    RefreshCw 
} from 'lucide-react';

interface SettingMeta {
    key: string;
    value: string;
    data_type: string;
    article: string;
    description: string;
    unit: string;
}

interface Props {
    groupedSettings: Record<string, SettingMeta[]>;
}

export default function Index({ groupedSettings }: Props) {
    const [formData, setFormData] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        Object.values(groupedSettings).forEach((items) => {
            items.forEach((item) => {
                initial[item.key] = item.value;
            });
        });
        return initial;
    });

    const [saving, setSaving] = useState(false);
    const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

    const handleChange = (key: string, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setConfirmSaveOpen(true);
    };

    const executeSave = () => {
        setSaving(true);
        setConfirmSaveOpen(false);

        router.put(route('settings.update'), {
            settings: formData,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSaving(false);
                toast.success('Statutory parameters successfully updated and archived to audit log.');
            },
            onError: () => {
                setSaving(false);
                toast.error('Failed to update statutory parameters.');
            },
        });
    };

    const getCategoryIcon = (category: string) => {
        if (category.includes('Pension')) return Coins;
        if (category.includes('Labour')) return Scale;
        return Building2;
    };

    return (
        <AuthenticatedLayout
            title="System Settings & Statutory Proclamation Registry"
            subtitle="Configure federal labor standards, pension rates, probation ceilings, and severance legal formulas governing Elhadar Engineering PLC."
        >
            <Head title="Statutory Settings - Elhadar Engineering HRMS" />

            {/* Statutory Legal Disclaimer Banner */}
            <div className="p-4 bg-[#effcf8] border border-[#008254]/30 rounded-xs mb-6 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#008254] shrink-0 mt-0.5" />
                <div className="text-xs">
                    <p className="font-bold text-[#00482f]">
                        Legal Compliance Binding Notice
                    </p>
                    <p className="text-[#00482f]/80 mt-0.5 leading-relaxed">
                        These parameters directly calibrate calculation engines across all personnel profiles, including POESSA pension withholding, working-day probation countdowns, and severance payouts. Updates are immutably archived to the audit log.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {Object.entries(groupedSettings).map(([category, items]) => {
                    const CategoryIcon = getCategoryIcon(category);
                    return (
                        <Card key={category} className="border-[#d8d9da] bg-white">
                            <CardHeader className="border-b border-[#ebebec] py-4 px-6 bg-[#f7f7f7]/40">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xs bg-[#effcf8] text-[#008254] flex items-center justify-center">
                                            <CategoryIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-bold text-black">
                                                {category}
                                            </CardTitle>
                                            <p className="text-[11px] text-[#64666a]">
                                                Statutory federal mandates &amp; directives
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[11px] font-semibold border-[#d8d9da]">
                                        {items.length} Parameters
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {items.map((item) => (
                                        <div
                                            key={item.key}
                                            className="p-4 border border-[#d8d9da] rounded-xs bg-white hover:border-[#008254] transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-black uppercase tracking-wider">
                                                    {item.key.replace(/_/g, ' ')}
                                                </label>
                                                <Badge className="bg-[#effcf8] text-[#008254] border border-[#008254]/30 text-[10px] font-semibold">
                                                    {item.article}
                                                </Badge>
                                            </div>

                                            <p className="text-xs text-[#64666a] mb-3 leading-relaxed">
                                                {item.description}
                                            </p>

                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <Input
                                                        type="text"
                                                        value={formData[item.key] ?? ''}
                                                        onChange={(e) => handleChange(item.key, e.target.value)}
                                                        className="h-10 text-sm font-semibold border-[#d8d9da] focus:border-[#008254] focus:ring-0 rounded-xs pr-16 bg-[#f7f7f7]"
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-xs font-bold text-[#64666a]">
                                                        {item.unit}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Bottom Sticky Action Bar */}
                <div className="sticky bottom-4 z-20 p-4 bg-white border border-[#d8d9da] shadow-lg rounded-xs flex items-center justify-between">
                    <span className="text-xs text-[#64666a]">
                        Review parameters carefully before committing changes. All modifications create an immutable audit record.
                    </span>

                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-[#008254] hover:bg-[#006a44] text-white font-bold text-xs gap-2 rounded-xs px-6 shadow-sm"
                    >
                        {saving ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Updating Parameters...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Statutory Parameters</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {/* Save Statutory Parameters Confirmation Dialog */}
            <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
                <AlertDialogContent className="bg-white border-[#d8d9da]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-black flex items-center gap-2">
                            <Scale className="w-5 h-5 text-[#008254]" />
                            Update Global Statutory Parameters?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-[#64666a] space-y-2">
                            <p>
                                Are you sure you want to commit these statutory adjustments to the database?
                            </p>
                            <p className="bg-[#effcf8] border border-[#b7ecda] p-2.5 rounded-sm text-[#008254] font-medium text-[11px]">
                                These parameters directly calibrate payroll engine withholding (POESSA pension), working-day probation countdowns, and severance formulas across all personnel dossiers.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="text-xs h-9 border-[#d8d9da] hover:bg-[#f7f7f7]">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeSave}
                            className="text-xs h-9 bg-[#008254] hover:bg-[#006a44] text-white font-bold"
                        >
                            Confirm &amp; Apply Parameters
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthenticatedLayout>
    );
}
