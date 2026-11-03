import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function addMonths(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function isValidMonth(value: string): boolean {
  return MONTH_RE.test(value);
}

/** Rango razonable: desde 1950 hasta 12 meses en el futuro. */
export function isMonthInRange(value: string): boolean {
  if (!isValidMonth(value)) return false;
  return value >= '1950-01' && value <= addMonths(currentMonth(), 12);
}

export function monthLabel(value: string): string {
  if (!isValidMonth(value)) return value;
  const [year, month] = value.split('-').map(Number);
  const names = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  return `${names[month - 1]} ${year}`;
}

export function monthRange(start: string, end: string, current: boolean, fallback = 'Actualidad'): string {
  const from = start ? monthLabel(start) : '';
  const to = current ? fallback : end ? monthLabel(end) : '';
  if (!from && !to) return '';
  if (!to) return from;
  return `${from} — ${to}`;
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function digits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isPhone(value: string): boolean {
  const clean = digits(value);
  return clean.length >= 7 && clean.length <= 15;
}

export function isEmail(value: string): boolean {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value.trim());
}

export function splitList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function lines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function digitsCount(value: string): number {
  return digits(value).length;
}

type ExperienceLike = {
  start: string;
  end: string;
  current: boolean;
};

/** Estimación de años de experiencia sumando meses de cada entrada. */
export function estimateYears(experiences: ExperienceLike[]): number {
  const now = currentMonth();
  let months = 0;
  for (const item of experiences) {
    if (!isValidMonth(item.start)) continue;
    const end = item.current || !isValidMonth(item.end) ? now : item.end;
    if (end < item.start) continue;
    const [sy, sm] = item.start.split('-').map(Number);
    const [ey, em] = end.split('-').map(Number);
    months += (ey - sy) * 12 + (em - sm) + 1;
  }
  if (months <= 0) return 0;
  return Math.min(60, Math.round((months / 12) * 10) / 10);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
