import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client';

const RETRY_MS = 5_000;
const INVALIDATES: Record<string, string> = {
  'task.created': 'tasks',
  'task.updated': 'tasks',
  'task.deleted': 'tasks',
  'comment.created': 'comments',
};

async function listen(signal: AbortSignal, onEvent: (type: string) => void): Promise<void> {
  const response = await apiRequest('/api/events/stream', { signal, headers: { accept: 'text/event-stream' } });
  const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  while (reader) {
    const { value, done } = await reader.read();
    if (done) return;
    const frames = (buffer + value).split('\n\n');
    buffer = frames.pop() ?? '';
    frames.forEach(frame => {
      const type = /^event: (.+)$/m.exec(frame)?.[1];
      if (type) onEvent(type);
    });
  }
}

async function stream(signal: AbortSignal, onEvent: (type: string) => void): Promise<void> {
  while (!signal.aborted) {
    await listen(signal, onEvent).catch(() => undefined);
    await new Promise(resolve => setTimeout(resolve, RETRY_MS));
  }
}

export function useSSE(workspaceId: string | undefined): void {
  const client = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;
    const controller = new AbortController();
    void stream(controller.signal, type => {
      const key = INVALIDATES[type];
      if (key) void client.invalidateQueries({ queryKey: [key] });
    });
    return () => controller.abort();
  }, [workspaceId, client]);
}
