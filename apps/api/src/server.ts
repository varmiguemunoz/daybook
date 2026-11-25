import { serve } from '@hono/node-server';
import { loadConfig } from './config';
import { createApp } from './app';
import { configureEmail } from './shared/notifications/email';
import { clerkAuth, clerkMembershipChecker, clerkMembershipRemover, createClerk } from './http/auth';
import { createMemoryRepositories } from './adapters/memory';
import { createMongoRepositories } from './adapters/mongo';

async function main(): Promise<void> {
  const config = loadConfig();
  configureEmail(config);

  const repositories = config.PERSISTENCE === 'mongo' ? await createMongoRepositories(config.MONGODB_URI) : createMemoryRepositories();
  const clerk = createClerk(config);
  const app = createApp({
    repositories,
    authenticate: clerkAuth(clerk, config),
    removeMembership: clerkMembershipRemover(clerk),
    confirmMembership: clerkMembershipChecker(clerk),
    allowedOrigins: config.ALLOWED_ORIGINS,
    webhookSigningSecret: config.CLERK_WEBHOOK_SIGNING_SECRET,
  });

  serve({ fetch: app.fetch, port: config.PORT }, info => {
    console.log(`daybook-api listening on http://localhost:${info.port} (${config.PERSISTENCE})`);
  });
}

await main();
