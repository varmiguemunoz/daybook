import type { ClerkClient } from '@clerk/backend';
import { isClerkAPIResponseError } from '@clerk/backend/errors';
import type { Role } from '@daybook/domain';
import { AppError } from './errors';

export interface OrganizationRef {
  orgId: string;
  orgName: string;
  orgRole: string;
}

export interface Profile {
  name: string;
  email: string;
}

export interface Invitation {
  orgId: string;
  inviterUserId: string;
  email: string;
  role: Role;
}

// What the MCP server needs from the identity provider: a token names a user, not an organization.
export interface Directory {
  organizationsOf(userId: string): Promise<OrganizationRef[]>;
  profileOf(userId: string): Promise<Profile>;
  invite(invitation: Invitation): Promise<void>;
  setRole(orgId: string, userId: string, role: Role): Promise<void>;
}

const CLERK_ROLE: Record<Role, string> = { admin: 'org:admin', member: 'org:member' };
const MEMBERSHIP_PAGE = 100;

// Clerk's own validation messages (already a member, invalid address) are the clearest thing to show.
async function clerkCall<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (!isClerkAPIResponseError(error) || error.status >= 500) throw error;
    const message = error.errors[0]?.longMessage ?? error.errors[0]?.message ?? 'Clerk rejected the request';
    throw new AppError(error.status === 403 ? 403 : 422, message);
  }
}

export function clerkDirectory(clerk: ClerkClient, appUrl?: string): Directory {
  return {
    async organizationsOf(userId) {
      const memberships = await clerk.users.getOrganizationMembershipList({ userId, limit: MEMBERSHIP_PAGE });
      return memberships.data.map(membership => ({ orgId: membership.organization.id, orgName: membership.organization.name, orgRole: membership.role }));
    },
    async profileOf(userId) {
      const user = await clerk.users.getUser(userId);
      const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? '';
      return { name: user.fullName?.trim() || email, email };
    },
    async invite({ orgId, inviterUserId, email, role }) {
      await clerkCall(() =>
        clerk.organizations.createOrganizationInvitation({
          organizationId: orgId,
          inviterUserId,
          emailAddress: email,
          role: CLERK_ROLE[role],
          redirectUrl: appUrl,
        }),
      );
    },
    async setRole(orgId, userId, role) {
      await clerkCall(() => clerk.organizations.updateOrganizationMembership({ organizationId: orgId, userId, role: CLERK_ROLE[role] }));
    },
  };
}
