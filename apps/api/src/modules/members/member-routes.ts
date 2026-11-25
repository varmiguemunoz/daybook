import { Hono } from 'hono';
import { updateMemberInputSchema } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { requestContext } from '../../http/context';
import { requirePermission } from '../../http/actor';
import { parseBody, readJson } from '../../http/validate';
import { getMember, updateMember } from './member-service';

export function memberRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/:id', async context => {
    const { workspace } = await requestContext(repositories, context);
    return context.json(await getMember(repositories, workspace.id, context.req.param('id')));
  });

  routes.patch('/:id', async context => {
    const { workspace, member: actor } = await requestContext(repositories, context);
    const id = context.req.param('id');
    if (id !== actor.id) requirePermission(actor, 'workspace:manage');
    const input = parseBody(updateMemberInputSchema, await readJson(context));
    return context.json(await updateMember(repositories, workspace.id, id, input));
  });

  return routes;
}
