import type { Member, UpdateMemberInput } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { notFound } from '../../http/errors';

export async function getMember(repositories: Repositories, workspaceId: string, id: string): Promise<Member> {
  const member = await repositories.members.findById(workspaceId, id);
  if (!member) throw notFound('Member');
  return member;
}

export async function updateMember(repositories: Repositories, workspaceId: string, id: string, input: UpdateMemberInput): Promise<Member> {
  const current = await getMember(repositories, workspaceId, id);
  const preferences = input.preferences ? { ...current.preferences, ...input.preferences } : current.preferences;
  const updated = await repositories.members.update(workspaceId, id, { ...input, preferences: preferences as Member['preferences'] });
  if (!updated) throw notFound('Member');
  return updated;
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
}
