import type { Context } from 'hono';
import type { z } from 'zod';
import { invalidInput } from './errors';

function issuesOf(error: z.ZodError): Array<{ path: string; message: string }> {
  return error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message }));
}

export function parseBody<Schema extends z.ZodTypeAny>(schema: Schema, body: unknown): z.output<Schema> {
  const result = schema.safeParse(body);
  if (!result.success) throw invalidInput(issuesOf(result.error));
  return result.data;
}

export function parseQuery<Schema extends z.ZodTypeAny>(schema: Schema, query: unknown): z.output<Schema> {
  const result = schema.safeParse(query);
  if (!result.success) throw invalidInput(issuesOf(result.error));
  return result.data;
}

export async function readJson(context: Context): Promise<unknown> {
  try {
    return await context.req.json();
  } catch {
    throw invalidInput([{ path: '', message: 'Expected a JSON body' }]);
  }
}
