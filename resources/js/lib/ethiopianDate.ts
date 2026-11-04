/**
 * Bidirectional conversion between Gregorian and Ethiopian (Ge'ez) Calendar dates
 * using the Julian Day Number (JDN) astronomical algorithm.
 */

export const ETHIOPIAN_MONTHS = [
    'Meskerem',
    'Tikimt',
    'Hidar',
    'Tahsas',
    'Tir',
    'Yakatit',
    'Megabit',
    'Miazia',
    'Ginbot',
    'Sene',
    'Hamle',
    'Nehase',
    'Pagumē',
];

function gregorianToJdn(year: number, month: number, day: number): number {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function jdnToEthiopian(jdn: number): { year: number; month: number; day: number } {
    const r = (jdn - 1724221) % 1461;
    const n = (r % 365) + 365 * Math.floor(r / 1460);
    const year = 4 * Math.floor((jdn - 1724221) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460) + 1;
    const month = Math.floor(n / 30) + 1;
    const day = (n % 30) + 1;
    return { year, month, day };
}

function ethiopianToJdn(year: number, month: number, day: number): number {
    return 1724221 + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
}

function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
    const l = jdn + 68569;
    const n = Math.floor((4 * l) / 146097);
    const l2 = l - Math.floor((146097 * n + 3) / 4);
    const i = Math.floor((4000 * (l2 + 1)) / 1461001);
    const l3 = l2 - Math.floor((1461 * i) / 4) + 31;
    const j = Math.floor((80 * l3) / 2447);
    const day = l3 - Math.floor((2447 * j) / 80);
    const l4 = Math.floor(j / 11);
    const month = j + 2 - 12 * l4;
    const year = 100 * (n - 49) + i + l4;
    return { year, month, day };
}

/**
 * Convert Gregorian date string (YYYY-MM-DD) to Ethiopian date string (YYYY-MM-DD).
 */
export function gcToEc(gcStr?: string | null): string | null {
    if (!gcStr || !gcStr.includes('-')) return null;
    const [y, m, d] = gcStr.split('T')[0].split('-').map(Number);
    if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) return null;

    const jdn = gregorianToJdn(y, m, d);
    const ec = jdnToEthiopian(jdn);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${ec.year}-${pad(ec.month)}-${pad(ec.day)}`;
}

/**
 * Convert Ethiopian date string (YYYY-MM-DD) to Gregorian date string (YYYY-MM-DD).
 */
export function ecToGc(ecStr?: string | null): string | null {
    if (!ecStr || !ecStr.includes('-')) return null;
    const parts = ecStr.trim().split('-').map(Number);
    if (parts.length < 3) return null;
    const [y, m, d] = parts;
    if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) return null;

    const jdn = ethiopianToJdn(y, m, d);
    const gc = jdnToGregorian(jdn);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${gc.year}-${pad(gc.month)}-${pad(gc.day)}`;
}

/**
 * Format Ethiopian date into a human readable string, e.g. "Meskerem 01, 2017 E.C."
 */
export function formatEthiopianDisplay(ecStr?: string | null): string | null {
    if (!ecStr || !ecStr.includes('-')) return null;
    const parts = ecStr.trim().split('-');
    if (parts.length < 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

    const monthName = ETHIOPIAN_MONTHS[m - 1] || `Month ${m}`;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${monthName} ${pad(d)}, ${y} E.C.`;
}
