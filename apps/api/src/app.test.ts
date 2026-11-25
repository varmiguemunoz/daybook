import { describe, expect, it } from 'vitest';
import type { MiddlewareHandler } from 'hono';
import { createMemoryRepositories } from './adapters/memory';
import { createApp } from './app';
import { unauthorized } from './http/errors';

const signedInAs: MiddlewareHandler = async (context, next) => {
  const userId = context.req.header('x-test-user');
  if (!userId) throw unauthorized();
  const orgRole = userId === 'user_m1' ? 'org:admin' : 'org:member';
  context.set('identity', { userId, orgId: 'org_seed', orgRole, orgName: 'Gr8r Studio', name: 'Tanjim Islam', email: 'hello@gr8rstudio.com' });
  await next();
};

function testApp() {
  return createApp({
    repositories: createMemoryRepositories(),
    authenticate: signedInAs,
    allowedOrigins: ['http://localhost:5175'],
    webhookSigningSecret: 'whsec_test',
  });
}

const asAdmin = { 'x-test-user': 'user_m1' };

describe('GET /health', () => {
  it('reports the service as ok', async () => {
    const app = testApp();
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok', service: 'gr8r-api' });
  });
});

describe('GET /api/tasks', () => {
  it('returns the seeded tasks', async () => {
    const app = testApp();
    const response = await app.request('/api/tasks', { headers: asAdmin });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { length: number };
    expect(Array.isArray(body)).toBe(true);
    expect((body as unknown[]).length).toBe(18);
  });
});

describe('POST /api/tasks', () => {
  it('creates a task and derives its key', async () => {
    const app = testApp();
    const response = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...asAdmin },
      body: JSON.stringify({ projectId: 'p1', title: 'New task' }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as { key: string; status: string };
    expect(body.key).toMatch(/^TSK-\d+$/);
    expect(body.status).toBe('todo');
  });

  it('rejects an invalid body with 422', async () => {
    const app = testApp();
    const response = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...asAdmin },
      body: JSON.stringify({ projectId: 'p1' }),
    });

    expect(response.status).toBe(422);
  });

  it('blocks members without workspace permission from managing teams', async () => {
    const app = testApp();
    const response = await app.request('/api/teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user': 'user_m6' },
      body: JSON.stringify({ name: 'Nope' }),
    });

    expect(response.status).toBe(403);
  });
});

describe('GET /api/bootstrap', () => {
  it('returns the seeded workspace bundle', async () => {
    const app = testApp();
    const response = await app.request('/api/bootstrap', { headers: asAdmin });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { members: unknown[] };
    expect(body.members).toHaveLength(6);
  });
});
