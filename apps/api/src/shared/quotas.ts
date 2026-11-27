import type { Config } from '../config';
import { AppError } from '../http/errors';

type Resource = 'tasks' | 'notes';

// Zero means no limit; hosted instances set these to keep one workspace from filling the database.
const limits: Record<Resource, number> = { tasks: 0, notes: 0 };

export function configureQuotas(config: Pick<Config, 'MAX_TASKS_PER_WORKSPACE' | 'MAX_NOTES_PER_WORKSPACE'>): void {
  limits.tasks = config.MAX_TASKS_PER_WORKSPACE;
  limits.notes = config.MAX_NOTES_PER_WORKSPACE;
}

export async function assertQuota(resource: Resource, count: () => Promise<number>): Promise<void> {
  const limit = limits[resource];
  if (!limit || (await count()) < limit) return;
  throw new AppError(403, `This workspace reached its limit of ${limit} ${resource}`, null, 'limit_reached');
}
