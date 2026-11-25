import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  onClose?: () => void;
  title: string;
  centered?: boolean;
  children: ReactNode;
}

export function Modal({ open, onClose, title, centered = false, children }: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open || !onClose) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={`modal-wrap ${centered ? 'center' : ''}`.trim()} onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={event => event.stopPropagation()}>
        <div className="modal-h">
          <h2 id={titleId}>{title}</h2>
          {onClose && (
            <button className="ibtn" type="button" onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>
        <div className="modal-b">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
