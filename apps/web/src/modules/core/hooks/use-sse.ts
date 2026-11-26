import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, apiRequest } from '../services/api-client';

const FIRST_RETRY_MS = 2_000;
const MAX_RETRY_MS = 60_000;
const INVALIDATES: Record<string, string[]> = {
  'task.created': ['tasks'],
  'task.updated': ['tasks'],
  'task.deleted': ['tasks'],
  'comment.created': ['comments'],
  'member.removed': ['members', 'teams', 'bootstrap'],
  'notification.created': ['notifications'],
  'note.created': ['notes'],
  'note.updated': ['notes', 'note'],
  'note.deleted': ['notes', 'note'],
  'folder.changed': ['folders', 'notes'],
};

async function listen(signal: AbortSignal, onOpen: () => void, onEvent: (type: string) => void): Promise<void> {
  const response = await apiRequest('/api/events/stream', { signal, headers: { accept: 'text/event-stream' } });
  const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  onOpen();

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

async function stream(signal: AbortSignal, onEvent: (type: string) => void, onRejected: (error: ApiError) => void): Promise<void> {
  let delay = FIRST_RETRY_MS;
  while (!signal.aborted) {
    try {
      await listen(signal, () => (delay = FIRST_RETRY_MS), onEvent);
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) return onRejected(error);
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, MAX_RETRY_MS);
  }
}

export function useSSE(workspaceId: string | undefined, onRejected: (error: ApiError) => void): void {
  const client = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;
    const controller = new AbortController();
    const onEvent = (type: string) => INVALIDATES[type]?.forEach(key => void client.invalidateQueries({ queryKey: [key] }));
    void stream(controller.signal, onEvent, onRejected);
    return () => controller.abort();
  }, [workspaceId, client, onRejected]);
}
