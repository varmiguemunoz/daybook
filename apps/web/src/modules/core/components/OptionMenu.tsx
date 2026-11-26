import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type SyntheticEvent } from 'react';
import { Icon } from './Icon';
import { Popover } from './Popover';

export interface MenuOption<Value extends string> {
  value: Value;
  label: string;
  icon?: ReactNode;
}

interface Props<Value extends string> {
  label: string;
  value?: Value;
  options: MenuOption<Value>[];
  onSelect: (value: Value) => void;
  className?: string;
  children: ReactNode;
}

const stop = (event: SyntheticEvent) => event.stopPropagation();

function moveFocus(list: HTMLElement, key: string): boolean {
  const items = [...list.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')];
  const current = items.indexOf(document.activeElement as HTMLButtonElement);
  const targets: Record<string, number> = { ArrowDown: current + 1, ArrowUp: current - 1, Home: 0, End: items.length - 1 };
  const next = targets[key];
  if (next === undefined) return false;
  items[(next + items.length) % items.length]?.focus();
  return true;
}

export function OptionList<Value extends string>({
  label,
  value,
  options,
  onChoose,
  onDismiss,
}: Pick<Props<Value>, 'label' | 'value' | 'options'> & { onChoose: (value: Value) => void; onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = ref.current;
    (list?.querySelector<HTMLButtonElement>('[aria-checked="true"]') ?? list?.querySelector<HTMLButtonElement>('[role="menuitemradio"]'))?.focus();
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Tab') onDismiss();
    else if (moveFocus(event.currentTarget, event.key)) event.preventDefault();
  }

  return (
    <div ref={ref} role="menu" aria-label={label} onClick={stop} onPointerDown={stop} onKeyDown={onKeyDown}>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          className="mi"
          role="menuitemradio"
          tabIndex={-1}
          aria-checked={option.value === value}
          onClick={() => onChoose(option.value)}
        >
          {option.icon}
          <span className="trunc">{option.label}</span>
          {option.value === value && <Icon name="check" size={14} className="ck" />}
        </button>
      ))}
    </div>
  );
}

export function OptionMenu<Value extends string>({ label, value, options, onSelect, className = 'pillbtn', children }: Props<Value>) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  function choose(next: Value) {
    setAnchor(null);
    if (next !== value) onSelect(next);
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onPointerDown={stop}
        onClick={event => {
          event.stopPropagation();
          setAnchor(anchor ? null : event.currentTarget);
        }}
      >
        {children}
      </button>
      <Popover open={Boolean(anchor)} anchor={anchor} onClose={() => setAnchor(null)} className="pop enter">
        <OptionList label={label} value={value} options={options} onChoose={choose} onDismiss={() => setAnchor(null)} />
      </Popover>
    </>
  );
}
