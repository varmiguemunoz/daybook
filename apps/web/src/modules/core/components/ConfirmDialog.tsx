import { type ReactNode } from 'react';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p style={{ margin: 0 }}>{message}</p>
      <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-secondary" type="button" onClick={onClose} data-autofocus>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
