import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';

const POPOVER_MAX_WIDTH = 320;

interface Props {
  open: boolean;
  anchor: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

function placement(anchor: HTMLElement) {
  const rect = anchor.getBoundingClientRect();
  const vertical = rect.bottom < window.innerHeight / 2 ? { top: rect.bottom + 4 } : { bottom: window.innerHeight - rect.top + 4 };
  return { ...vertical, left: Math.max(8, Math.min(rect.left, window.innerWidth - POPOVER_MAX_WIDTH - 8)) };
}

function useDismiss(ref: RefObject<HTMLDivElement | null>, anchor: HTMLElement | null, onClose: () => void) {
  useEffect(() => {
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (!ref.current?.contains(target) && !anchor?.contains(target)) onClose();
    }
    // Capture and cancel Escape so an enclosing dialog does not close with the popover.
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [ref, anchor, onClose]);
}

function OpenPopover({ anchor, onClose, children, className }: Omit<Props, 'open'> & { anchor: HTMLElement }) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, anchor, onClose);

  useLayoutEffect(() => {
    const element = ref.current;
    element?.showPopover?.();
    return () => {
      if (element?.contains(document.activeElement)) anchor.focus();
    };
  }, [anchor]);

  return (
    <div ref={ref} popover="manual" className={className} style={{ position: 'fixed', ...placement(anchor) }}>
      {children}
    </div>
  );
}

export function Popover({ open, anchor, className = 'pop', ...rest }: Props) {
  if (!open || !anchor) return null;
  return <OpenPopover anchor={anchor} className={className} {...rest} />;
}
