import { Hono } from 'hono';
import type { Repositories } from '../../ports/repositories';
import { listNotifications, markAllRead, markRead } from './notification-service';

export function notificationRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/', async context => {
    const { member } = context.get('scope');
    const unread = context.req.query('unread') === 'true';
    return context.json(await listNotifications(repositories, member.id, unread));
  });

  routes.patch('/:id/read', async context => {
    const { member } = context.get('scope');
    return context.json(await markRead(repositories, member.id, context.req.param('id')));
  });

  routes.post('/read-all', async context => {
    const { member } = context.get('scope');
    const count = await markAllRead(repositories, member.id);
    return context.json({ updated: count });
  });

  return routes;
}
