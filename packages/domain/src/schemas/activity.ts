import { z } from 'zod';
import { idSchema, timestampSchema } from './primitives';

export const ACTIVITY_VERBS = ['created', 'updated', 'completed', 'reopened', 'archived', 'commented', 'assigned', 'moved', 'deleted'] as const;

export const activitySchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  actorId: idSchema.nullable(),
  verb: z.enum(ACTIVITY_VERBS),
  taskId: idSchema.nullable().default(null),
  projectId: idSchema.nullable().default(null),
  detail: z.string().max(200).default(''),
  at: timestampSchema,
});

export type Activity = z.infer<typeof activitySchema>;
export type ActivityVerb = (typeof ACTIVITY_VERBS)[number];

export const NOTIFICATION_TYPES = ['mention', 'assign', 'comment', 'update'] as const;

export const notificationSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  userId: idSchema,
  type: z.enum(NOTIFICATION_TYPES),
  actorId: idSchema.nullable().default(null),
  taskId: idSchema.nullable().default(null),
  projectId: idSchema.nullable().default(null),
  text: z.string().max(200),
  snippet: z.string().max(400).default(''),
  read: z.boolean().default(false),
  channel: z.enum(['inapp', 'email', 'both']).default('inapp'),
  emailedAt: timestampSchema.nullable().default(null),
  at: timestampSchema,
});

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
