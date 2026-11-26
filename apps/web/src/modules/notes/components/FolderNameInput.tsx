import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Icon } from '../../core/components/Icon';

interface Props {
  initial?: string;
  depth: number;
  label: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export function FolderNameInput({ initial = '', depth, label, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial);
  const done = useRef(false);

  // Enter and the blur that follows it must not submit twice.
  function commit() {
    if (done.current) return;
    done.current = true;
    const trimmed = name.trim();
    if (trimmed && trimmed !== initial) onSubmit(trimmed);
    else onCancel();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') commit();
    if (event.key !== 'Escape') return;
    event.preventDefault();
    done.current = true;
    onCancel();
  }

  return (
    <div className="tree-row editing" style={{ '--depth': depth } as CSSProperties}>
      <span className="tree-row-chev" />
      <Icon name="folder" size={15} />
      <input
        className="tree-row-input"
        aria-label={label}
        value={name}
        maxLength={200}
        onChange={event => setName(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        onFocus={event => event.currentTarget.select()}
        autoFocus
      />
    </div>
  );
}
