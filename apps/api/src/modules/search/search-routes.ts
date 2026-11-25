import { Hono } from 'hono';
import type { Repositories } from '../../ports/repositories';
import { requestContext } from '../../http/context';
import { search } from './search-service';

export function searchRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/', async context => {
    const { workspace } = await requestContext(repositories, context);
    const query = context.req.query('q') ?? '';
    return context.json(await search(repositories, workspace.id, query));
  });

  return routes;
}
