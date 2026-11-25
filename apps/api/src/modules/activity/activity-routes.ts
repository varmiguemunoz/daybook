import { Hono } from 'hono';
import type { Repositories } from '../../ports/repositories';
import { recentActivity } from './activity-service';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function activityLimit(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.trunc(parsed), MAX_LIMIT);
}

export function activityRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/', async context => {
    const { workspace } = context.get('scope');
    return context.json(await recentActivity(repositories, workspace.id, activityLimit(context.req.query('limit'))));
  });

  return routes;
}
