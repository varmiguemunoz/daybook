import { loadConfig } from '../config';
import { createMongoRepositories } from '../adapters/mongo';
import { importSeedData } from '../adapters/mongo/importer';

async function main(): Promise<void> {
  const config = loadConfig();
  const repositories = await createMongoRepositories(config.MONGODB_URI);
  await importSeedData();
  console.log('Seeded MongoDB with the Gr8r Studio workspace.');
  await repositories.close();
}

await main();
