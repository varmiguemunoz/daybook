import { Hono } from 'hono';
import { updateWorkspaceInputSchema } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { requestContext } from '../../http/context';
import { requirePermission } from '../../http/actor';
import { parseBody, readJson } from '../../http/validate';
import { recentActivity } from '../activity/activity-service';
import { listMembers, loadBootstrap, updateWorkspace } from './workspace-service';

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

  routes.patch('/:id', async context => {
    const { member } = await requestContext(repositories, context);
    requirePermission(member, 'workspace:manage');
    const input = parseBody(updateWorkspaceInputSchema, await readJson(context));
    return context.json(await updateWorkspace(repositories, context.req.param('id'), input));
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
