import { createClerkClient } from '@clerk/backend';
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

declare module 'hono' {
  interface ContextVariableMap {
    identity: Identity;
  }
}

const profileClaimsSchema = z.object({
  name: z.string().trim().nullish(),
  email: z.email(),
  org_name: z.string().trim().min(1),
});

export function clerkAuth(config: Config): MiddlewareHandler {
  const clerk = createClerkClient({ secretKey: config.CLERK_SECRET_KEY, publishableKey: config.CLERK_PUBLISHABLE_KEY });

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
