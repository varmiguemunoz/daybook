export interface BusEvent {
  type: string;
  payload?: unknown;
}

type Listener = (event: BusEvent) => void;

// Carries events between API instances; without one, events stay inside this process.
export interface BusTransport {
  publish(workspaceId: string, event: BusEvent): void;
}

const channels = new Map<string, Set<Listener>>();
let transport: BusTransport | null = null;

export function useTransport(next: BusTransport | null): void {
  transport = next;
}

export function subscribe(workspaceId: string, listener: Listener): () => void {
  const set = channels.get(workspaceId) ?? new Set<Listener>();
  set.add(listener);
  channels.set(workspaceId, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) channels.delete(workspaceId);
  };
}

// Sends an event to every stream open on this instance, whatever its workspace (used when the process shuts down).
export function broadcast(event: BusEvent): void {
  for (const set of channels.values()) for (const listener of set) listener(event);
}

// Hands an event to the streams of one workspace on this instance; transports call it for events from other instances.
export function deliver(workspaceId: string, event: BusEvent): void {
  const set = channels.get(workspaceId);
  if (!set) return;
  for (const listener of set) listener(event);
}

export function emit(workspaceId: string, event: BusEvent): void {
  if (transport) transport.publish(workspaceId, event);
  else deliver(workspaceId, event);
}
