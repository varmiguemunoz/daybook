import { Hono } from 'hono';
import type { Repositories } from '../../ports/repositories';
import { loadBootstrap } from './workspace-service';

export function workspaceRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/bootstrap', async context => {
    const { workspace, member } = context.get('scope');
    return context.json(await loadBootstrap(repositories, workspace, member));
  });

  return routes;
}
