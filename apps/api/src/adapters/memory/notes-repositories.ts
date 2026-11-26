import type { Folder, Note, NoteSummary } from '@daybook/domain';
import type { FolderRepository, NoteQuery, NoteRepository } from '../../ports/repositories';
import type { Collection } from './collection';

function summarize({ id, title, folderId, updatedAt }: Note): NoteSummary {
  return { id, title, folderId, updatedAt };
}

function newestFirst(items: Note[]): NoteSummary[] {
  return items.toSorted((a, b) => b.updatedAt - a.updatedAt).map(summarize);
}

export class MemoryFolderRepository implements FolderRepository {
  constructor(private readonly items: Collection<Folder>) {}

  async listByWorkspace(workspaceId: string): Promise<Folder[]> {
    return this.items.filter({ workspaceId }).toSorted((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }

  async findById(workspaceId: string, id: string): Promise<Folder | null> {
    return this.items.find(id, { workspaceId });
  }

  async create(folder: Folder): Promise<Folder> {
    return this.items.insert(folder);
  }

  async update(workspaceId: string, id: string, patch: Partial<Folder>): Promise<Folder | null> {
    return this.items.patch(id, patch, { workspaceId });
  }

  async moveChildren(workspaceId: string, fromParentId: string, toParentId: string | null): Promise<void> {
    this.items.filter({ workspaceId, parentId: fromParentId }).forEach(folder => this.items.patch(folder.id, { parentId: toParentId }));
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    return this.items.remove(id, { workspaceId });
  }
}

export class MemoryNoteRepository implements NoteRepository {
  constructor(private readonly items: Collection<Note>) {}

  async list(workspaceId: string, { folderId, search }: NoteQuery): Promise<NoteSummary[]> {
    const scoped = folderId === undefined ? this.items.filter({ workspaceId }) : this.items.filter({ workspaceId, folderId });
    const term = search?.trim().toLowerCase();
    return newestFirst(term ? scoped.filter(note => note.title.toLowerCase().includes(term)) : scoped);
  }

  async findById(workspaceId: string, id: string): Promise<Note | null> {
    return this.items.find(id, { workspaceId });
  }

  async findByIds(workspaceId: string, ids: string[]): Promise<NoteSummary[]> {
    return newestFirst(this.items.filter({ workspaceId }).filter(note => ids.includes(note.id)));
  }

  async findByTitles(workspaceId: string, lowerCaseTitles: string[]): Promise<NoteSummary[]> {
    return newestFirst(this.items.filter({ workspaceId }).filter(note => lowerCaseTitles.includes(note.title.toLowerCase())));
  }

  async findLinkingTo(workspaceId: string, id: string): Promise<NoteSummary[]> {
    return newestFirst(this.items.filter({ workspaceId }).filter(note => note.linkIds.includes(id) || note.mentionIds.includes(id)));
  }

  async create(note: Note): Promise<Note> {
    return this.items.insert(note);
  }

  async update(workspaceId: string, id: string, patch: Partial<Note>): Promise<Note | null> {
    return this.items.patch(id, patch, { workspaceId });
  }

  async updateIfCurrent(workspaceId: string, id: string, updatedAt: number, patch: Partial<Note>): Promise<Note | null> {
    return this.items.patch(id, patch, { workspaceId, updatedAt });
  }

  async moveFolder(workspaceId: string, fromFolderId: string, toFolderId: string | null): Promise<void> {
    this.items.filter({ workspaceId, folderId: fromFolderId }).forEach(note => this.items.patch(note.id, { folderId: toFolderId }));
  }

  async removeLink(workspaceId: string, targetId: string): Promise<void> {
    const without = (ids: string[]) => ids.filter(id => id !== targetId);
    for (const note of this.items.filter({ workspaceId })) {
      if (note.linkIds.includes(targetId) || note.mentionIds.includes(targetId)) {
        this.items.patch(note.id, { linkIds: without(note.linkIds), mentionIds: without(note.mentionIds) });
      }
    }
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    return this.items.remove(id, { workspaceId });
  }
}
