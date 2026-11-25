import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { Repositories } from './ports/repositories';
import { AppError } from './http/errors';
import { taskRoutes } from './modules/tasks/task-routes';
import { workspaceRoutes } from './modules/workspace/workspace-routes';
import { memberRoutes, type RemoveMembership } from './modules/members/member-routes';
import type { ConfirmMembership } from './http/auth';
import { scope } from './http/context';
import { teamRoutes } from './modules/teams/team-routes';
import { commentRoutes } from './modules/comments/comment-routes';
import { eventRoutes } from './modules/events/event-routes';
import { viewRoutes } from './modules/views/view-routes';
import { notificationRoutes } from './modules/notifications/notification-routes';
import { streamRoutes } from './modules/realtime/stream-routes';
import { searchRoutes } from './modules/search/search-routes';
import { activityRoutes } from './modules/activity/activity-routes';
import { clerkWebhookRoutes } from './modules/webhooks/clerk-routes';

export interface AppDependencies {
  repositories: Repositories;
  authenticate: MiddlewareHandler;
  removeMembership: RemoveMembership;
  confirmMembership: ConfirmMembership;
  allowedOrigins: string[];
  webhookSigningSecret: string;
}

const BODY_LIMIT_BYTES = 1024 * 1024;
const RATE_LIMIT = 300;
const RATE_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, { count: number; reset: number }>();

const rateLimit: MiddlewareHandler = async (context, next) => {
  const key = context.get('identity').userId;
  const now = Date.now();
  const current = rateBuckets.get(key);
  const bucket = current && now <= current.reset ? current : { count: 0, reset: now + RATE_WINDOW_MS };
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  if (bucket.count > RATE_LIMIT) throw new AppError(429, 'Too many requests');
  await next();
};

function apiRoutes(repositories: Repositories, removeMembership: RemoveMembership): Hono {
  const api = new Hono();
  api.route('/tasks', taskRoutes(repositories));
  api.route('/', workspaceRoutes(repositories));
  api.route('/members', memberRoutes(repositories, removeMembership));
  api.route('/teams', teamRoutes(repositories));
  api.route('/comments', commentRoutes(repositories));
  api.route('/events/stream', streamRoutes());
  api.route('/events', eventRoutes(repositories));
  api.route('/views', viewRoutes(repositories));
  api.route('/notifications', notificationRoutes(repositories));
  api.route('/search', searchRoutes(repositories));
  api.route('/activity', activityRoutes(repositories));
  return api;
}

function handleError(error: Error, context: Context) {
  if (error instanceof AppError) {
    return context.json({ error: { message: error.message, issues: error.issues, code: error.code } }, error.status);
  }

  console.error('[api] unhandled error', error);
  return context.json({ error: { message: 'Unexpected server error', issues: null } }, 500);
}

export function createApp({ repositories, authenticate, removeMembership, confirmMembership, allowedOrigins, webhookSigningSecret }: AppDependencies): Hono {
  const app = new Hono();

  app.use('*', secureHeaders());
  app.get('/health', context => context.json({ status: 'ok', service: 'daybook-api' }));
  app.route('/webhooks/clerk', clerkWebhookRoutes(repositories, webhookSigningSecret, confirmMembership));

  app.use('/api/*', cors({ origin: allowedOrigins, allowHeaders: ['authorization', 'content-type'] }));
  app.use(
    '/api/*',
    bodyLimit({ maxSize: BODY_LIMIT_BYTES, onError: context => context.json({ error: { message: 'Request body is too large', issues: null } }, 413) }),
  );
  app.use('/api/*', authenticate, rateLimit, scope(repositories, confirmMembership));
  app.route('/api', apiRoutes(repositories, removeMembership));

  app.notFound(context => context.json({ error: { message: `No route for ${context.req.path}`, issues: null } }, 404));
  app.onError(handleError);

  return app;
}
