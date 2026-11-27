const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// Where AI assistants (Claude, ChatGPT, Codex) connect over MCP.
export const MCP_URL = `${API_BASE.replace(/\/$/, '')}/mcp`;

type TokenSource = () => Promise<string | null>;

let tokenSource: TokenSource = async () => null;

export function setTokenSource(source: TokenSource): void {
  tokenSource = source;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly issues: unknown = null,
    readonly code: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// A workspace limit explains itself; anything else gets the caller's generic message.
export function failureMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.code === 'limit_reached' ? error.message : fallback;
}

interface ErrorBody {
  error?: { message?: string; issues?: unknown; code?: string | null };
}

async function apiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as ErrorBody | null;
  return new ApiError(response.status, body?.error?.message ?? `Request failed (${response.status})`, body?.error?.issues ?? null, body?.error?.code ?? null);
}

export async function apiRequest(path: string, init?: RequestInit): Promise<Response> {
  const token = await tokenSource();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }), ...(init?.headers ?? {}) },
  });

  if (!response.ok) throw await apiError(response);

  return response;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiRequest(path, init);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const queryKeys = {
  bootstrap: ['bootstrap'] as const,
  tasks: ['tasks'] as const,
  members: ['members'] as const,
  teams: ['teams'] as const,
  comments: (taskId: string) => ['comments', taskId] as const,
  notifications: (unreadOnly?: boolean) => ['notifications', unreadOnly ?? false] as const,
  activity: (limit?: number) => ['activity', limit ?? 20] as const,
  search: (q: string) => ['search', q] as const,
  folders: ['folders'] as const,
  notes: ['notes'] as const,
  note: (id: string) => ['note', id] as const,
};
