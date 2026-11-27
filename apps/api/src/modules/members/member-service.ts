import type { Member, Role, UpdateMemberInput } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { AppError, notFound } from '../../http/errors';
import { emit } from '../../shared/events/bus';

export function listMembers(repositories: Repositories, workspaceId: string): Promise<Member[]> {
  return repositories.members.listByWorkspace(workspaceId);
}

export async function getMember(repositories: Repositories, workspaceId: string, id: string): Promise<Member> {
  const member = await repositories.members.findById(workspaceId, id);
  if (!member) throw notFound('Member');
  return member;
}

export async function updateMember(repositories: Repositories, workspaceId: string, id: string, input: UpdateMemberInput): Promise<Member> {
  const updated = await repositories.members.update(workspaceId, id, input);
  if (!updated) throw notFound('Member');
  return updated;
}

// A workspace always keeps at least one admin, and nobody removes or demotes themselves by accident.
export async function assertAdminChange(repositories: Repositories, actor: Member, target: Member, nextRole: Role | null): Promise<void> {
  if (target.id === actor.id) throw new AppError(400, nextRole ? 'You cannot change your own role' : 'You cannot remove yourself');
  if (target.role !== 'admin' || nextRole === 'admin') return;
  const admins = (await repositories.members.listByWorkspace(target.workspaceId)).filter(member => member.role === 'admin');
  if (admins.length <= 1) throw new AppError(409, 'A workspace needs at least one admin');
}

export async function purgeMember(repositories: Repositories, workspaceId: string, id: string): Promise<void> {
  const [tasks, teams] = await Promise.all([repositories.tasks.list(workspaceId, { assigneeId: [id] }), repositories.teams.listByWorkspace(workspaceId)]);
  await Promise.all([
    ...tasks.map(task => repositories.tasks.update(workspaceId, task.id, { assigneeId: null })),
    ...teams
      .filter(team => team.memberIds.includes(id))
      .map(team => repositories.teams.update(workspaceId, team.id, { memberIds: team.memberIds.filter(memberId => memberId !== id) })),
  ]);
  await repositories.members.remove(workspaceId, id);
  emit(workspaceId, { type: 'member.removed', payload: id });
}
