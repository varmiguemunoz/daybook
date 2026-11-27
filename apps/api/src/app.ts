import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { Repositories } from './ports/repositories';
import { AppError } from './http/errors';
import { memoryHitCounter, rateLimit, type HitCounter } from './http/rate-limit';
import { requestLogger, withRequestId } from './http/logging';
import { log } from './shared/log';
import { taskRoutes } from './modules/tasks/task-routes';
import { workspaceRoutes } from './modules/workspace/workspace-routes';
import { memberRoutes, type RemoveMembership } from './modules/members/member-routes';
import type { ConfirmMembership } from './http/auth';
import { scope } from './http/context';
import { teamRoutes } from './modules/teams/team-routes';
import { commentRoutes } from './modules/comments/comment-routes';
import { notificationRoutes } from './modules/notifications/notification-routes';
import { streamRoutes } from './modules/realtime/stream-routes';
import { searchRoutes } from './modules/search/search-routes';
import { activityRoutes } from './modules/activity/activity-routes';
import { clerkWebhookRoutes } from './modules/webhooks/clerk-routes';
import { folderRoutes } from './modules/folders/folder-routes';
import { noteRoutes } from './modules/notes/note-routes';
import { mcpRoutes, type McpRouteOptions } from './modules/mcp/mcp-routes';

export interface AppDependencies {
  repositories: Repositories;
  authenticate: MiddlewareHandler;
  removeMembership: RemoveMembership;
  confirmMembership: ConfirmMembership;
  allowedOrigins: string[];
  webhookSigningSecret: string;
  // Readiness of the backing services; load balancers send traffic only when it is true.
  ready?: () => Promise<boolean>;
  // Shared request counter for the rate limit; defaults to one kept in this process.
  countHit?: HitCounter;
  // MCP endpoint for AI assistants; left out in tests and when Clerk OAuth is not configured.
  mcp?: McpRouteOptions;
}

const BODY_LIMIT_BYTES = 1024 * 1024;
function apiRoutes(repositories: Repositories, removeMembership: RemoveMembership): Hono {
  const api = new Hono();
  api.route('/tasks', taskRoutes(repositories));
  api.route('/', workspaceRoutes(repositories));
  api.route('/members', memberRoutes(repositories, removeMembership));
  api.route('/teams', teamRoutes(repositories));
  api.route('/comments', commentRoutes(repositories));
  api.route('/events/stream', streamRoutes());
  api.route('/notifications', notificationRoutes(repositories));
  api.route('/search', searchRoutes(repositories));
  api.route('/activity', activityRoutes(repositories));
  api.route('/folders', folderRoutes(repositories));
  api.route('/notes', noteRoutes(repositories));
  return api;
}

function handleError(error: Error, context: Context) {
  if (error instanceof AppError) {
    return context.json({ error: { message: error.message, issues: error.issues, code: error.code } }, error.status);
  }

  log('error', 'unhandled error', { requestId: context.get('requestId'), path: context.req.path, error: error.message, stack: error.stack });
  return context.json({ error: { message: 'Unexpected server error', issues: null } }, 500);
}

export function createApp(dependencies: AppDependencies): Hono {
  const {
    repositories,
    authenticate,
    removeMembership,
    confirmMembership,
    allowedOrigins,
    webhookSigningSecret,
    ready,
    countHit = memoryHitCounter(),
  } = dependencies;
  const app = new Hono();

  app.use('*', withRequestId, requestLogger, secureHeaders());
  app.get('/health', context => context.json({ status: 'ok', service: 'daybook-api' }));
  app.get('/ready', async context => ((await (ready?.() ?? true)) ? context.json({ status: 'ready' }) : context.json({ status: 'unavailable' }, 503)));
  app.route('/webhooks/clerk', clerkWebhookRoutes(repositories, webhookSigningSecret, confirmMembership));
  if (dependencies.mcp) app.route('/', mcpRoutes(dependencies.mcp));

  app.use('/api/*', cors({ origin: allowedOrigins, allowHeaders: ['authorization', 'content-type'], exposeHeaders: ['X-Request-Id'] }));
  app.use(
    '/api/*',
    bodyLimit({ maxSize: BODY_LIMIT_BYTES, onError: context => context.json({ error: { message: 'Request body is too large', issues: null } }, 413) }),
  );
  app.use('/api/*', authenticate, rateLimit(countHit), scope(repositories, confirmMembership));
  app.route('/api', apiRoutes(repositories, removeMembership));

  app.notFound(context => context.json({ error: { message: `No route for ${context.req.path}`, issues: null } }, 404));
  app.onError(handleError);

  return app;
}
