import { Hono } from 'hono';
import { createInvitationInputSchema } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { requestContext } from '../../http/context';
import { requirePermission } from '../../http/actor';
import { parseBody, readJson } from '../../http/validate';
import { acceptInvitation, createInvitation, listInvitations } from './invitation-service';

export function invitationRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/', async context => {
    const { workspace } = await requestContext(repositories, context);
    return context.json(await listInvitations(repositories, workspace.id));
  });

  routes.post('/', async context => {
    const { workspace, member } = await requestContext(repositories, context);
    requirePermission(member, 'member:invite');
    const input = parseBody(createInvitationInputSchema, await readJson(context));
    return context.json(await createInvitation(repositories, workspace, member, input), 201);
  });

  routes.post('/:token/accept', async context => {
    const result = await acceptInvitation(repositories, context.req.param('token'));
    return context.json(result);
  });

  return routes;
}
