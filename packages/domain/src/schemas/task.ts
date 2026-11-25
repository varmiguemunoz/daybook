import { z } from 'zod';
import { LABEL_IDS } from '../vocab/label';
import { PRIORITIES } from '../vocab/priority';
import { TASK_STATUSES } from '../vocab/task-status';
import { htmlSchema, idSchema, isoDateSchema, nonEmptyText, timestampSchema } from './primitives';

export const RECURRENCES = ['daily', 'weekly', 'every-2-weeks', 'monthly'] as const;

export const subtaskSchema = z.object({
  id: idSchema,
  title: nonEmptyText,
  done: z.boolean(),
});

export const attachmentSchema = z.object({
  id: idSchema,
  name: nonEmptyText,
  type: z.string().max(16),
  size: z.string().max(16),
  uploadedBy: idSchema,
  at: timestampSchema,
});

export const estimateSchema = z.string().regex(/^\d{1,3}[hdw]$/, 'Expected a duration like 2d or 4h');

export const taskSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  projectId: idSchema.nullable().default(null),
  key: z.string().regex(/^[A-Z]{2,6}-\d{1,5}$/),
  title: nonEmptyText,
  status: z.enum(TASK_STATUSES),
  assigneeId: idSchema.nullable().default(null),
  priority: z.enum(PRIORITIES),
  startDate: isoDateSchema.nullable().default(null),
  dueDate: isoDateSchema.nullable().default(null),
  labels: z.array(z.enum(LABEL_IDS)).default([]),
  subtasks: z.array(subtaskSchema).default([]),
  attachments: z.array(attachmentSchema).default([]),
  dependencyIds: z.array(idSchema).default([]),
  description: htmlSchema.default(''),
  estimate: estimateSchema.nullable().default(null),
  order: z.number().int().nonnegative().default(0),
  favorite: z.boolean().default(false),
  recurrence: z.enum(RECURRENCES).nullable().default(null),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  completedAt: timestampSchema.nullable().default(null),
});

export type Task = z.infer<typeof taskSchema>;
export type Subtask = z.infer<typeof subtaskSchema>;
export type Attachment = z.infer<typeof attachmentSchema>;
export type Recurrence = (typeof RECURRENCES)[number];

export const createTaskInputSchema = z.object({
  projectId: idSchema.nullable().default(null),
  title: nonEmptyText,
  status: z.enum(TASK_STATUSES).default('todo'),
  assigneeId: idSchema.nullable().default(null),
  priority: z.enum(PRIORITIES).default('none'),
  startDate: isoDateSchema.nullable().default(null),
  dueDate: isoDateSchema.nullable().default(null),
  labels: z.array(z.enum(LABEL_IDS)).default([]),
  description: htmlSchema.default(''),
  estimate: estimateSchema.nullable().default(null),
  recurrence: z.enum(RECURRENCES).nullable().default(null),
});

export const updateTaskInputSchema = createTaskInputSchema
  .omit({ projectId: true, title: true })
  .extend({ title: nonEmptyText.optional(), order: z.number().int().nonnegative().optional() })
  .partial();

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
/** Same schema before defaults are applied: what an API client actually has to send. */
export type CreateTaskPayload = z.input<typeof createTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;
