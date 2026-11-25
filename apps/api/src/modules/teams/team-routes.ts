import { Hono, type Context } from 'hono';
import { createTeamInputSchema, updateTeamInputSchema } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { requestContext } from '../../http/context';
import { requirePermission } from '../../http/actor';
import { parseBody, readJson } from '../../http/validate';
import { addMemberToTeam, createTeam, deleteTeam, getTeam, listTeams, removeMemberFromTeam, updateTeam } from './team-service';

async function manager(repositories: Repositories, context: Context) {
  const scope = await requestContext(repositories, context);
  requirePermission(scope.member, 'workspace:manage');
  return scope;
}

function registerMemberRoutes(routes: Hono, repositories: Repositories): void {
  routes.post('/:id/members', async context => {
    const { workspace } = await manager(repositories, context);
    const { memberId } = (await readJson(context)) as { memberId: string };
    return context.json(await addMemberToTeam(repositories, workspace.id, context.req.param('id'), memberId));
  });
  routes.delete('/:id/members/:memberId', async context => {
    const { workspace } = await manager(repositories, context);
    return context.json(await removeMemberFromTeam(repositories, workspace.id, context.req.param('id'), context.req.param('memberId')));
  });
}

export function teamRoutes(repositories: Repositories): Hono {
  const routes = new Hono();
  routes.get('/', async context => {
    const { workspace } = await requestContext(repositories, context);
    return context.json(await listTeams(repositories, workspace.id));
  });
  routes.get('/:id', async context => {
    const { workspace } = await requestContext(repositories, context);
    return context.json(await getTeam(repositories, workspace.id, context.req.param('id')));
  });
  routes.post('/', async context => {
    const { workspace, member } = await manager(repositories, context);
    const input = parseBody(createTeamInputSchema, await readJson(context));
    return context.json(await createTeam(repositories, workspace.id, input, member.id), 201);
  });
  routes.patch('/:id', async context => {
    const { workspace } = await manager(repositories, context);
    const input = parseBody(updateTeamInputSchema, await readJson(context));
    return context.json(await updateTeam(repositories, workspace.id, context.req.param('id'), input));
  });
  routes.delete('/:id', async context => {
    const { workspace, member } = await manager(repositories, context);
    await deleteTeam(repositories, workspace.id, context.req.param('id'), member.id);
    return context.body(null, 204);
  });
  registerMemberRoutes(routes, repositories);
  return routes;
}
