import type { Member, UpdateMemberInput } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { notFound } from '../../http/errors';

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
