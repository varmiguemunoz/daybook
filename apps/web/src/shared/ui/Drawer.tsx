import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-h">
          <h2 style={{ fontSize: 'var(--fs-md)', fontWeight: 600, margin: 0 }}>{title}</h2>
          <span className="sp" />
          <button className="ibtn" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="drawer-b">{children}</div>
      </aside>
    </>,
    document.body,
  );
}
