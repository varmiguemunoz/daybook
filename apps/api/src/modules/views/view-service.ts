import { randomUUID } from 'node:crypto';
import { savedViewSchema, type SavedView } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { forbidden, notFound } from '../../http/errors';

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

async function ownedView(repositories: Repositories, workspaceId: string, id: string, ownerId: string): Promise<void> {
  const view = await repositories.views.findById(workspaceId, id);
  if (!view) throw notFound('View');
  if (view.ownerId !== ownerId) throw forbidden('change views owned by someone else');
}

export async function updateView(repositories: Repositories, workspaceId: string, id: string, ownerId: string, patch: Partial<SavedView>): Promise<SavedView> {
  await ownedView(repositories, workspaceId, id, ownerId);
  const updated = await repositories.views.update(workspaceId, id, patch);
  if (!updated) throw notFound('View');
  return updated;
}

export async function deleteView(repositories: Repositories, workspaceId: string, id: string, ownerId: string): Promise<void> {
  await ownedView(repositories, workspaceId, id, ownerId);
  const removed = await repositories.views.remove(workspaceId, id);
  if (!removed) throw notFound('View');
}
