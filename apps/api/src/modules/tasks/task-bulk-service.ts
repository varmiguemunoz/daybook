import type { BulkTaskPatch, Task, Workspace } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { AppError } from '../../http/errors';
import { deleteTask, updateTask } from './task-service';

function skipMissing<T>(promise: Promise<T>): Promise<T | null> {
  return promise.catch(error => {
    if (error instanceof AppError && error.status === 404) return null;
    throw error;
  });
}

export async function updateTasks(repositories: Repositories, workspace: Workspace, ids: string[], patch: BulkTaskPatch, actorId: string): Promise<Task[]> {
  const updated = await Promise.all(ids.map(id => skipMissing(updateTask(repositories, workspace, id, patch, actorId))));
  return updated.filter((task): task is Task => task !== null);
}

export async function deleteTasks(repositories: Repositories, workspace: Workspace, ids: string[], actorId: string): Promise<number> {
  const results = await Promise.all(ids.map(id => skipMissing(deleteTask(repositories, workspace, id, actorId).then(() => id))));
  return results.filter(Boolean).length;
}
