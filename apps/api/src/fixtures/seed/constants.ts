import type { Workspace } from '@gr8r/domain';

const DAY = 86_400_000;

export function isoDay(offsetDays: number): string {
  const date = new Date(Date.now() + offsetDays * DAY);
  return date.toISOString().slice(0, 10);
}

export function hoursAgo(hours: number): number {
  return Date.now() - hours * 3_600_000;
}

export const WORKSPACE_ID = 'w1';
export const OWNER_ID = 'm1';

export const defaultWorkspace: Workspace = {
  id: WORKSPACE_ID,
  name: 'Gr8r Studio',
  slug: 'gr8rstudio',
  color: '#1D1C1A',
  createdAt: Date.now(),
};
