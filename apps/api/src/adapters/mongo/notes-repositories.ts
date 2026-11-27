/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Folder, Note, NoteSummary } from '@daybook/domain';
import type { FolderRepository, NoteQuery, NoteRepository } from '../../ports/repositories';
import { modelFor, toDomain } from './connection';
import { escapeRegExp } from './task-repository';
import { FolderModel, NoteModel } from './models/notes';

const FolderDocument = modelFor(FolderModel) as any;
const NoteDocument = modelFor(NoteModel) as any;
const RETURN_NEW = { returnDocument: 'after', lean: true };
const SUMMARY_FIELDS = 'title folderId updatedAt';
const CASE_INSENSITIVE = { locale: 'en', strength: 2 };

function many<T>(documents: unknown[]): T[] {
  return documents.map(document => toDomain<T>(document) as T);
}

function summaries(filter: Record<string, unknown>): Promise<NoteSummary[]> {
  return NoteDocument.find(filter)
    .select(SUMMARY_FIELDS)
    .sort({ updatedAt: -1 })
    .lean()
    .then(many<NoteSummary>);
}

export class MongoFolderRepository implements FolderRepository {
  async listByWorkspace(workspaceId: string): Promise<Folder[]> {
    return many<Folder>(await FolderDocument.find({ workspaceId }).sort({ order: 1, name: 1 }).lean());
  }

  async findById(workspaceId: string, id: string): Promise<Folder | null> {
    return toDomain<Folder>(await FolderDocument.findOne({ _id: id, workspaceId }).lean());
  }

  async create(folder: Folder): Promise<Folder> {
    return toDomain<Folder>(await FolderDocument.create({ _id: folder.id, ...folder })) as Folder;
  }

  async update(workspaceId: string, id: string, patch: Partial<Folder>): Promise<Folder | null> {
    return toDomain<Folder>(await FolderDocument.findOneAndUpdate({ _id: id, workspaceId }, { $set: patch }, RETURN_NEW));
  }

  async moveChildren(workspaceId: string, fromParentId: string, toParentId: string | null): Promise<void> {
    await FolderDocument.updateMany({ workspaceId, parentId: fromParentId }, { $set: { parentId: toParentId } });
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    return (await FolderDocument.deleteOne({ _id: id, workspaceId })).deletedCount > 0;
  }
}

export class MongoNoteRepository implements NoteRepository {
  list(workspaceId: string, { folderId, search }: NoteQuery): Promise<NoteSummary[]> {
    const filter: Record<string, unknown> = { workspaceId };
    if (folderId !== undefined) filter.folderId = folderId;
    if (search?.trim()) filter.title = { $regex: escapeRegExp(search.trim()), $options: 'i' };
    return summaries(filter);
  }

  async findById(workspaceId: string, id: string): Promise<Note | null> {
    return toDomain<Note>(await NoteDocument.findOne({ _id: id, workspaceId }).lean());
  }

  findByIds(workspaceId: string, ids: string[]): Promise<NoteSummary[]> {
    return summaries({ workspaceId, _id: { $in: ids } });
  }

  async findByTitles(workspaceId: string, lowerCaseTitles: string[]): Promise<NoteSummary[]> {
    if (!lowerCaseTitles.length) return [];
    const documents = await NoteDocument.find({ workspaceId, title: { $in: lowerCaseTitles } })
      .collation(CASE_INSENSITIVE)
      .select(SUMMARY_FIELDS)
      .lean();
    return many<NoteSummary>(documents);
  }

  findLinkingTo(workspaceId: string, id: string): Promise<NoteSummary[]> {
    return summaries({ workspaceId, $or: [{ linkIds: id }, { mentionIds: id }] });
  }

  async count(workspaceId: string): Promise<number> {
    return NoteDocument.countDocuments({ workspaceId });
  }

  async create(note: Note): Promise<Note> {
    return toDomain<Note>(await NoteDocument.create({ _id: note.id, ...note })) as Note;
  }

  async update(workspaceId: string, id: string, patch: Partial<Note>): Promise<Note | null> {
    return toDomain<Note>(await NoteDocument.findOneAndUpdate({ _id: id, workspaceId }, { $set: patch }, RETURN_NEW));
  }

  async updateIfCurrent(workspaceId: string, id: string, updatedAt: number, patch: Partial<Note>): Promise<Note | null> {
    return toDomain<Note>(await NoteDocument.findOneAndUpdate({ _id: id, workspaceId, updatedAt }, { $set: patch }, RETURN_NEW));
  }

  async moveFolder(workspaceId: string, fromFolderId: string, toFolderId: string | null): Promise<void> {
    await NoteDocument.updateMany({ workspaceId, folderId: fromFolderId }, { $set: { folderId: toFolderId } });
  }

  async removeLink(workspaceId: string, targetId: string): Promise<void> {
    const filter = { workspaceId, $or: [{ linkIds: targetId }, { mentionIds: targetId }] };
    await NoteDocument.updateMany(filter, { $pull: { linkIds: targetId, mentionIds: targetId } });
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    return (await NoteDocument.deleteOne({ _id: id, workspaceId })).deletedCount > 0;
  }
}
