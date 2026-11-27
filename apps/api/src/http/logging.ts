import type { MiddlewareHandler } from 'hono';
import { requestId } from 'hono/request-id';
import type { Identity } from './auth';
import type { Scope } from './context';
import { log } from '../shared/log';

const QUIET_PATHS = new Set(['/health', '/ready']);

export const withRequestId = requestId({ headerName: 'X-Request-Id' });

export const requestLogger: MiddlewareHandler = async (context, next) => {
  const started = performance.now();
  await next();
  if (QUIET_PATHS.has(context.req.path)) return;
  const identity = context.get('identity') as Identity | undefined;
  const scope = context.get('scope') as Scope | undefined;
  log(context.res.status >= 500 ? 'error' : 'info', 'request', {
    requestId: context.get('requestId'),
    method: context.req.method,
    path: context.req.path,
    status: context.res.status,
    durationMs: Math.round(performance.now() - started),
    userId: identity?.userId,
    workspaceId: scope?.workspace.id,
  });
};
