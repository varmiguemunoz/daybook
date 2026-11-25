import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { clerkMiddleware } from '@clerk/hono';
import type { Repositories } from './ports/repositories';
import { AppError } from './http/errors';
import { taskRoutes } from './modules/tasks/task-routes';
import { workspaceRoutes } from './modules/workspace/workspace-routes';
import { invitationRoutes } from './modules/invitations/invitation-routes';
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
import { requestContext } from './http/context';
import { requirePermission } from './http/actor';
import { parseBody, readJson } from './http/validate';
import { updateWorkspace, createWorkspace } from './modules/workspace/workspace-service';
import { updateWorkspaceInputSchema, createWorkspaceInputSchema } from '@gr8r/domain';

export interface AppDependencies {
  repositories: Repositories;
}

const rateBuckets = new Map<string, { count: number; reset: number }>();

function workspacesRoutes(repositories: Repositories): Hono {
  const routes = new Hono();
  routes.get('/', async context => {
    const { workspace } = await requestContext(repositories, context);
    return context.json(workspace);
  });
  routes.post('/', async context => {
    const { member } = await requestContext(repositories, context);
    requirePermission(member, 'workspace:manage');
    const input = parseBody(createWorkspaceInputSchema, await readJson(context));
    const created = await createWorkspace(repositories, input);
    return context.json(created, 201);
  });
  routes.patch('/:id', async context => {
    const { member } = await requestContext(repositories, context);
    requirePermission(member, 'workspace:manage');
    const input = parseBody(updateWorkspaceInputSchema, await readJson(context));
    return context.json(await updateWorkspace(repositories, context.req.param('id'), input));
  });
  return routes;
}
function registerRoutes(api: Hono, repositories: Repositories): void {
  api.route('/tasks', taskRoutes(repositories));
  api.route('/', workspaceRoutes(repositories));
  api.route('/invitations', invitationRoutes(repositories));
  api.route('/members', memberRoutes(repositories));
  api.route('/teams', teamRoutes(repositories));
  api.route('/comments', commentRoutes(repositories));
  api.route('/events', eventRoutes(repositories));
  api.route('/files', fileRoutes(repositories));
  api.route('/views', viewRoutes(repositories));
  api.route('/notifications', notificationRoutes(repositories));
  api.route('/search', searchRoutes(repositories));
  api.route('/events/stream', streamRoutes(repositories));
  api.route('/webhooks/clerk', clerkWebhookRoutes(repositories));
  api.route('/workspaces', workspacesRoutes(repositories));
}
function handleError(error: Error, context: Context) {
  if (error instanceof AppError) {
    return context.json({ error: { message: error.message, issues: error.issues } }, error.status);
  }

  console.error('[api] unhandled error', error);
  return context.json({ error: { message: 'Unexpected server error', issues: null } }, 500);
}

export function createApp({ repositories }: AppDependencies): Hono {
  const app = new Hono();
  const api = new Hono();

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (process.env.CLERK_SECRET_KEY && nodeMajor < 26) {
    app.use('*', clerkMiddleware());
  } else if (process.env.CLERK_SECRET_KEY) {
    console.warn('[api] Clerk disabled: requires Node < 26 (current', process.versions.node, ')');
  }

  app.use('/api/*', cors({ origin: origin => origin ?? '*', credentials: true, allowHeaders: ['content-type', 'x-member-id'] }));
  app.use('/api/*', async (context, next) => {
    const key = context.req.header('x-forwarded-for') ?? context.req.header('x-member-id') ?? 'anon';
    const now = Date.now();
    const bucket = rateBuckets.get(key) ?? { count: 0, reset: now + 60_000 };
    if (now > bucket.reset) {
      bucket.count = 0;
      bucket.reset = now + 60_000;
    }
    bucket.count += 1;
    rateBuckets.set(key, bucket);
    if (bucket.count > 300) {
      return context.json({ error: { message: 'Too many requests' } }, 429);
    }
    await next();
  });
  app.get('/health', context => context.json({ status: 'ok', service: 'gr8r-api' }));

  registerRoutes(api, repositories);
  app.route('/api', api);

  app.notFound(context => context.json({ error: { message: `No route for ${context.req.path}`, issues: null } }, 404));
  app.onError(handleError);

  return app;
}
