import { createClient } from 'redis';
import { deliver, type BusEvent, type BusTransport } from '../../shared/events/bus';
import type { HitCounter } from '../../http/rate-limit';

const CHANNEL_PREFIX = 'daybook:ws:';
const RATE_PREFIX = 'daybook:rate:';

export interface RedisServices {
  transport: BusTransport;
  countHit: HitCounter;
  ready(): Promise<boolean>;
  close(): Promise<void>;
}

function onError(role: string) {
  return (error: Error) => console.error(JSON.stringify({ level: 'error', msg: `redis ${role} error`, error: error.message }));
}

// One client publishes and counts, a second one listens: a Redis connection in subscribe mode cannot run other commands.
export async function connectRedis(url: string): Promise<RedisServices> {
  const client = createClient({ url });
  const subscriber = client.duplicate();
  client.on('error', onError('client'));
  subscriber.on('error', onError('subscriber'));
  await Promise.all([client.connect(), subscriber.connect()]);

  await subscriber.pSubscribe(`${CHANNEL_PREFIX}*`, (message, channel) => {
    deliver(channel.slice(CHANNEL_PREFIX.length), JSON.parse(message) as BusEvent);
  });

  return {
    transport: {
      publish: (workspaceId, event) => void client.publish(`${CHANNEL_PREFIX}${workspaceId}`, JSON.stringify(event)).catch(onError('publish')),
    },
    countHit: async (key, windowMs) => {
      const redisKey = `${RATE_PREFIX}${key}`;
      const count = await client.incr(redisKey);
      if (count === 1) await client.pExpire(redisKey, windowMs);
      return count;
    },
    ready: async () => client.isReady && subscriber.isReady && (await client.ping()) === 'PONG',
    close: async () => {
      await Promise.allSettled([subscriber.close(), client.close()]);
    },
  };
}
