import { Hono } from 'hono';
import { createCalendarEventInputSchema, updateCalendarEventInputSchema } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { permit } from '../../http/actor';
import { parseBody, readJson } from '../../http/validate';
import { createEvent, deleteEvent, listEvents, updateEvent } from './event-service';

export function eventRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/', async context => {
    const { workspace } = context.get('scope');
    const from = context.req.query('from');
    const to = context.req.query('to');
    return context.json(await listEvents(repositories, workspace.id, from, to));
  });

  routes.post('/', permit('task:write'), async context => {
    const { workspace, member } = context.get('scope');
    const input = parseBody(createCalendarEventInputSchema, await readJson(context));
    return context.json(await createEvent(repositories, workspace.id, member.id, input), 201);
  });

  routes.patch('/:id', permit('task:write'), async context => {
    const { workspace } = context.get('scope');
    const input = parseBody(updateCalendarEventInputSchema, await readJson(context));
    return context.json(await updateEvent(repositories, workspace.id, context.req.param('id'), input));
  });

  routes.delete('/:id', permit('task:write'), async context => {
    const { workspace } = context.get('scope');
    await deleteEvent(repositories, workspace.id, context.req.param('id'));
    return context.body(null, 204);
  });

  return routes;
}
