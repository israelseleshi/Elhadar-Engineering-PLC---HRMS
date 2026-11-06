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
            <div className="p-4 bg-muted/40 border border-border rounded-xl mb-6 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                    <p className="font-bold text-foreground">
                        Legal Compliance Binding Notice
                    </p>
                    <p className="text-foreground/80 mt-0.5 leading-relaxed">
                        These parameters directly calibrate calculation engines across all personnel profiles, including POESSA pension withholding, working-day probation countdowns, and severance payouts. Updates are immutably archived to the audit log.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {Object.entries(groupedSettings).map(([category, items]) => {
                    const CategoryIcon = getCategoryIcon(category);
                    return (
                        <Card key={category} className="border-border bg-card shadow-xs">
                            <CardHeader className="border-b border-border/60 py-4 px-4 sm:px-6 bg-muted/30">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-muted text-primary flex items-center justify-center">
                                            <CategoryIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-bold text-foreground">
                                                {category}
                                            </CardTitle>
                                            <p className="text-[11px] text-muted-foreground">
                                                Statutory federal mandates &amp; directives
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[11px] font-semibold border-border">
                                        {items.length} Parameters
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 sm:p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    {items.map((item) => (
                                        <div
                                            key={item.key}
                                            className="p-4 border border-border rounded-xl bg-muted/20 hover:border-border/80 transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                                                    {item.key.replace(/_/g, ' ')}
                                                </label>
                                                <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold">
                                                    {item.article}
                                                </Badge>
                                            </div>

                                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                                {item.description}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="relative flex-1">
                                                    <Input
                                                        type="text"
                                                        value={formData[item.key] ?? ''}
                                                        onChange={(e) => handleChange(item.key, e.target.value)}
                                                        className="h-10 text-sm font-semibold border-input focus:border-primary focus:ring-0 rounded-xl pr-16 bg-background text-foreground"
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">
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
                <div className="sticky bottom-2 sm:bottom-4 z-20 p-3 sm:p-4 bg-card/95 backdrop-blur border border-border shadow-lg rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                        Review parameters carefully before committing changes. All modifications create an immutable audit record.
                    </span>

                    <Button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs font-bold text-xs gap-2 rounded-xl px-6 shadow-sm"
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
                <AlertDialogContent className="border-border bg-card shadow-xs">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                            <Scale className="w-5 h-5 text-primary" />
                            Update Global Statutory Parameters?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
                            <p>
                                Are you sure you want to commit these statutory adjustments to the database?
                            </p>
                            <p className="bg-muted/40 border border-border p-2.5 rounded-sm text-primary font-medium text-[11px]">
                                These parameters directly calibrate payroll engine withholding (POESSA pension), working-day probation countdowns, and severance formulas across all personnel dossiers.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="text-xs h-9 border-border bg-card hover:bg-muted">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeSave}
                            className="text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs font-bold"
                        >
                            Confirm &amp; Apply Parameters
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthenticatedLayout>
    );
}


