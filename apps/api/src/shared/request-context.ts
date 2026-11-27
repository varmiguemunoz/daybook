import { AsyncLocalStorage } from 'node:async_hooks';
import type { ActivitySource } from '@daybook/domain';

const storage = new AsyncLocalStorage<{ source: ActivitySource }>();

// Runs work on behalf of a source (an AI assistant over MCP) so activity records it without threading it through every service.
export function runAs<T>(source: ActivitySource, work: () => Promise<T>): Promise<T> {
  return storage.run({ source }, work);
}

export function currentSource(): ActivitySource {
  return storage.getStore()?.source ?? 'app';
}
