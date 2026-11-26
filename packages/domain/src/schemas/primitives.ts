import { z } from 'zod';

export const idSchema = z.string().min(1).max(64);

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const timestampSchema = z.number().int().nonnegative();

export const htmlSchema = z.string().max(20_000);

export const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const emailSchema = z.email();

export const nonEmptyText = z.string().trim().min(1).max(200);
