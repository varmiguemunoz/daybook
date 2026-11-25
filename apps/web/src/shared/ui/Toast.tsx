import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ToastItem {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

let counter = 0;
const listeners = new Set<(item: ToastItem) => void>();

export function showToast(message: string, tone: ToastItem['tone'] = 'info'): void {
  const item: ToastItem = { id: ++counter, message, tone };
  for (const listener of listeners) listener(item);
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function add(item: ToastItem) {
      setItems(current => [...current, item]);
      setTimeout(() => setItems(current => current.filter(entry => entry.id !== item.id)), 3500);
    }
    listeners.add(add);
    return () => {
      listeners.delete(add);
    };
  }, []);

  return createPortal(
    <div className="toast-host" aria-live="polite">
      {items.map(item => (
        <div key={item.id} className={`toast ${item.tone}`}>
          {item.message}
        </div>
      ))}
    </div>,
    document.body,
  );
}
