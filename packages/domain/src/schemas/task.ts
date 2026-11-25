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

const editableTaskFields = {
  title: nonEmptyText,
  status: z.enum(TASK_STATUSES),
  assigneeId: idSchema.nullable(),
  priority: z.enum(PRIORITIES),
  startDate: isoDateSchema.nullable(),
  dueDate: isoDateSchema.nullable(),
  labels: z.array(z.enum(LABEL_IDS)),
  description: htmlSchema,
  estimate: estimateSchema.nullable(),
  recurrence: z.enum(RECURRENCES).nullable(),
};

export const createTaskInputSchema = z.object({
  projectId: idSchema.nullable().default(null),
  title: editableTaskFields.title,
  status: editableTaskFields.status.default('todo'),
  assigneeId: editableTaskFields.assigneeId.default(null),
  priority: editableTaskFields.priority.default('none'),
  startDate: editableTaskFields.startDate.default(null),
  dueDate: editableTaskFields.dueDate.default(null),
  labels: editableTaskFields.labels.default([]),
  description: editableTaskFields.description.default(''),
  estimate: editableTaskFields.estimate.default(null),
  recurrence: editableTaskFields.recurrence.default(null),
});

export const updateTaskInputSchema = z.object({ ...editableTaskFields, order: z.number().int().nonnegative() }).partial();

export const bulkTaskPatchSchema = updateTaskInputSchema
  .pick({ status: true, priority: true, assigneeId: true })
  .refine(patch => Object.keys(patch).length > 0, 'Choose at least one field to change');

export const bulkTaskIdsSchema = z.array(idSchema).min(1).max(200);

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
/** Same schema before defaults are applied: what an API client actually has to send. */
export type CreateTaskPayload = z.input<typeof createTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;
export type BulkTaskPatch = z.infer<typeof bulkTaskPatchSchema>;
