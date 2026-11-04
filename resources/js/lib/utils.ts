import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(val: string | null | undefined): string {
  if (!val) return '—'
  return val.includes('T') ? val.split('T')[0] : val
}

/**
 * Format an Ethiopian phone number into the standard +2519XXXXXXXX format.
 */
export function formatEthPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  let national = digits;
  if (national.startsWith('251')) {
    national = national.slice(3);
  }
  if (national.startsWith('0')) {
    national = national.slice(1);
  }

  return national ? `+251${national}` : null;
}

/**
 * Format an input string into spaced Ethiopian mobile format: 09XX XXX XXX
 */
export function formatEthPhoneInput(val: string): string {
  const digits = val.replace(/\D/g, '');
  if (!digits) return '';
  let clean = digits;
  if (clean.startsWith('251')) clean = '0' + clean.slice(3);
  if (!clean.startsWith('0') && clean.length > 0) clean = '0' + clean;
  clean = clean.slice(0, 10);

  if (clean.length <= 4) return clean;
  if (clean.length <= 7) return `${clean.slice(0, 4)} ${clean.slice(4)}`;
  return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
}
