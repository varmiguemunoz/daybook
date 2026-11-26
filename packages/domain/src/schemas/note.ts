import { z } from 'zod';
import { idSchema, nonEmptyText, timestampSchema } from './primitives';

const noteBody = z.string().max(100_000);
const linkIds = z.array(idSchema).max(100);

export const noteSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  folderId: idSchema.nullable().default(null),
  authorId: idSchema,
  title: nonEmptyText,
  body: noteBody.default(''),
  linkIds: linkIds.default([]),
  // Notes named with [[Title]] in the body, resolved by the server on every save.
  mentionIds: z.array(idSchema).max(200).default([]),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Note = z.infer<typeof noteSchema>;
export type NoteSummary = Pick<Note, 'id' | 'title' | 'folderId' | 'updatedAt'>;

export interface NoteDetail {
  note: Note;
  related: NoteSummary[];
  backlinks: NoteSummary[];
}

export const createNoteInputSchema = z.object({ title: nonEmptyText, folderId: idSchema.nullable().default(null), body: noteBody.default('') });
// No defaults here: a partial PATCH must never overwrite fields the client did not send.
export const updateNoteInputSchema = z.object({
  title: nonEmptyText.optional(),
  folderId: idSchema.nullable().optional(),
  body: noteBody.optional(),
  // The updatedAt the client edited from; a newer one on the server means someone else saved first.
  baseUpdatedAt: timestampSchema.optional(),
});
export const noteLinksInputSchema = z.object({ linkIds });

export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;
