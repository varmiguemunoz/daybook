import type { Folder, NoteSummary } from '@daybook/domain';

export interface FolderNode {
  folder: Folder;
  folders: FolderNode[];
  notes: NoteSummary[];
}

export interface Tree {
  folders: FolderNode[];
  notes: NoteSummary[];
}

const byTitle = (a: NoteSummary, b: NoteSummary) => a.title.localeCompare(b.title);

export function buildTree(folders: Folder[], notes: NoteSummary[]): Tree {
  const known = new Set(folders.map(folder => folder.id));
  const notesIn = (parentId: string | null) =>
    notes.filter(note => (note.folderId && known.has(note.folderId) ? note.folderId : null) === parentId).toSorted(byTitle);
  const nodesIn = (parentId: string | null): FolderNode[] =>
    folders.filter(folder => folder.parentId === parentId).map(folder => ({ folder, folders: nodesIn(folder.id), notes: notesIn(folder.id) }));
  return { folders: nodesIn(null), notes: notesIn(null) };
}

export function folderPath(folders: Folder[], id: string | null): Folder[] {
  const byId = new Map(folders.map(folder => [folder.id, folder]));
  const path: Folder[] = [];
  for (let current = id ? byId.get(id) : undefined; current; current = current.parentId ? byId.get(current.parentId) : undefined) {
    path.unshift(current);
  }
  return path;
}

export function descendantIds(folders: Folder[], id: string): Set<string> {
  const ids = new Set([id]);
  // Repeat until stable, so a child listed before its parent is still caught.
  for (let size = 0; size !== ids.size;) {
    size = ids.size;
    for (const folder of folders) if (folder.parentId && ids.has(folder.parentId)) ids.add(folder.id);
  }
  return ids;
}

export function pathLabel(folders: Folder[], id: string): string {
  return folderPath(folders, id)
    .map(folder => folder.name)
    .join(' / ');
}
