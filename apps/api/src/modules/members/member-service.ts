import type { Member } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { notFound } from '../../http/errors';
import { recordActivity } from '../activity/activity-service';

export async function getMember(repositories: Repositories, id: string): Promise<Member> {
  const member = await repositories.members.findById(id);
  if (!member) throw notFound('Member');
  return member;
}

export async function updateMember(repositories: Repositories, id: string, patch: Partial<Member>): Promise<Member> {
  const current = await getMember(repositories, id);
  const updated = await repositories.members.update(current.id, patch);
  if (!updated) throw notFound('Member');
  return updated;
}

export async function changeRole(repositories: Repositories, workspaceId: string, id: string, role: Member['role'], actorId: string): Promise<Member> {
  const updated = await updateMember(repositories, id, { role });
  await recordActivity(repositories, {
    workspaceId,
    actorId,
    verb: 'updated',
    detail: `role:${role}`,
  });
  return updated;
}

export async function deactivateMember(repositories: Repositories, workspaceId: string, id: string, actorId: string): Promise<Member> {
  const updated = await updateMember(repositories, id, { status: 'disabled' });
  await recordActivity(repositories, {
    workspaceId,
    actorId,
    verb: 'updated',
    detail: `deactivated:${id}`,
  });
  return updated;
}

export async function removeMember(repositories: Repositories, id: string): Promise<void> {
  const removed = await repositories.members.remove(id);
  if (!removed) throw notFound('Member');
}
