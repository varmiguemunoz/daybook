import { Hono, type Context } from 'hono';
import { createTaskInputSchema, taskQuerySchema, updateTaskInputSchema, type TaskQuery } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { requestContext } from '../../http/context';
import { requirePermission } from '../../http/actor';
import { parseBody, parseQuery, readJson } from '../../http/validate';
import { createTask, deleteTask, getTask, listTasks, updateTask } from './task-service';

const MULTI_VALUE_KEYS = new Set(['status', 'priority', 'assigneeId', 'label']);

function parseTaskQuery(context: Context): TaskQuery {
  const raw: Record<string, string | string[]> = {};

  for (const [key, values] of Object.entries(context.req.queries())) {
    if (values.length === 0) continue;
    raw[key] = MULTI_VALUE_KEYS.has(key) ? values : (values.at(0) ?? '');
  }

  return parseQuery(taskQuerySchema, raw);
}

export function taskRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/', async context => {
    const { workspace } = await requestContext(repositories, context);
    return context.json(await listTasks(repositories, workspace.id, parseTaskQuery(context)));
  });

  routes.get('/:id', async context => {
    await requestContext(repositories, context);
    return context.json(await getTask(repositories, context.req.param('id')));
  });

  routes.post('/', async context => {
    const { workspace, member } = await requestContext(repositories, context);
    requirePermission(member, 'task:write');
    const input = parseBody(createTaskInputSchema, await readJson(context));
    return context.json(await createTask(repositories, workspace, input, member.id), 201);
  });

  routes.patch('/:id', async context => {
    const { workspace, member } = await requestContext(repositories, context);
    requirePermission(member, 'task:write');
    const input = parseBody(updateTaskInputSchema, await readJson(context));
    return context.json(await updateTask(repositories, workspace, context.req.param('id'), input, member.id));
  });

  routes.delete('/:id', async context => {
    const { workspace, member } = await requestContext(repositories, context);
    requirePermission(member, 'task:write');
    await deleteTask(repositories, workspace, context.req.param('id'), member.id);
    return context.body(null, 204);
  });

  return routes;
}
