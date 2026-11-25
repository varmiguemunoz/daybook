const DAY = 86_400_000;

export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export const TODAY = startOfDay(new Date());

export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return null;
  return new Date(year, month - 1, day);
}

export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY);
}

export function formatDate(value: string | null | undefined, long = false): string {
  const date = typeof value === 'string' ? parseDate(value) : value;
  if (!date) return '';
  const suffix = long || date.getFullYear() !== TODAY.getFullYear() ? `, ${date.getFullYear()}` : '';
  return `${MON[date.getMonth()] ?? ''} ${date.getDate()}${suffix}`;
}

export function relativeDate(value: string | null | undefined): string {
  if (!value) return '';
  const parsed = parseDate(value);
  if (!parsed) return '';
  const delta = diffDays(parsed, TODAY);
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';
  if (delta === -1) return 'Yesterday';
  if (delta > 1 && delta < 7) return WD[parsed.getDay()] ?? formatDate(value);
  return formatDate(value);
}

export function timeAgo(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(isoDate(new Date(timestamp)));
}

export function dayBucket(timestamp: number): string {
  const delta = diffDays(new Date(timestamp), TODAY);
  if (delta === 0) return 'Today';
  if (delta === -1) return 'Yesterday';
  return formatDate(isoDate(new Date(timestamp)));
}

export function isOverdue(dueDate: string | null, status: string): boolean {
  const due = parseDate(dueDate);
  return Boolean(due && status !== 'done' && diffDays(due, TODAY) < 0);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function startOfWeek(date: Date, weekStart = 0): Date {
  const copy = startOfDay(date);
  const shift = (copy.getDay() - weekStart + 7) % 7;
  return addDays(copy, -shift);
}

export function monthRange(month: Date, weekStart = 0): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = startOfWeek(first, weekStart);
  const cells = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const trailing = cells[35];
  return trailing && trailing.getMonth() !== month.getMonth() ? cells.slice(0, 35) : cells;
}
