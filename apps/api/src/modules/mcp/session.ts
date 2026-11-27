import type { Permission } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import type { Directory, OrganizationRef, Profile } from '../../http/directory';
import type { RemoveMembership } from '../members/member-routes';
import { requirePermission } from '../../http/actor';
import { AppError } from '../../http/errors';
import { resolveScope, type Scope } from '../identity/identity-service';

export interface McpDeps {
  repositories: Repositories;
  directory: Directory;
  removeMembership: RemoveMembership;
}

export interface Session {
  deps: McpDeps;
  userId: string;
  organizations(): Promise<OrganizationRef[]>;
  // Resolves the workspace a tool call names (Clerk organization id, workspace id or name) and checks the permission.
  scope(workspaceRef: string | undefined, permission?: Permission): Promise<Scope>;
}

function memo<T>(load: () => Promise<T>): () => Promise<T> {
  let value: Promise<T> | null = null;
  return () => (value ??= load());
}

async function pick(deps: McpDeps, organizations: OrganizationRef[], ref: string | undefined): Promise<OrganizationRef> {
  if (!organizations.length) throw new AppError(403, 'You do not belong to any workspace yet. Create one in the Daybook app first.');
  if (!ref) {
    if (organizations.length === 1) return organizations[0] as OrganizationRef;
    throw new AppError(422, `Pass workspace: you belong to ${organizations.map(org => `"${org.orgName}"`).join(', ')}.`);
  }
  const needle = ref.trim().toLowerCase();
  const byId = organizations.find(org => org.orgId === ref || org.orgName.toLowerCase() === needle);
  if (byId) return byId;
  const workspaces = await Promise.all(organizations.map(org => deps.repositories.workspaces.findByClerkOrgId(org.orgId)));
  const index = workspaces.findIndex(workspace => workspace?.id === ref);
  if (index >= 0) return organizations[index] as OrganizationRef;
  throw new AppError(404, `No workspace named "${ref}" for this account. Call list_workspaces to see yours.`);
}

export function createSession(deps: McpDeps, userId: string): Session {
  const organizations = memo(() => deps.directory.organizationsOf(userId));
  const profile = memo<Profile>(() => deps.directory.profileOf(userId));

  return {
    deps,
    userId,
    organizations,
    async scope(ref, permission) {
      const [org, me] = await Promise.all([organizations().then(list => pick(deps, list, ref)), profile()]);
      const identity = { userId, orgId: org.orgId, orgRole: org.orgRole, orgName: org.orgName, ...me };
      // Membership was just read from Clerk, so there is nothing left to confirm.
      const scope = await resolveScope(deps.repositories, identity, async () => true);
      if (permission) requirePermission(scope.member, permission);
      return scope;
    },
  };
}
