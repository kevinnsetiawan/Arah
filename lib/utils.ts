import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

export function formatDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return DATE_FORMATTER.format(date);
}

export function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function daysFromNow(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isOverdue(iso: string): boolean {
  if (!iso) return false;
  return iso < todayISO();
}

export function isDueToday(iso: string): boolean {
  if (!iso) return false;
  return iso === todayISO();
}

function toUtcDay(iso: string): number | null {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) {
    return null;
  }
  const [year, month, day] = parts;
  return Date.UTC(year, month - 1, day);
}

/** Selisih hari dari hari ini ke tanggal tujuan (negatif = sudah lewat). */
export function daysUntil(iso: string): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const target = toUtcDay(iso);
  const today = toUtcDay(todayISO());
  if (target === null || today === null) return Number.POSITIVE_INFINITY;
  return Math.round((target - today) / 86_400_000);
}

/** Tambah/kurangi hari dari sebuah tanggal ISO (yyyy-mm-dd). */
export function addDaysISO(iso: string, days: number): string {
  const base = toUtcDay(iso);
  if (base === null) return iso;
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}
