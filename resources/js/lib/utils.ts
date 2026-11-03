import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(val: string | null | undefined): string {
  if (!val) return '—'
  return val.includes('T') ? val.split('T')[0] : val
}
