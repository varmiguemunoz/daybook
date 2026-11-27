import type { MiddlewareHandler } from 'hono';
import type { Repositories } from '../ports/repositories';
import { resolveScope, type Scope } from '../modules/identity/identity-service';
import type { ConfirmMembership } from './auth';

export type { Scope };

declare module 'hono' {
  interface ContextVariableMap {
    scope: Scope;
  }
}

export function scope(repositories: Repositories, confirmMembership: ConfirmMembership): MiddlewareHandler {
  return async (context, next) => {
    context.set('scope', await resolveScope(repositories, context.get('identity'), confirmMembership));
    await next();
  };
}
