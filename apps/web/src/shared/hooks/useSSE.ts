import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useSSE(workspaceId: string | undefined): void {
  const client = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
  const source = new EventSource(`${apiBase}/api/events/stream`);
    // EventSource can't set x-member-id header; rely on cookie/session in real auth. For dev, append as query.
    source.addEventListener('task.created', () => client.invalidateQueries({ queryKey: ['tasks'] }));
    source.addEventListener('task.updated', () => client.invalidateQueries({ queryKey: ['tasks'] }));
    source.addEventListener('task.deleted', () => client.invalidateQueries({ queryKey: ['tasks'] }));
    source.addEventListener('comment.created', () => client.invalidateQueries({ queryKey: ['comments'] }));
    source.onopen = () => undefined;
    return () => source.close();
  }, [workspaceId, client]);
}
