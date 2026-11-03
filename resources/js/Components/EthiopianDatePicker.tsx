import { useState, useEffect } from 'react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Calendar, Globe } from 'lucide-react';

interface Props {
    value?: string; // Gregorian ISO (YYYY-MM-DD)
    valueEc?: string; // Ethiopian format (YYYY-MM-DD or text)
    onChange: (gcDate: string, ecDate: string) => void;
    label?: string;
    required?: boolean;
    className?: string;
}

const ETHIOPIAN_MONTHS = [
    { num: 1, name: 'Meskerem (መስከረም)' },
    { num: 2, name: 'Tikimt (ጥቅምት)' },
    { num: 3, name: 'Hidar (ኅዳር)' },
    { num: 4, name: 'Tahsas (ታኅሣሥ)' },
    { num: 5, name: 'Tir (ጥር)' },
    { num: 6, name: 'Yakatit (የካቲት)' },
    { num: 7, name: 'Magabit (መጋቢት)' },
    { num: 8, name: 'Miyazya (ሚያዝያ)' },
    { num: 9, name: 'Ginbot (ግንቦት)' },
    { num: 10, name: 'Sene (ሰኔ)' },
    { num: 11, name: 'Hamle (ሐምሌ)' },
    { num: 12, name: 'Nehase (ነሐሴ)' },
    { num: 13, name: 'Pagume (ጳጉሜ)' },
];

export default function EthiopianDatePicker({
    value = '',
    valueEc = '',
    onChange,
    label,
    required = false,
    className = '',
}: Props) {
    const [mode, setMode] = useState<'GC' | 'EC'>('GC');
    const [gcDate, setGcDate] = useState(value);
    const [ecYear, setEcYear] = useState('2017');
    const [ecMonth, setEcMonth] = useState('1');
    const [ecDay, setEcDay] = useState('1');

    useEffect(() => {
        if (value) setGcDate(value);
    }, [value]);

    useEffect(() => {
        if (valueEc) {
            const parts = valueEc.split(/[-/]/);
            if (parts.length === 3) {
                setEcYear(parts[0]);
                setEcMonth(String(parseInt(parts[1], 10)));
                setEcDay(String(parseInt(parts[2], 10)));
            }
        }
    }, [valueEc]);

    const handleGcChange = (newGc: string) => {
        setGcDate(newGc);
        if (!newGc) {
            onChange('', '');
            return;
        }

        // Approximate GC to EC conversion for local instant feedback
        try {
            const d = new Date(newGc);
            const gcY = d.getFullYear();
            const gcM = d.getMonth() + 1;
            const gcD = d.getDate();

            let ecY = gcY - 8;
            if (gcM > 9 || (gcM === 9 && gcD >= 11)) {
                ecY = gcY - 7;
            }

            const formattedEc = `${ecY}-${String(gcM).padStart(2, '0')}-${String(gcD).padStart(2, '0')}`;
            onChange(newGc, formattedEc);
        } catch {
            onChange(newGc, valueEc);
        }
    };

    const handleEcChange = (y: string, m: string, d: string) => {
        setEcYear(y);
        setEcMonth(m);
        setEcDay(d);

        const formattedEc = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

        // Approximate EC to GC conversion for local instant feedback
        const numY = parseInt(y, 10) || 2017;
        const numM = parseInt(m, 10) || 1;
        const numD = parseInt(d, 10) || 1;

        let gcY = numY + 7;
        if (numM > 4 || (numM === 4 && numD > 22)) {
            gcY = numY + 8;
        }

        const approxGc = `${gcY}-${String(Math.min(12, numM + 1)).padStart(2, '0')}-${String(Math.min(28, numD)).padStart(2, '0')}`;
        onChange(approxGc, formattedEc);
    };

    return (
        <div className={`space-y-1.5 ${className}`}>
            <div className="flex items-center justify-between">
                {label && (
                    <label className="text-xs font-bold text-black">
                        {label} {required && <span className="text-[#de2828]">*</span>}
                    </label>
                )}
                <div className="flex items-center border border-[#d8d9da] rounded-xs overflow-hidden text-[11px] font-semibold">
                    <button
                        type="button"
                        onClick={() => setMode('GC')}
                        className={`px-2 py-0.5 transition-colors ${
                            mode === 'GC'
                                ? 'bg-[#008254] text-white'
                                : 'bg-white text-[#64666a] hover:bg-[#f7f7f7]'
                        }`}
                    >
                        Gregorian (G.C.)
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('EC')}
                        className={`px-2 py-0.5 transition-colors ${
                            mode === 'EC'
                                ? 'bg-[#008254] text-white'
                                : 'bg-white text-[#64666a] hover:bg-[#f7f7f7]'
                        }`}
                    >
                        Ethiopian (E.C.)
                    </button>
                </div>
            </div>

            {mode === 'GC' ? (
                <div className="relative">
                    <Input
                        type="date"
                        value={gcDate}
                        onChange={(e) => handleGcChange(e.target.value)}
                        className="h-10 text-xs border-[#d8d9da] rounded-xs bg-[#f7f7f7]"
                        required={required}
                    />
                    {valueEc && (
                        <p className="text-[10px] text-[#008254] font-medium mt-1">
                            Ethiopian Equivalent: {valueEc} E.C.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-1">
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <select
                                value={ecMonth}
                                onChange={(e) => handleEcChange(ecYear, e.target.value, ecDay)}
                                className="w-full h-10 border border-[#d8d9da] rounded-xs text-xs px-2 bg-[#f7f7f7]"
                            >
                                {ETHIOPIAN_MONTHS.map((m) => (
                                    <option key={m.num} value={m.num}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <select
                                value={ecDay}
                                onChange={(e) => handleEcChange(ecYear, ecMonth, e.target.value)}
                                className="w-full h-10 border border-[#d8d9da] rounded-xs text-xs px-2 bg-[#f7f7f7]"
                            >
                                {Array.from({ length: parseInt(ecMonth, 10) === 13 ? 6 : 30 }, (_, i) => i + 1).map((d) => (
                                    <option key={d} value={d}>Day {d}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Input
                                type="number"
                                value={ecYear}
                                onChange={(e) => handleEcChange(e.target.value, ecMonth, ecDay)}
                                placeholder="Year (e.g. 2017)"
                                className="h-10 text-xs border-[#d8d9da] rounded-xs bg-[#f7f7f7]"
                            />
                        </div>
                    </div>
                    {gcDate && (
                        <p className="text-[10px] text-[#008254] font-medium">
                            Gregorian SQL Equivalent: {gcDate}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
