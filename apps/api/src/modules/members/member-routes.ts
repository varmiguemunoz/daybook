import { Hono } from 'hono';
import { updateMemberInputSchema, type Member } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { permit, requirePermission } from '../../http/actor';
import { AppError } from '../../http/errors';
import { parseBody, readJson } from '../../http/validate';
import { getMember, listMembers, purgeMember, updateMember } from './member-service';

export type RemoveMembership = (clerkOrgId: string, clerkUserId: string) => Promise<void>;

async function assertRemovable(repositories: Repositories, actor: Member, target: Member): Promise<void> {
  if (target.id === actor.id) throw new AppError(400, 'You cannot remove yourself');
  if (target.role !== 'admin') return;
  const admins = (await repositories.members.listByWorkspace(target.workspaceId)).filter(member => member.role === 'admin');
  if (admins.length <= 1) throw new AppError(409, 'A workspace needs at least one admin');
}

export function memberRoutes(repositories: Repositories, removeMembership: RemoveMembership): Hono {
  const routes = new Hono();

  routes.get('/', async context => context.json(await listMembers(repositories, context.get('scope').workspace.id)));

  routes.get('/:id', async context => {
    const { workspace } = context.get('scope');
    return context.json(await getMember(repositories, workspace.id, context.req.param('id')));
  });

  routes.patch('/:id', async context => {
    const { workspace, member: actor } = context.get('scope');
    const id = context.req.param('id');
    if (id !== actor.id) requirePermission(actor, 'workspace:manage');
    const input = parseBody(updateMemberInputSchema, await readJson(context));
    return context.json(await updateMember(repositories, workspace.id, id, input));
  });

  routes.delete('/:id', permit('workspace:manage'), async context => {
    const { workspace, member: actor } = context.get('scope');
    const target = await getMember(repositories, workspace.id, context.req.param('id'));
    await assertRemovable(repositories, actor, target);
    await removeMembership(workspace.clerkOrgId, target.clerkUserId);
    await purgeMember(repositories, workspace.id, target.id);
    return context.body(null, 204);
  });

  return routes;
}
