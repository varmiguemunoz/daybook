import { z } from 'zod';
import { idSchema, isoDateSchema, nonEmptyText, timestampSchema } from './primitives';

export const FILE_TYPES = ['fig', 'pdf', 'doc', 'sheet', 'img', 'zip', 'code', 'other'] as const;

export const fileSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  projectId: idSchema.nullable().default(null),
  taskId: idSchema.nullable().default(null),
  name: nonEmptyText,
  type: z.enum(FILE_TYPES),
  size: z.string().max(16),
  uploadedBy: idSchema,
  at: timestampSchema,
  sizeBytes: z.number().int().nonnegative().optional(),
  mimeType: z.string().max(128).optional(),
  r2Key: z.string().max(512).optional(),
  r2Bucket: z.string().max(128).optional(),
});

export type FileRecord = z.infer<typeof fileSchema>;

export const calendarEventSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  projectId: idSchema.nullable().default(null),
  title: nonEmptyText,
  date: isoDateSchema,
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;

export const createCalendarEventInputSchema = calendarEventSchema.omit({ id: true, workspaceId: true });

export const updateCalendarEventInputSchema = createCalendarEventInputSchema.extend({ projectId: idSchema.nullable() }).partial();
