import { serve, type ServerType } from '@hono/node-server';
import { loadConfig } from './config';
import { createApp } from './app';
import { configureEmail } from './shared/notifications/email';
import { configureQuotas } from './shared/quotas';
import { broadcast, useTransport } from './shared/events/bus';
import { log } from './shared/log';
import { clerkAuth, clerkMembershipChecker, clerkMembershipRemover, createClerk } from './http/auth';
import { clerkDirectory } from './http/directory';
import { memoryHitCounter } from './http/rate-limit';
import type { Repositories } from './ports/repositories';
import type { Config } from './config';
import type { McpRouteOptions } from './modules/mcp/mcp-routes';
import { createMemoryRepositories } from './adapters/memory';
import { createMongoRepositories } from './adapters/mongo';
import { connectRedis } from './adapters/redis';

const SHUTDOWN_GRACE_MS = 10_000;
const state = { stopping: false };

type Probe = { ready(): Promise<boolean> } | null;

async function allReady(probes: Probe[]): Promise<boolean> {
  if (state.stopping) return false;
  const results = await Promise.all(probes.map(probe => (probe ? probe.ready().catch(() => false) : true)));
  return results.every(Boolean);
}

// On SIGTERM (every redeploy) stop taking traffic, end open streams so browsers reconnect elsewhere, then close the connections.
function shutdownOn(server: ServerType, close: () => Promise<unknown>): void {
  function stop(signal: string): void {
    if (state.stopping) return;
    state.stopping = true;
    log('info', 'shutting down', { signal });
    broadcast({ type: 'server.shutdown' });
    setTimeout(() => process.exit(1), SHUTDOWN_GRACE_MS).unref();
    server.close(() => void close().finally(() => process.exit(0)));
  }
  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));
}

function mcpOptions(config: Config, clerk: ReturnType<typeof createClerk>, repositories: Repositories, countHit: McpRouteOptions['countHit']): McpRouteOptions {
  const publicUrl = (config.PUBLIC_API_URL ?? `http://localhost:${config.PORT}`).replace(/\/$/, '');
  return {
    deps: { repositories, directory: clerkDirectory(clerk, config.APP_URL), removeMembership: clerkMembershipRemover(clerk) },
    clerk,
    publishableKey: config.CLERK_PUBLISHABLE_KEY,
    resourceUrl: `${publicUrl}/mcp`,
    countHit,
  };
}

async function main(): Promise<void> {
  const config = loadConfig();
  configureEmail(config);
  configureQuotas(config);

  const mongo = config.PERSISTENCE === 'mongo' ? await createMongoRepositories(config.MONGODB_URI) : null;
  // Redis carries realtime events and rate-limit counts between instances; without it the API runs as a single instance.
  const redis = config.REDIS_URL ? await connectRedis(config.REDIS_URL) : null;
  useTransport(redis?.transport ?? null);

  const clerk = createClerk(config);
  const repositories = mongo ?? createMemoryRepositories();
  const countHit = redis?.countHit ?? memoryHitCounter();
  const app = createApp({
    repositories,
    authenticate: clerkAuth(clerk, config),
    removeMembership: clerkMembershipRemover(clerk),
    confirmMembership: clerkMembershipChecker(clerk),
    allowedOrigins: config.ALLOWED_ORIGINS,
    webhookSigningSecret: config.CLERK_WEBHOOK_SIGNING_SECRET,
    ready: () => allReady([mongo, redis]),
    countHit,
    mcp: mcpOptions(config, clerk, repositories, countHit),
  });

  const server = serve({ fetch: app.fetch, port: config.PORT }, info => {
    log('info', 'daybook-api listening', { port: info.port, persistence: config.PERSISTENCE, env: config.NODE_ENV, redis: Boolean(redis) });
  });
  shutdownOn(server, () => Promise.allSettled([mongo?.close(), redis?.close()]));
}

await main();
