import type { MiddlewareHandler } from 'hono';
import { AppError } from './errors';

// Counts a hit for the key in the current window and returns the total so far.
export type HitCounter = (key: string, windowMs: number) => Promise<number>;

const RATE_LIMIT = 300;
const RATE_WINDOW_MS = 60_000;

// Per-process counter; with several instances use the Redis counter so the limit is shared.
export function memoryHitCounter(): HitCounter {
  const buckets = new Map<string, { count: number; reset: number }>();
  return async (key, windowMs) => {
    const now = Date.now();
    if (buckets.size > 10_000) for (const [stale, bucket] of buckets) if (bucket.reset < now) buckets.delete(stale);
    const current = buckets.get(key);
    const bucket = current && now <= current.reset ? current : { count: 0, reset: now + windowMs };
    bucket.count += 1;
    buckets.set(key, bucket);
    return bucket.count;
  };
}

// A counter outage lets requests through rather than taking the API down with it.
export async function overLimit(countHit: HitCounter, userId: string): Promise<boolean> {
  return (await countHit(userId, RATE_WINDOW_MS).catch(() => 0)) > RATE_LIMIT;
}

export function rateLimit(countHit: HitCounter): MiddlewareHandler {
  return async (context, next) => {
    if (await overLimit(countHit, context.get('identity').userId)) throw new AppError(429, 'Too many requests');
    await next();
  };
}
