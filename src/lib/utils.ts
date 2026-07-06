import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with proper conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const eurFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('de-DE');

/** €24.900 */
export function formatPrice(value: number): string {
  return eurFormatter.format(value);
}

/** 24.900 */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** 42.000 km */
export function formatMileage(km: number): string {
  return `${numberFormatter.format(km)} km`;
}

/** €245 / muaj */
export function formatMonthly(value: number): string {
  return `${eurFormatter.format(value)} / muaj`;
}

/** Albanian relative-ish date, e.g. "6 korrik 2026". */
const dateFormatter = new Intl.DateTimeFormat('sq-AL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return dateFormatter.format(d);
}

/** URL-safe slug from arbitrary text. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/** Clamp a number into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
