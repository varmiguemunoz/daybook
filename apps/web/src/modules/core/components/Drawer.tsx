import { useId, type ReactNode } from 'react';
import { Dialog } from './Dialog';
import { Icon } from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, children }: Props) {
  const titleId = useId();
  if (!open) return null;

  return (
    <Dialog className="drawer-wrap" onClose={onClose} aria-labelledby={titleId}>
      <aside className="drawer">
        <div className="drawer-h">
          <h2 id={titleId} className="drawer-title">
            {title}
          </h2>
          <span className="sp" />
          <button className="ibtn" type="button" onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="drawer-b">{children}</div>
      </aside>
    </Dialog>
  );
}
