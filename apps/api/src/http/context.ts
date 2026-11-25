import type { Context } from 'hono';
import type { Member, Workspace } from '@gr8r/domain';
import type { Repositories } from '../ports/repositories';
import { isCurrent, roleOf, syncMember, syncWorkspace } from '../modules/identity/identity-service';

export async function requestContext(repositories: Repositories, context: Context): Promise<{ workspace: Workspace; member: Member }> {
  const identity = context.get('identity');
  const workspace = (await repositories.workspaces.findByClerkOrgId(identity.orgId)) ?? (await syncWorkspace(repositories, identity.orgId, identity.orgName));

  const profile = { clerkUserId: identity.userId, name: identity.name, email: identity.email, role: roleOf(identity.orgRole) };
  const existing = await repositories.members.findByClerkUserId(workspace.id, identity.userId);
  const member = isCurrent(existing, profile) ? existing : await syncMember(repositories, workspace.id, profile);

  return { workspace, member };
}
