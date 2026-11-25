import { randomUUID } from 'node:crypto';
import { activitySchema, type Activity, type ActivityVerb } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';

export interface ActivityInput {
  workspaceId: string;
  actorId: string;
  verb: ActivityVerb;
  taskId?: string | null;
  projectId?: string | null;
  detail?: string;
}

export async function recordActivity(repositories: Repositories, input: ActivityInput): Promise<void> {
  const activity = activitySchema.parse({
    id: `a_${randomUUID()}`,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    verb: input.verb,
    taskId: input.taskId ?? null,
    projectId: input.projectId ?? null,
    detail: input.detail ?? '',
    at: Date.now(),
  });

  await repositories.activity.append(activity);
}

export function recentActivity(repositories: Repositories, workspaceId: string, limit = 20): Promise<Activity[]> {
  return repositories.activity.recent(workspaceId, limit);
}
