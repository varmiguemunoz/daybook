import { z } from 'zod';
import { colorSchema, idSchema, nonEmptyText, timestampSchema } from './primitives';

export const workspaceSchema = z.object({
  id: idSchema,
  clerkOrgId: idSchema,
  name: nonEmptyText,
  color: colorSchema,
  createdAt: timestampSchema,
});

export type Workspace = z.infer<typeof workspaceSchema>;
