import { randomUUID } from 'node:crypto';
import { memberSchema, workspaceSchema, type Member, type Role, type Workspace } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import type { ConfirmMembership, Identity } from '../../http/auth';
import { organizationRequired } from '../../http/errors';

const ROLE_BY_CLERK_ROLE: Record<string, Role> = { 'org:admin': 'admin', 'org:member': 'member' };
const WORKSPACE_COLOR = '#1D1C1A';
const MEMBER_COLOR = '#6B7280';

export interface MemberProfile {
  clerkUserId: string;
  name: string;
  email: string;
  role: Role;
}

export function roleOf(clerkRole: string): Role {
  return ROLE_BY_CLERK_ROLE[clerkRole] ?? 'member';
}

export function isCurrent(member: Member | null, profile: MemberProfile): member is Member {
  return member?.status === 'active' && member.role === profile.role && member.name === profile.name && member.email === profile.email;
}

export function syncWorkspace(repositories: Repositories, clerkOrgId: string, name: string): Promise<Workspace> {
  const workspace = workspaceSchema.parse({ id: `w_${randomUUID()}`, clerkOrgId, name, color: WORKSPACE_COLOR, createdAt: Date.now() });
  return repositories.workspaces.upsert(workspace, { name });
}

export function syncMember(repositories: Repositories, workspaceId: string, profile: MemberProfile): Promise<Member> {
  const patch = { name: profile.name, email: profile.email, role: profile.role, status: 'active' as const };
  const member = memberSchema.parse({ id: `m_${randomUUID()}`, workspaceId, clerkUserId: profile.clerkUserId, color: MEMBER_COLOR, ...patch });
  return repositories.members.upsert(member, patch);
}

export interface Scope {
  workspace: Workspace;
  member: Member;
}

// Finds or creates the workspace and member for a signed-in identity; the REST API and the MCP server share it.
export async function resolveScope(repositories: Repositories, identity: Identity, confirmMembership: ConfirmMembership): Promise<Scope> {
  const known = await repositories.workspaces.findByClerkOrgId(identity.orgId);
  const existing = known ? await repositories.members.findByClerkUserId(known.id, identity.userId) : null;

  // Session tokens outlive a removal by up to a minute, so new members are confirmed with Clerk before they are created.
  if (!existing && !(await confirmMembership(identity.orgId, identity.userId))) throw organizationRequired();

  const workspace = known ?? (await syncWorkspace(repositories, identity.orgId, identity.orgName));
  const profile = { clerkUserId: identity.userId, name: identity.name, email: identity.email, role: roleOf(identity.orgRole) };
  const member = isCurrent(existing, profile) ? existing : await syncMember(repositories, workspace.id, profile);
  return { workspace, member };
}
