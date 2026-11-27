import { Hono } from 'hono';
import { streamSSE, type SSEStreamingApi } from 'hono/streaming';
import type { Member } from '@daybook/domain';
import { subscribe, type BusEvent } from '../../shared/events/bus';

const HEARTBEAT_MS = 25_000;

function endsAccess(event: BusEvent, member: Member): boolean {
  if (event.type === 'server.shutdown' || event.type === 'workspace.deleted') return true;
  return event.type === 'member.removed' && event.payload === member.id;
}

function relay(stream: SSEStreamingApi, workspaceId: string, member: Member): Promise<void> {
  return new Promise(resolve => {
    const unsubscribe = subscribe(workspaceId, event => {
      if (endsAccess(event, member)) return close();
      stream.writeSSE({ data: JSON.stringify(event), event: event.type }).catch(close);
    });
    const heartbeat = setInterval(() => stream.writeSSE({ data: 'ping', event: 'heartbeat' }).catch(close), HEARTBEAT_MS);
    function close(): void {
      clearInterval(heartbeat);
      unsubscribe();
      resolve();
    }
    stream.onAbort(close);
    stream.writeSSE({ data: JSON.stringify({ type: 'connected', workspaceId }), event: 'connected' }).catch(close);
  });
}

export function streamRoutes(): Hono {
  const routes = new Hono();

  routes.get('/', async context => {
    const { workspace, member } = context.get('scope');
    return streamSSE(context, stream => relay(stream, workspace.id, member));
  });

  return routes;
}
