import { Hono } from 'hono';
import { z } from 'zod';
import { createTeamInputSchema, idSchema, updateTeamInputSchema } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { permit } from '../../http/actor';
import { parseBody, readJson } from '../../http/validate';
import { addMemberToTeam, createTeam, deleteTeam, getTeam, listTeams, removeMemberFromTeam, updateTeam } from './team-service';

const addMemberSchema = z.object({ memberId: idSchema });
const manage = permit('workspace:manage');

function registerMemberRoutes(routes: Hono, repositories: Repositories): void {
  routes.post('/:id/members', manage, async context => {
    const { workspace } = context.get('scope');
    const { memberId } = parseBody(addMemberSchema, await readJson(context));
    return context.json(await addMemberToTeam(repositories, workspace.id, context.req.param('id'), memberId));
  });
  routes.delete('/:id/members/:memberId', manage, async context => {
    const { workspace } = context.get('scope');
    return context.json(await removeMemberFromTeam(repositories, workspace.id, context.req.param('id'), context.req.param('memberId')));
  });
}

export function teamRoutes(repositories: Repositories): Hono {
  const routes = new Hono();
  routes.get('/', async context => context.json(await listTeams(repositories, context.get('scope').workspace.id)));
  routes.get('/:id', async context => context.json(await getTeam(repositories, context.get('scope').workspace.id, context.req.param('id'))));
  routes.post('/', manage, async context => {
    const { workspace, member } = context.get('scope');
    const input = parseBody(createTeamInputSchema, await readJson(context));
    return context.json(await createTeam(repositories, workspace.id, input, member.id), 201);
  });
  routes.patch('/:id', manage, async context => {
    const input = parseBody(updateTeamInputSchema, await readJson(context));
    return context.json(await updateTeam(repositories, context.get('scope').workspace.id, context.req.param('id'), input));
  });
  routes.delete('/:id', manage, async context => {
    const { workspace, member } = context.get('scope');
    await deleteTeam(repositories, workspace.id, context.req.param('id'), member.id);
    return context.body(null, 204);
  });
  registerMemberRoutes(routes, repositories);
  return routes;
}
