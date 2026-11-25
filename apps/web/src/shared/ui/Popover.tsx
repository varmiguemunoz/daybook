import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const POPOVER_MAX_WIDTH = 320;

interface Props {
  open: boolean;
  anchor: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Popover({ open, anchor, onClose, children, className = 'pop' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node) && anchor && !anchor.contains(event.target as Node)) {
        onClose();
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, anchor, onClose]);

  if (!open || !anchor) return null;
  const rect = anchor.getBoundingClientRect();
  const vertical = rect.bottom < window.innerHeight / 2 ? { top: rect.bottom + 4 } : { bottom: window.innerHeight - rect.top + 4 };
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - POPOVER_MAX_WIDTH - 8));

  return createPortal(
    <div ref={ref} className={className} style={{ position: 'fixed', ...vertical, left, zIndex: 1000 }}>
      {children}
    </div>,
    document.body,
  );
}
