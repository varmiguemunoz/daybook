import { describe, expect, it } from 'vitest';
import { createMemoryRepositories } from './adapters/memory';
import { createApp } from './app';

describe('GET /health', () => {
  it('reports the service as ok', async () => {
    const app = createApp({ repositories: createMemoryRepositories() });
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok', service: 'gr8r-api' });
  });
});

describe('GET /api/tasks', () => {
  it('returns the seeded tasks', async () => {
    const app = createApp({ repositories: createMemoryRepositories() });
    const response = await app.request('/api/tasks');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { length: number };
    expect(Array.isArray(body)).toBe(true);
    expect((body as unknown[]).length).toBe(18);
  });
});

describe('POST /api/tasks', () => {
  it('creates a task and derives its key', async () => {
    const app = createApp({ repositories: createMemoryRepositories() });
    const response = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-member-id': 'm1' },
      body: JSON.stringify({ projectId: 'p1', title: 'New task' }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as { key: string; status: string };
    expect(body.key).toMatch(/^TSK-\d+$/);
    expect(body.status).toBe('todo');
  });

  it('rejects an invalid body with 422', async () => {
    const app = createApp({ repositories: createMemoryRepositories() });
    const response = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-member-id': 'm1' },
      body: JSON.stringify({ projectId: 'p1' }),
    });

    expect(response.status).toBe(422);
  });

  it('blocks guests from creating tasks', async () => {
    const app = createApp({ repositories: createMemoryRepositories() });
    const response = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-member-id': 'm6' },
      body: JSON.stringify({ projectId: 'p1', title: 'Nope' }),
    });

    expect(response.status).toBe(403);
  });
});

describe('GET /api/bootstrap', () => {
  it('returns the seeded workspace bundle', async () => {
    const app = createApp({ repositories: createMemoryRepositories() });
    const response = await app.request('/api/bootstrap');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { members: unknown[] };
    expect(body.members).toHaveLength(6);
  });
});
