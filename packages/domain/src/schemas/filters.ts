import { z } from 'zod';
import { PRIORITIES } from '../vocab/priority';
import { TASK_STATUSES } from '../vocab/task-status';
import { idSchema, isoDateSchema, nonEmptyText } from './primitives';

export const FILTER_FIELDS = ['status', 'assignee', 'priority', 'due', 'project', 'labels'] as const;

export const FILTER_OPERATORS = ['is', 'is-not'] as const;

export const filterSchema = z.object({
  field: z.enum(FILTER_FIELDS),
  operator: z.enum(FILTER_OPERATORS),
  values: z.array(z.string().max(64)).min(1),
});

export type Filter = z.infer<typeof filterSchema>;

export const SORT_FIELDS = ['manual', 'title', 'due', 'priority', 'status', 'created', 'updated', 'assignee'] as const;

export const sortSchema = z.object({
  field: z.enum(SORT_FIELDS),
  direction: z.union([z.literal(1), z.literal(-1)]),
});

export type Sort = z.infer<typeof sortSchema>;

export const GROUPINGS = ['none', 'status', 'priority', 'assignee', 'project', 'due'] as const;

export const VIEW_TYPES = ['list', 'board', 'table', 'calendar', 'timeline'] as const;

export const savedViewSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  ownerId: idSchema,
  projectId: idSchema.nullable().default(null),
  name: nonEmptyText,
  type: z.enum(VIEW_TYPES),
  filters: z.array(filterSchema).default([]),
  sort: sortSchema.default({ field: 'manual', direction: 1 }),
  group: z.enum(GROUPINGS).default('status'),
  query: z.string().max(200).default(''),
  hiddenColumns: z.array(z.string().max(40)).default([]),
});

export type SavedView = z.infer<typeof savedViewSchema>;

export const createSavedViewInputSchema = savedViewSchema.omit({ id: true, workspaceId: true, ownerId: true });

export const updateSavedViewInputSchema = z
  .object({
    projectId: idSchema.nullable(),
    name: nonEmptyText,
    type: z.enum(VIEW_TYPES),
    filters: z.array(filterSchema),
    sort: sortSchema,
    group: z.enum(GROUPINGS),
    query: z.string().max(200),
    hiddenColumns: z.array(z.string().max(40)),
  })
  .partial();

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
