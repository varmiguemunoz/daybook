import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { Repositories } from './ports/repositories';
import { AppError } from './http/errors';
import { taskRoutes } from './modules/tasks/task-routes';
import { workspaceRoutes } from './modules/workspace/workspace-routes';
import { memberRoutes } from './modules/members/member-routes';
import { teamRoutes } from './modules/teams/team-routes';
import { commentRoutes } from './modules/comments/comment-routes';
import { eventRoutes } from './modules/events/event-routes';
import { fileRoutes } from './modules/files/file-routes';
import { viewRoutes } from './modules/views/view-routes';
import { notificationRoutes } from './modules/notifications/notification-routes';
import { streamRoutes } from './modules/realtime/stream-routes';
import { searchRoutes } from './modules/search/search-routes';
import { clerkWebhookRoutes } from './modules/webhooks/clerk-routes';

export interface AppDependencies {
  repositories: Repositories;
  authenticate: MiddlewareHandler;
  allowedOrigins: string[];
  webhookSigningSecret: string;
}

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

function apiRoutes(repositories: Repositories): Hono {
  const api = new Hono();
  api.route('/tasks', taskRoutes(repositories));
  api.route('/', workspaceRoutes(repositories));
  api.route('/members', memberRoutes(repositories));
  api.route('/teams', teamRoutes(repositories));
  api.route('/comments', commentRoutes(repositories));
  api.route('/events/stream', streamRoutes(repositories));
  api.route('/events', eventRoutes(repositories));
  api.route('/files', fileRoutes(repositories));
  api.route('/views', viewRoutes(repositories));
  api.route('/notifications', notificationRoutes(repositories));
  api.route('/search', searchRoutes(repositories));
  return api;
}

function handleError(error: Error, context: Context) {
  if (error instanceof AppError) {
    return context.json({ error: { message: error.message, issues: error.issues } }, error.status);
  }

  console.error('[api] unhandled error', error);
  return context.json({ error: { message: 'Unexpected server error', issues: null } }, 500);
}

export function createApp({ repositories, authenticate, allowedOrigins, webhookSigningSecret }: AppDependencies): Hono {
  const app = new Hono();

  app.use('*', secureHeaders());
  app.get('/health', context => context.json({ status: 'ok', service: 'gr8r-api' }));
  app.route('/webhooks/clerk', clerkWebhookRoutes(repositories, webhookSigningSecret));

  app.use('/api/*', cors({ origin: allowedOrigins, credentials: true, allowHeaders: ['authorization', 'content-type'] }));
  app.use('/api/*', authenticate, rateLimit);
  app.route('/api', apiRoutes(repositories));

  app.notFound(context => context.json({ error: { message: `No route for ${context.req.path}`, issues: null } }, 404));
  app.onError(handleError);

  return app;
}
