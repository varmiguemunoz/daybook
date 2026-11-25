import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { Repositories } from '../../ports/repositories';
import { requestContext } from '../../http/context';
import { subscribe } from '../../shared/events/bus';

export function streamRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/', async context => {
    const { workspace } = await requestContext(repositories, context);

    return streamSSE(context, async stream => {
      const unsubscribe = subscribe(workspace.id, payload => {
        stream.writeSSE({ data: JSON.stringify(payload), event: (payload as { type: string }).type });
      });

      await stream.writeSSE({ data: JSON.stringify({ type: 'connected', workspaceId: workspace.id }), event: 'connected' });

      const heartbeat = setInterval(() => {
        stream.writeSSE({ data: 'ping', event: 'heartbeat' }).catch(() => undefined);
      }, 25000);

      stream.onAbort(() => {
        clearInterval(heartbeat);
        unsubscribe();
      });

      await new Promise(() => undefined);
    });
  });

  return routes;
}
