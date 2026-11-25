import { useLayoutEffect, useRef, type AriaAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props extends Pick<AriaAttributes, 'aria-label' | 'aria-labelledby'> {
  className: string;
  onClose?: () => void;
  children: ReactNode;
}

export function Dialog({ className, onClose, children, ...aria }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => dialog?.close();
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      className={className}
      {...aria}
      onCancel={event => {
        event.preventDefault();
        onClose?.();
      }}
      onClose={event => {
        if (!onClose && event.currentTarget.isConnected) event.currentTarget.showModal();
      }}
      onClick={event => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      {children}
    </dialog>,
    document.body,
  );
}
