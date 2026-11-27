import { z } from 'zod';
import type { CallToolResult, McpServer, ToolAnnotations } from '@modelcontextprotocol/server';
import type { Permission } from '@daybook/domain';
import { AppError } from '../../http/errors';
import { runAs } from '../../shared/request-context';
import { log } from '../../shared/log';
import type { Scope } from '../identity/identity-service';
import type { Session } from './session';

export type Access = 'read' | 'write' | 'destructive';

export interface Reply {
  summary: string;
  data: Record<string, unknown>;
}

export interface ToolCall {
  session: Session;
  scope(permission?: Permission): Promise<Scope>;
}

export interface ToolSpec<Input extends z.ZodObject> {
  name: string;
  title: string;
  description: string;
  access: Access;
  input: Input;
  run(call: ToolCall, args: z.output<Input>): Promise<Reply>;
}

const ANNOTATIONS: Record<Access, ToolAnnotations> = {
  read: { readOnlyHint: true, openWorldHint: false },
  write: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  destructive: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
};

const HINTS: Record<string, string> = {
  note_conflict: 'Its latest version follows: merge your change into that body and retry with its updatedAt as baseUpdatedAt.',
  limit_reached: 'This workspace is at its plan limit; tell the user instead of retrying.',
};

export const workspaceRef = z
  .string()
  .min(1)
  .max(100)
  .optional()
  .describe('Workspace id or name from list_workspaces. Optional when the user belongs to one workspace.');
export const pageFields = {
  limit: z.number().int().min(1).max(100).optional().describe('Items per page, 50 by default'),
  cursor: z.string().max(20).optional().describe('nextCursor from the previous page'),
};

// Every workspace tool takes the same optional workspace argument.
export function scoped<Shape extends z.ZodRawShape>(shape: Shape) {
  return z.object({ workspace: workspaceRef, ...shape });
}

export function defineTool<Input extends z.ZodObject>(spec: ToolSpec<Input>): ToolSpec<z.ZodObject> {
  return spec as unknown as ToolSpec<z.ZodObject>;
}

// Drops the workspace argument so the rest can go straight to a service.
export function fieldsOf<T extends { workspace?: string }>(args: T): Omit<T, 'workspace'> {
  const rest: Partial<T> = { ...args };
  delete rest.workspace;
  return rest as Omit<T, 'workspace'>;
}

export function reply(summary: string, data: Record<string, unknown>): Reply {
  return { summary, data };
}

export function page<T>(items: T[], args: { limit?: number; cursor?: string }) {
  const start = Number(args.cursor ?? 0) || 0;
  const limit = args.limit ?? 50;
  const slice = items.slice(start, start + limit);
  return { items: slice, total: items.length, nextCursor: start + limit < items.length ? String(start + limit) : null };
}

function failure(error: unknown): CallToolResult {
  if (error instanceof AppError) {
    const issues = error.issues ? `\n${JSON.stringify(error.issues)}` : '';
    const hint = error.code ? HINTS[error.code] : undefined;
    const message = /[.!?]$/.test(error.message) ? error.message : `${error.message}.`;
    return { isError: true, content: [{ type: 'text', text: `${message}${hint ? ` ${hint}` : ''}${issues}` }] };
  }
  log('error', 'mcp tool failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
  return { isError: true, content: [{ type: 'text', text: 'Daybook hit an unexpected error. Try again in a moment.' }] };
}

async function execute(spec: ToolSpec<z.ZodObject>, args: Record<string, unknown>, session: Session): Promise<CallToolResult> {
  const workspace = typeof args.workspace === 'string' ? args.workspace : undefined;
  const call: ToolCall = { session, scope: permission => session.scope(workspace, permission) };
  try {
    const { summary, data } = await runAs('mcp', () => spec.run(call, args));
    return { content: [{ type: 'text', text: `${summary}\n\n${JSON.stringify(data)}` }], structuredContent: data };
  } catch (error) {
    return failure(error);
  }
}

export function registerTools(server: McpServer, specs: Array<ToolSpec<z.ZodObject>>, session: Session): void {
  for (const spec of specs) {
    const config = {
      title: spec.title,
      description: spec.description,
      inputSchema: spec.input,
      annotations: { title: spec.title, ...ANNOTATIONS[spec.access] },
    };
    server.registerTool(spec.name, config, args => execute(spec, args as Record<string, unknown>, session));
  }
}
