import { serve } from '@hono/node-server';
import { loadConfig } from './config';
import { createApp } from './app';
import { clerkAuth } from './http/auth';
import { createMemoryRepositories } from './adapters/memory';
import { createMongoRepositories } from './adapters/mongo';

async function main(): Promise<void> {
  const config = loadConfig();

  const repositories = config.PERSISTENCE === 'mongo' ? await createMongoRepositories(config.MONGODB_URI) : createMemoryRepositories();
  const app = createApp({
    repositories,
    authenticate: clerkAuth(config),
    allowedOrigins: config.ALLOWED_ORIGINS,
    webhookSigningSecret: config.CLERK_WEBHOOK_SIGNING_SECRET,
  });

  serve({ fetch: app.fetch, port: config.PORT }, info => {
    console.log(`gr8r-api listening on http://localhost:${info.port} (${config.PERSISTENCE})`);
  });
}

await main();
