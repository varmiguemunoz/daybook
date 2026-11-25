import { randomUUID } from 'node:crypto';
import { savedViewSchema, type SavedView } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { notFound } from '../../http/errors';

export async function listViews(repositories: Repositories, workspaceId: string, ownerId?: string): Promise<SavedView[]> {
  return repositories.views.listByWorkspace(workspaceId, ownerId);
}

export async function createView(
  repositories: Repositories,
  workspaceId: string,
  input: Omit<SavedView, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>,
): Promise<SavedView> {
  const now = Date.now();
  const view = savedViewSchema.parse({ ...input, id: `v_${randomUUID()}`, workspaceId, createdAt: now, updatedAt: now });
  return repositories.views.create(view);
}

export async function updateView(repositories: Repositories, workspaceId: string, id: string, patch: Partial<SavedView>): Promise<SavedView> {
  const updated = await repositories.views.update(workspaceId, id, patch);
  if (!updated) throw notFound('View');
  return updated;
}

export async function deleteView(repositories: Repositories, workspaceId: string, id: string): Promise<void> {
  const removed = await repositories.views.remove(workspaceId, id);
  if (!removed) throw notFound('View');
}
