import { randomUUID } from 'node:crypto';
import { noteSchema, wikiTitles, type CreateNoteInput, type Note, type NoteDetail, type NoteSummary, type UpdateNoteInput } from '@daybook/domain';
import type { NoteQuery, Repositories } from '../../ports/repositories';
import { AppError, notFound } from '../../http/errors';
import { emit } from '../../shared/events/bus';
import { assertFolder } from '../folders/folder-service';

export function listNotes(repositories: Repositories, workspaceId: string, query: NoteQuery): Promise<NoteSummary[]> {
  return repositories.notes.list(workspaceId, query);
}

async function findNote(repositories: Repositories, workspaceId: string, id: string): Promise<Note> {
  const note = await repositories.notes.findById(workspaceId, id);
  if (!note) throw notFound('Note');
  // Notes stored before mentions existed have no mentionIds field.
  return { ...note, mentionIds: note.mentionIds ?? [] };
}

async function mentionsOf(repositories: Repositories, workspaceId: string, id: string, body: string): Promise<string[]> {
  const titles = wikiTitles(body);
  if (!titles.length) return [];
  const found = await repositories.notes.findByTitles(workspaceId, titles);
  return [...new Set(found.map(note => note.id))].filter(noteId => noteId !== id).slice(0, 200);
}

export async function getNote(repositories: Repositories, workspaceId: string, id: string): Promise<NoteDetail> {
  const note = await findNote(repositories, workspaceId, id);
  const relatedIds = [...new Set([...note.linkIds, ...note.mentionIds])];
  const [related, backlinks] = await Promise.all([repositories.notes.findByIds(workspaceId, relatedIds), repositories.notes.findLinkingTo(workspaceId, id)]);
  return { note, related, backlinks };
}

export async function createNote(repositories: Repositories, workspaceId: string, input: CreateNoteInput, authorId: string): Promise<Note> {
  await assertFolder(repositories, workspaceId, input.folderId);
  const now = Date.now();
  const id = `note_${randomUUID()}`;
  const mentionIds = await mentionsOf(repositories, workspaceId, id, input.body);
  const note = noteSchema.parse({ ...input, id, workspaceId, authorId, linkIds: [], mentionIds, createdAt: now, updatedAt: now });
  const created = await repositories.notes.create(note);
  emit(workspaceId, { type: 'note.created', payload: { id: created.id } });
  return created;
}

function changed(workspaceId: string, note: Note | null): Note {
  if (!note) throw notFound('Note');
  emit(workspaceId, { type: 'note.updated', payload: { id: note.id } });
  return note;
}

async function conflict(repositories: Repositories, workspaceId: string, id: string): Promise<never> {
  const current = await findNote(repositories, workspaceId, id);
  throw new AppError(409, 'Someone saved this note while you were editing', { note: current }, 'note_conflict');
}

// updatedAt is the content version: only title and body edits move it, so moving or linking never causes a conflict.
export async function updateNote(repositories: Repositories, workspaceId: string, id: string, input: UpdateNoteInput): Promise<Note> {
  const { baseUpdatedAt, ...fields } = input;
  await assertFolder(repositories, workspaceId, fields.folderId);
  const patch = fields.body === undefined ? fields : { ...fields, mentionIds: await mentionsOf(repositories, workspaceId, id, fields.body) };
  const content = patch.title !== undefined || patch.body !== undefined;
  if (!content) return changed(workspaceId, await repositories.notes.update(workspaceId, id, patch));
  if (baseUpdatedAt === undefined) return changed(workspaceId, await repositories.notes.update(workspaceId, id, { ...patch, updatedAt: Date.now() }));
  const next = { ...patch, updatedAt: Math.max(Date.now(), baseUpdatedAt + 1) };
  const saved = await repositories.notes.updateIfCurrent(workspaceId, id, baseUpdatedAt, next);
  return saved ? changed(workspaceId, saved) : conflict(repositories, workspaceId, id);
}

export async function setNoteLinks(repositories: Repositories, workspaceId: string, id: string, linkIds: string[]): Promise<Note> {
  const candidates = [...new Set(linkIds)].filter(linkId => linkId !== id);
  const existing = await repositories.notes.findByIds(workspaceId, candidates);
  const valid = new Set(existing.map(note => note.id));
  return changed(workspaceId, await repositories.notes.update(workspaceId, id, { linkIds: candidates.filter(linkId => valid.has(linkId)) }));
}

export async function deleteNote(repositories: Repositories, workspaceId: string, id: string): Promise<void> {
  await findNote(repositories, workspaceId, id);
  await repositories.notes.remove(workspaceId, id);
  await repositories.notes.removeLink(workspaceId, id);
  emit(workspaceId, { type: 'note.deleted', payload: { id } });
}
