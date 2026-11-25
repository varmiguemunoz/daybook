import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { bulkTaskIdsSchema, bulkTaskPatchSchema, createTaskInputSchema, taskQuerySchema, updateTaskInputSchema, type TaskQuery } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { permit } from '../../http/actor';
import { parseBody, parseQuery, readJson } from '../../http/validate';
import { createTask, deleteTask, getTask, listTasks, updateTask } from './task-service';
import { deleteTasks, updateTasks } from './task-bulk-service';

const bulkUpdateSchema = z.object({ ids: bulkTaskIdsSchema, patch: bulkTaskPatchSchema });
const bulkDeleteSchema = z.object({ ids: bulkTaskIdsSchema });

const MULTI_VALUE_KEYS = new Set(['status', 'priority', 'assigneeId', 'label']);

function parseTaskQuery(context: Context): TaskQuery {
  const raw: Record<string, string | string[]> = {};

  for (const [key, values] of Object.entries(context.req.queries())) {
    if (values.length === 0) continue;
    raw[key] = MULTI_VALUE_KEYS.has(key) ? values : (values.at(0) ?? '');
  }

  return parseQuery(taskQuerySchema, raw);
}

function registerBulkRoutes(routes: Hono, repositories: Repositories): void {
  routes.patch('/', permit('task:write'), async context => {
    const { workspace, member } = context.get('scope');
    const { ids, patch } = parseBody(bulkUpdateSchema, await readJson(context));
    return context.json(await updateTasks(repositories, workspace, ids, patch, member.id));
  });

  routes.delete('/', permit('task:write'), async context => {
    const { workspace, member } = context.get('scope');
    const { ids } = parseBody(bulkDeleteSchema, await readJson(context));
    return context.json({ deleted: await deleteTasks(repositories, workspace, ids, member.id) });
  });
}

export function taskRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/', async context => {
    const { workspace } = context.get('scope');
    return context.json(await listTasks(repositories, workspace.id, parseTaskQuery(context)));
  });

  routes.get('/:id', async context => {
    const { workspace } = context.get('scope');
    return context.json(await getTask(repositories, workspace.id, context.req.param('id')));
  });

  routes.post('/', permit('task:write'), async context => {
    const { workspace, member } = context.get('scope');
    const input = parseBody(createTaskInputSchema, await readJson(context));
    return context.json(await createTask(repositories, workspace, input, member.id), 201);
  });

  routes.patch('/:id', permit('task:write'), async context => {
    const { workspace, member } = context.get('scope');
    const input = parseBody(updateTaskInputSchema, await readJson(context));
    return context.json(await updateTask(repositories, workspace, context.req.param('id'), input, member.id));
  });

  routes.delete('/:id', permit('task:write'), async context => {
    const { workspace, member } = context.get('scope');
    await deleteTask(repositories, workspace, context.req.param('id'), member.id);
    return context.body(null, 204);
  });

  registerBulkRoutes(routes, repositories);
  return routes;
}
