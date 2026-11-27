import { z } from 'zod';
import { bulkTaskPatchSchema, createTaskInputSchema, taskQuerySchema, updateTaskInputSchema, type Task } from '@daybook/domain';
import type { Repositories } from '../../../ports/repositories';
import { notFound } from '../../../http/errors';
import { parseBody } from '../../../http/validate';
import { createTask, deleteTask, getTask, listTasks, updateTask } from '../../tasks/task-service';
import { deleteTasks, updateTasks } from '../../tasks/task-bulk-service';
import { defineTool, page, pageFields, fieldsOf, reply, scoped } from '../tool-kit';

const TASK_KEY = /^[A-Za-z]{2,6}-\d{1,5}$/;
const taskRef = z.string().min(1).max(64).describe('Task id or key, for example DAY-12');
const taskRefs = z.array(taskRef).min(1).max(200);

// Agents usually know the key people see (DAY-12), so both forms are accepted.
async function taskIdOf(repositories: Repositories, workspaceId: string, ref: string): Promise<string> {
  if (!TASK_KEY.test(ref)) return ref;
  const key = ref.toUpperCase();
  const match = (await repositories.tasks.list(workspaceId, { search: key })).find(task => task.key === key);
  if (!match) throw notFound(`Task ${key}`);
  return match.id;
}

function summaryOf(task: Task) {
  const { id, key, title, status, priority, assigneeId, dueDate, labels, projectId } = task;
  return { id, key, title, status, priority, assigneeId, dueDate, labels, projectId };
}

export const taskTools = [
  defineTool({
    name: 'list_tasks',
    title: 'List tasks',
    description:
      'List tasks with optional filters. Set mine to list the tasks assigned to the user. Returns short task summaries; call get_task for the description.',
    access: 'read',
    input: scoped({ ...taskQuerySchema.shape, mine: z.boolean().optional(), ...pageFields }),
    run: async (call, args) => {
      const { mine, limit, cursor, ...query } = fieldsOf(args);
      const { workspace, member } = await call.scope();
      const tasks = await listTasks(call.session.deps.repositories, workspace.id, mine ? { ...query, assigneeId: [member.id] } : query);
      const result = page(tasks.map(summaryOf), { limit, cursor });
      return reply(`${result.total} task(s).`, result);
    },
  }),
  defineTool({
    name: 'get_task',
    title: 'Get task',
    description: 'Read one task with every field, including its HTML description and subtasks.',
    access: 'read',
    input: scoped({ task: taskRef }),
    run: async (call, args) => {
      const { workspace } = await call.scope();
      const { repositories } = call.session.deps;
      const task = await getTask(repositories, workspace.id, await taskIdOf(repositories, workspace.id, args.task));
      return reply(`${task.key}: ${task.title}`, { task });
    },
  }),
  defineTool({
    name: 'create_task',
    title: 'Create task',
    description: 'Create a task. assigneeId is a member id from list_members. description takes simple HTML (<p>, <ul>, <li>, <strong>). Dates are YYYY-MM-DD.',
    access: 'write',
    input: scoped(createTaskInputSchema.shape),
    run: async (call, args) => {
      const input = fieldsOf(args);
      const { workspace, member } = await call.scope('task:write');
      const task = await createTask(call.session.deps.repositories, workspace, input, member.id);
      return reply(`Created ${task.key}: ${task.title}`, { task });
    },
  }),
  defineTool({
    name: 'update_task',
    title: 'Update task',
    description:
      'Change any task fields: title, status, priority, assigneeId (null to unassign), dates, labels, description, estimate, recurrence. Send only what changes.',
    access: 'write',
    input: scoped({ task: taskRef, ...updateTaskInputSchema.shape }),
    run: async (call, args) => {
      const { task: ref, ...patch } = fieldsOf(args);
      const { workspace, member } = await call.scope('task:write');
      const { repositories } = call.session.deps;
      const task = await updateTask(repositories, workspace, await taskIdOf(repositories, workspace.id, ref), patch, member.id);
      return reply(`Updated ${task.key}: ${task.title}`, { task });
    },
  }),
  defineTool({
    name: 'bulk_update_tasks',
    title: 'Update several tasks',
    description: 'Set the same status, priority or assignee on up to 200 tasks at once.',
    access: 'write',
    input: scoped({ tasks: taskRefs, ...bulkTaskPatchSchema.shape }),
    run: async (call, args) => {
      const { tasks: refs, ...fields } = fieldsOf(args);
      const { workspace, member } = await call.scope('task:write');
      const { repositories } = call.session.deps;
      const patch = parseBody(bulkTaskPatchSchema, fields);
      const ids = await Promise.all(refs.map(ref => taskIdOf(repositories, workspace.id, ref)));
      const tasks = await updateTasks(repositories, workspace, ids, patch, member.id);
      return reply(`Updated ${tasks.length} task(s).`, { tasks: tasks.map(summaryOf) });
    },
  }),
  defineTool({
    name: 'delete_task',
    title: 'Delete task',
    description: 'Delete a task and its comments. This cannot be undone.',
    access: 'destructive',
    input: scoped({ task: taskRef }),
    run: async (call, args) => {
      const { workspace, member } = await call.scope('task:write');
      const { repositories } = call.session.deps;
      const id = await taskIdOf(repositories, workspace.id, args.task);
      await deleteTask(repositories, workspace, id, member.id);
      return reply(`Deleted ${args.task}.`, { deleted: id });
    },
  }),
  defineTool({
    name: 'bulk_delete_tasks',
    title: 'Delete several tasks',
    description: 'Delete up to 200 tasks at once. This cannot be undone.',
    access: 'destructive',
    input: scoped({ tasks: taskRefs }),
    run: async (call, args) => {
      const { workspace, member } = await call.scope('task:write');
      const { repositories } = call.session.deps;
      const ids = await Promise.all(args.tasks.map(ref => taskIdOf(repositories, workspace.id, ref)));
      const deleted = await deleteTasks(repositories, workspace, ids, member.id);
      return reply(`Deleted ${deleted} task(s).`, { deleted });
    },
  }),
];

export { taskIdOf };
