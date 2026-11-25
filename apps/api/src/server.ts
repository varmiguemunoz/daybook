import { serve } from '@hono/node-server';
import { loadConfig } from './config';
import { createApp } from './app';
import { createMemoryRepositories } from './adapters/memory';
import { createMongoRepositories } from './adapters/mongo';

async function main(): Promise<void> {
  const config = loadConfig();

  const repositories = config.PERSISTENCE === 'mongo' ? await createMongoRepositories(config.MONGODB_URI) : createMemoryRepositories();

  serve({ fetch: createApp({ repositories }).fetch, port: config.PORT }, info => {
    console.log(`gr8r-api listening on http://localhost:${info.port} (${config.PERSISTENCE})`);
  });
}

await main();
