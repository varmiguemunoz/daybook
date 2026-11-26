import { z } from 'zod';
import { PRIORITIES } from '../vocab/priority';
import { TASK_STATUSES } from '../vocab/task-status';
import { idSchema, isoDateSchema } from './primitives';

export const taskQuerySchema = z.object({
  projectId: idSchema.optional(),
  status: z.array(z.enum(TASK_STATUSES)).optional(),
  priority: z.array(z.enum(PRIORITIES)).optional(),
  assigneeId: z.array(idSchema).optional(),
  label: z.array(z.string().max(32)).optional(),
  dueBefore: isoDateSchema.optional(),
  search: z.string().max(200).optional(),
});

export type TaskQuery = z.infer<typeof taskQuerySchema>;
