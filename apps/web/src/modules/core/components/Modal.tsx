import { useId, type ReactNode } from 'react';
import { Dialog } from './Dialog';
import { Icon } from './Icon';

interface Props {
  open: boolean;
  onClose?: () => void;
  title: string;
  centered?: boolean;
  children: ReactNode;
}

export function Modal({ open, onClose, title, centered = false, children }: Props) {
  const titleId = useId();
  if (!open) return null;

  return (
    <Dialog className={`modal-wrap ${centered ? 'center' : ''}`.trim()} onClose={onClose} aria-labelledby={titleId}>
      <div className="modal">
        <div className="modal-h">
          <h2 id={titleId}>{title}</h2>
          {onClose && (
            <button className="ibtn" type="button" onClick={onClose} aria-label="Close">
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
        <div className="modal-b">{children}</div>
      </div>
    </Dialog>
  );
}
