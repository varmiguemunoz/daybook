import { Hono } from 'hono';
import { createSavedViewInputSchema, updateSavedViewInputSchema } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { parseBody, readJson } from '../../http/validate';
import { createView, deleteView, listViews, updateView } from './view-service';

export function viewRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/', async context => {
    const { workspace, member } = context.get('scope');
    const ownerId = context.req.query('ownerId') ?? member.id;
    return context.json(await listViews(repositories, workspace.id, ownerId));
  });

  routes.post('/', async context => {
    const { workspace, member } = context.get('scope');
    const input = parseBody(createSavedViewInputSchema, await readJson(context));
    return context.json(await createView(repositories, workspace.id, { ...input, ownerId: member.id }), 201);
  });

  routes.patch('/:id', async context => {
    const { workspace, member } = context.get('scope');
    const input = parseBody(updateSavedViewInputSchema, await readJson(context));
    return context.json(await updateView(repositories, workspace.id, context.req.param('id'), member.id, input));
  });

  routes.delete('/:id', async context => {
    const { workspace, member } = context.get('scope');
    await deleteView(repositories, workspace.id, context.req.param('id'), member.id);
    return context.body(null, 204);
  });

  return routes;
}
