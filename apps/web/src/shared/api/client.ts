const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const queryKeys = {
  bootstrap: ['bootstrap'] as const,
  tasks: (filters?: Record<string, unknown>) => ['tasks', filters ?? {}] as const,
  task: (id: string) => ['task', id] as const,
  projects: ['projects'] as const,
  project: (id: string) => ['project', id] as const,
  members: ['members'] as const,
  member: (id: string) => ['member', id] as const,
  teams: ['teams'] as const,
  comments: (taskId: string) => ['comments', taskId] as const,
  events: (range?: { from?: string; to?: string }) => ['events', range ?? {}] as const,
  files: (projectId: string, taskId?: string) => ['files', projectId, taskId ?? 'all'] as const,
  views: (ownerId?: string) => ['views', ownerId ?? 'me'] as const,
  notifications: (unreadOnly?: boolean) => ['notifications', unreadOnly ?? false] as const,
  activity: (limit?: number) => ['activity', limit ?? 20] as const,
  search: (q: string) => ['search', q] as const,
};
