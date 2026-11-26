import { z } from 'zod';
import { idSchema, timestampSchema } from './primitives';

const commentBody = z.string().trim().min(1).max(4_000);
const emoji = z
  .string()
  .max(8)
  .regex(/^\p{Extended_Pictographic}/u);

export const reactionSchema = z.record(z.string().max(8), z.array(idSchema));

export const commentSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  taskId: idSchema,
  authorId: idSchema,
  body: commentBody,
  reactions: reactionSchema.default({}),
  createdAt: timestampSchema,
  editedAt: timestampSchema.nullable().default(null),
});

export type Comment = z.infer<typeof commentSchema>;

export const createCommentInputSchema = z.object({ body: commentBody });

export const updateCommentInputSchema = z.object({ body: commentBody });

export const reactionInputSchema = z.object({ emoji });

export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;
