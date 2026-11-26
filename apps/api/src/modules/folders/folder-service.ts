import { randomUUID } from 'node:crypto';
import { folderSchema, type CreateFolderInput, type Folder, type UpdateFolderInput } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { invalidInput, notFound } from '../../http/errors';
import { emit } from '../../shared/events/bus';

export function listFolders(repositories: Repositories, workspaceId: string): Promise<Folder[]> {
  return repositories.folders.listByWorkspace(workspaceId);
}

async function getFolder(repositories: Repositories, workspaceId: string, id: string): Promise<Folder> {
  const folder = await repositories.folders.findById(workspaceId, id);
  if (!folder) throw notFound('Folder');
  return folder;
}

export async function assertFolder(repositories: Repositories, workspaceId: string, id: string | null | undefined): Promise<void> {
  if (id) await getFolder(repositories, workspaceId, id);
}

async function assertNoCycle(repositories: Repositories, workspaceId: string, id: string, parentId: string | null): Promise<void> {
  const byId = new Map((await repositories.folders.listByWorkspace(workspaceId)).map(folder => [folder.id, folder]));
  for (let current = parentId; current; current = byId.get(current)?.parentId ?? null) {
    if (current === id) throw invalidInput([{ path: 'parentId', message: 'A folder cannot be moved inside itself' }]);
  }
}

function changed(workspaceId: string): void {
  emit(workspaceId, { type: 'folder.changed' });
}

export async function createFolder(repositories: Repositories, workspaceId: string, input: CreateFolderInput): Promise<Folder> {
  await assertFolder(repositories, workspaceId, input.parentId);
  const now = Date.now();
  const siblings = (await repositories.folders.listByWorkspace(workspaceId)).filter(folder => folder.parentId === input.parentId);
  const folder = folderSchema.parse({ ...input, id: `fld_${randomUUID()}`, workspaceId, order: siblings.length, createdAt: now, updatedAt: now });
  const created = await repositories.folders.create(folder);
  changed(workspaceId);
  return created;
}

export async function updateFolder(repositories: Repositories, workspaceId: string, id: string, input: UpdateFolderInput): Promise<Folder> {
  if (input.parentId !== undefined) {
    await assertFolder(repositories, workspaceId, input.parentId);
    await assertNoCycle(repositories, workspaceId, id, input.parentId);
  }
  const updated = await repositories.folders.update(workspaceId, id, { ...input, updatedAt: Date.now() });
  if (!updated) throw notFound('Folder');
  changed(workspaceId);
  return updated;
}

export async function deleteFolder(repositories: Repositories, workspaceId: string, id: string): Promise<void> {
  const folder = await getFolder(repositories, workspaceId, id);
  await repositories.notes.moveFolder(workspaceId, id, folder.parentId);
  await repositories.folders.moveChildren(workspaceId, id, folder.parentId);
  await repositories.folders.remove(workspaceId, id);
  changed(workspaceId);
}
