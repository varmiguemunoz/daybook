import { z } from 'zod';
import { colorSchema, idSchema, nonEmptyText, timestampSchema } from './primitives';

export const teamSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  name: nonEmptyText,
  icon: z.string().max(40),
  color: colorSchema,
  description: z.string().max(200).default(''),
  memberIds: z.array(idSchema).default([]),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Team = z.infer<typeof teamSchema>;

export const createTeamInputSchema = teamSchema.omit({ id: true, workspaceId: true, createdAt: true, updatedAt: true });
export const updateTeamInputSchema = z.object({
  name: nonEmptyText.optional(),
  icon: z.string().max(40).optional(),
  color: colorSchema.optional(),
  description: z.string().max(200).optional(),
  memberIds: z.array(idSchema).optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamInputSchema>;
