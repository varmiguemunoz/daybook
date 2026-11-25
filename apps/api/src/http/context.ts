import type { Context } from 'hono';
import type { Member, Workspace } from '@gr8r/domain';
import type { Repositories } from '../ports/repositories';
import { isCurrent, roleOf, syncMember, syncWorkspace } from '../modules/identity/identity-service';
import { organizationRequired } from './errors';

export async function requestContext(repositories: Repositories, context: Context): Promise<{ workspace: Workspace; member: Member }> {
  const identity = context.get('identity');
  const known = await repositories.workspaces.findByClerkOrgId(identity.orgId);
  const existing = known ? await repositories.members.findByClerkUserId(known.id, identity.userId) : null;

  // Session tokens outlive a removal by up to a minute, so new members are confirmed with Clerk before they are created.
  if (!existing && !(await context.get('confirmMembership')(identity.orgId, identity.userId))) throw organizationRequired();

  const workspace = known ?? (await syncWorkspace(repositories, identity.orgId, identity.orgName));
  const profile = { clerkUserId: identity.userId, name: identity.name, email: identity.email, role: roleOf(identity.orgRole) };
  const member = isCurrent(existing, profile) ? existing : await syncMember(repositories, workspace.id, profile);

  return { workspace, member };
}
