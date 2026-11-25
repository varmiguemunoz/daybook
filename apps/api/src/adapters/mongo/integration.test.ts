import { describe, expect, it } from 'vitest';
import { createMongoRepositories } from './index';
import { importSeedData } from './importer';

const hasMongo = Boolean(process.env.MONGODB_URI);

describe.skipIf(!hasMongo)('Mongo repositories', () => {
  it('round-trips the seeded workspace', async () => {
    const repositories = await createMongoRepositories(process.env.MONGODB_URI as string);
    await importSeedData();

    const tasks = await repositories.tasks.list('w1', {});
    expect(tasks.length).toBeGreaterThan(0);

    const workspace = await repositories.workspaces.findFirst();
    expect(workspace?.id).toBe('w1');

    await repositories.close();
  });
});
