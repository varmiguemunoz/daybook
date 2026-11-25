import { Hono } from 'hono';
import type { Repositories } from '../../ports/repositories';
import { requestContext } from '../../http/context';
import { recentActivity } from '../activity/activity-service';
import { listMembers, loadBootstrap } from './workspace-service';

const DEFAULT_ACTIVITY_LIMIT = 20;
const MAX_ACTIVITY_LIMIT = 100;

function activityLimit(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_ACTIVITY_LIMIT;
  return Math.min(Math.trunc(parsed), MAX_ACTIVITY_LIMIT);
}

export function workspaceRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/bootstrap', async context => {
    const { workspace, member } = await requestContext(repositories, context);
    return context.json(await loadBootstrap(repositories, workspace, member));
  });

  routes.get('/members', async context => {
    const { workspace } = await requestContext(repositories, context);
    return context.json(await listMembers(repositories, workspace.id));
  });

  routes.get('/activity', async context => {
    const { workspace } = await requestContext(repositories, context);
    return context.json(await recentActivity(repositories, workspace.id, activityLimit(context.req.query('limit'))));
  });

  return routes;
}
