import { z } from 'zod';
import { ROLES } from '../vocab/role';
import { colorSchema, emailSchema, idSchema, nonEmptyText, timestampSchema } from './primitives';
import { preferencesSchema, updatePreferencesInputSchema } from './preferences';

export const MEMBER_STATUSES = ['active', 'invited', 'disabled'] as const;

export const memberSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  name: nonEmptyText,
  email: emailSchema,
  role: z.enum(ROLES),
  title: z.string().max(80).default(''),
  color: colorSchema,
  status: z.enum(MEMBER_STATUSES).default('active'),
  timezone: z.string().max(64).default('UTC'),
  lastSeenAt: timestampSchema.nullable().default(null),
  clerkUserId: idSchema,
  preferences: preferencesSchema.optional(),
});

export type Member = z.infer<typeof memberSchema>;

export const memberSummarySchema = memberSchema.pick({
  id: true,
  name: true,
  email: true,
  role: true,
  color: true,
  status: true,
});

export type MemberSummary = z.infer<typeof memberSummarySchema>;

export const updateMemberInputSchema = z
  .object({
    title: z.string().max(80),
    timezone: z.string().max(64),
    preferences: updatePreferencesInputSchema,
  })
  .partial();

export type UpdateMemberInput = z.infer<typeof updateMemberInputSchema>;
