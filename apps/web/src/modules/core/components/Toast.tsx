import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

type Tone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

const DISMISS_MS = 4_000;
const TONE_ICON: Record<Tone, [string, string]> = {
  success: ['circle-check', 'ok'],
  error: ['circle-alert', 'bad'],
  info: ['info', ''],
};

let counter = 0;
const listeners = new Set<(item: ToastItem) => void>();

export function showToast(message: string, tone: Tone = 'info'): void {
  const item: ToastItem = { id: ++counter, message, tone };
  for (const listener of listeners) listener(item);
}

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const [icon, iconClass] = TONE_ICON[item.tone];

  useEffect(() => {
    if (item.tone === 'error') return;
    const timer = setTimeout(() => onDismiss(item.id), DISMISS_MS);
    return () => clearTimeout(timer);
  }, [item, onDismiss]);

  return (
    <div className="toast">
      <Icon name={icon} size={16} className={iconClass} />
      <span className="grow">{item.message}</span>
      <button className="ta" type="button" aria-label="Dismiss notification" onClick={() => onDismiss(item.id)}>
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}

// The host is a manual popover so toasts stay above any open modal dialog.
function useTopLayer(ref: RefObject<HTMLDivElement | null>, count: number) {
  useLayoutEffect(() => {
    const host = ref.current;
    if (!host?.showPopover) return;
    if (host.matches(':popover-open')) host.hidePopover();
    if (count > 0) host.showPopover();
  }, [ref, count]);
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const [dismiss] = useState(() => (id: number) => setItems(current => current.filter(item => item.id !== id)));
  useTopLayer(ref, items.length);

  useEffect(() => {
    const add = (item: ToastItem) => setItems(current => [...current, item]);
    listeners.add(add);
    return () => {
      listeners.delete(add);
    };
  }, []);

  return createPortal(
    <div ref={ref} popover="manual" className="toasts" role="region" aria-label="Notifications">
      <div className="toast-list" aria-live="polite">
        {items.map(item => (
          <Toast key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </div>,
    document.body,
  );
}
