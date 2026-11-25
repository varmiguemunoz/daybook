import { z } from 'zod';
import { ROLES } from '../vocab/role';
import { emailSchema, idSchema, timestampSchema } from './primitives';

export const invitationStatuses = ['pending', 'accepted', 'expired'] as const;

export const invitationSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  email: emailSchema,
  role: z.enum(ROLES),
  token: z.string().min(16).max(128),
  invitedBy: idSchema,
  expiresAt: timestampSchema,
  acceptedAt: timestampSchema.nullable().default(null),
  createdAt: timestampSchema,
});

export type Invitation = z.infer<typeof invitationSchema>;

export const createInvitationInputSchema = z.object({
  email: emailSchema,
  role: z.enum(ROLES).default('member'),
});

export type CreateInvitationInput = z.infer<typeof createInvitationInputSchema>;
