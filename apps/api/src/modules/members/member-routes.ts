import { Hono } from 'hono';
import { memberSchema, type Member } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { requestContext } from '../../http/context';
import { requirePermission } from '../../http/actor';
import { parseBody, readJson } from '../../http/validate';
import { changeRole, deactivateMember, getMember, updateMember } from './member-service';

export function memberRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/:id', async context => {
    await requestContext(repositories, context);
    return context.json(await getMember(repositories, context.req.param('id')));
  });

  routes.patch('/:id', async context => {
    const { member: actor } = await requestContext(repositories, context);
    requirePermission(actor, 'workspace:manage');
    const input = parseBody(memberSchema.partial(), await readJson(context));
    return context.json(await updateMember(repositories, context.req.param('id'), input as Partial<Member>));
  });

  routes.patch('/:id/role', async context => {
    const { workspace, member: actor } = await requestContext(repositories, context);
    requirePermission(actor, 'role:manage');
    const body = await readJson(context);
    const role = (body as { role: Member['role'] }).role;
    return context.json(await changeRole(repositories, workspace.id, context.req.param('id'), role, actor.id));
  });

  routes.delete('/:id', async context => {
    const { workspace, member: actor } = await requestContext(repositories, context);
    requirePermission(actor, 'role:manage');
    await deactivateMember(repositories, workspace.id, context.req.param('id'), actor.id);
    return context.body(null, 204);
  });

  return routes;
}
