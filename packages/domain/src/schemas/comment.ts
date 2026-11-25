import { z } from 'zod';
import { idSchema, nonEmptyText, timestampSchema } from './primitives';

export const reactionSchema = z.record(z.string().max(8), z.array(idSchema));

export const commentSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  taskId: idSchema,
  authorId: idSchema,
  body: nonEmptyText.max(4_000),
  reactions: reactionSchema.default({}),
  createdAt: timestampSchema,
  editedAt: timestampSchema.nullable().default(null),
});

export type Comment = z.infer<typeof commentSchema>;

export const createCommentInputSchema = z.object({
  taskId: idSchema,
  body: nonEmptyText.max(4_000),
});

export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;
