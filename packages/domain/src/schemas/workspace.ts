import { z } from 'zod';
import { colorSchema, idSchema, nonEmptyText, slugSchema, timestampSchema } from './primitives';

export const workspaceSchema = z.object({
  id: idSchema,
  name: nonEmptyText,
  slug: slugSchema,
  color: colorSchema,
  createdAt: timestampSchema,
});

export type Workspace = z.infer<typeof workspaceSchema>;

export const createWorkspaceInputSchema = workspaceSchema.pick({ name: true, slug: true }).extend({ color: colorSchema.optional() });

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;

export const updateWorkspaceInputSchema = workspaceSchema.pick({ name: true, slug: true, color: true }).partial();

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceInputSchema>;
