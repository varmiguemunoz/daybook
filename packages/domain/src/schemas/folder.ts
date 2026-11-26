import { z } from 'zod';
import { idSchema, nonEmptyText, timestampSchema } from './primitives';

export const folderSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  parentId: idSchema.nullable().default(null),
  name: nonEmptyText,
  order: z.number().int().nonnegative().default(0),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Folder = z.infer<typeof folderSchema>;

export const createFolderInputSchema = z.object({ name: nonEmptyText, parentId: idSchema.nullable().default(null) });
export const updateFolderInputSchema = z.object({
  name: nonEmptyText.optional(),
  parentId: idSchema.nullable().optional(),
  order: z.number().int().nonnegative().optional(),
});

export type CreateFolderInput = z.infer<typeof createFolderInputSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderInputSchema>;
