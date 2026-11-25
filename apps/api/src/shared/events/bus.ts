type Listener = (payload: unknown) => void;

const channels = new Map<string, Set<Listener>>();

export function subscribe(workspaceId: string, listener: Listener): () => void {
  const set = channels.get(workspaceId) ?? new Set<Listener>();
  set.add(listener);
  channels.set(workspaceId, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) channels.delete(workspaceId);
  };
}

export function emit(workspaceId: string, event: { type: string; payload?: unknown }): void {
  const set = channels.get(workspaceId);
  if (!set) return;
  for (const listener of set) listener(event);
}
