import { createClerkClient, type ClerkClient } from '@clerk/backend';
import { isClerkAPIResponseError } from '@clerk/backend/errors';
import type { MiddlewareHandler } from 'hono';
import { z } from 'zod';
import type { Config } from '../config';
import { AppError, organizationRequired, unauthorized } from './errors';

export interface Identity {
  userId: string;
  orgId: string;
  orgRole: string;
  orgName: string;
  name: string;
  email: string;
}

export type ConfirmMembership = (clerkOrgId: string, clerkUserId: string) => Promise<boolean>;

declare module 'hono' {
  interface ContextVariableMap {
    identity: Identity;
    confirmMembership: ConfirmMembership;
  }
}

const profileClaimsSchema = z.object({
  name: z.string().trim().nullish(),
  email: z.email(),
  org_name: z.string().trim().min(1),
});

export function createClerk(config: Config): ClerkClient {
  return createClerkClient({ secretKey: config.CLERK_SECRET_KEY, publishableKey: config.CLERK_PUBLISHABLE_KEY });
}

export function clerkMembershipRemover(clerk: ClerkClient) {
  return async (organizationId: string, userId: string): Promise<void> => {
    try {
      await clerk.organizations.deleteOrganizationMembership({ organizationId, userId });
    } catch (error) {
      if (!isClerkAPIResponseError(error) || error.status !== 404) throw error;
    }
  };
}

export function clerkMembershipChecker(clerk: ClerkClient): ConfirmMembership {
  return async (organizationId, userId) => {
    const memberships = await clerk.organizations.getOrganizationMembershipList({ organizationId, userId: [userId], limit: 1 });
    return memberships.totalCount > 0;
  };
}

export function clerkAuth(clerk: ClerkClient, config: Config): MiddlewareHandler {
  return async (context, next) => {
    // Node 26 rejects Clerk's proxy over @hono/node-server's lightweight Request, so hand it a native one.
    const request = new Request(context.req.url, { method: context.req.method, headers: context.req.raw.headers });
    const state = await clerk.authenticateRequest(request, { authorizedParties: config.ALLOWED_ORIGINS, acceptsToken: 'session_token' });
    const auth = state.toAuth();
    if (!auth?.userId) throw unauthorized();
    if (!auth.orgId || !auth.orgRole) throw organizationRequired();

    const claims = profileClaimsSchema.safeParse(auth.sessionClaims);
    if (!claims.success) throw new AppError(500, 'Clerk session token is missing the name, email or org_name claims');

    const { name, email, org_name: orgName } = claims.data;
    context.set('identity', { userId: auth.userId, orgId: auth.orgId, orgRole: auth.orgRole, orgName, name: name || email, email });
    await next();
  };
}
