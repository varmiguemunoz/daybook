import { useEffect, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../../shared/ui/Icon';
import { useUiStore } from '../../../stores/ui-store';
import { useSearchResults, type SearchItem } from '../use-search-results';

function ResultList({
  items,
  active,
  onRun,
  onHover,
}: {
  items: SearchItem[];
  active: number;
  onRun: (item: SearchItem) => void;
  onHover: (index: number) => void;
}) {
  return (
    <div className="pal-list" id="palette-list" role="listbox" aria-label="Results">
      {items.map((item, index) => (
        <div key={`${item.group}:${item.id}`}>
          {item.group !== items[index - 1]?.group && <div className="pal-sec">{item.group}</div>}
          <button
            id={`palette-item-${index}`}
            type="button"
            role="option"
            aria-selected={index === active}
            className={`pi ${index === active ? 'hl' : ''}`.trim()}
            onMouseMove={() => onHover(index)}
            onClick={() => onRun(item)}
          >
            <Icon name={item.icon} size={15} />
            <span className="trunc">{item.label}</span>
            {item.sub && <span className="sub trunc">{item.sub}</span>}
          </button>
        </div>
      ))}
    </div>
  );
}

function usePaletteKeys(items: SearchItem[], onClose: () => void) {
  const [active, setActive] = useState(0);
  const index = Math.min(active, Math.max(items.length - 1, 0));

  function run(item: SearchItem) {
    onClose();
    item.run();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };
    if (event.key in moves && items.length) {
      event.preventDefault();
      setActive((index + (moves[event.key] ?? 0) + items.length) % items.length);
    }
    if (event.key === 'Enter' && items[index]) run(items[index]);
    if (event.key === 'Escape') onClose();
  }

  return { index, setActive, run, onKeyDown };
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const items = useSearchResults(query);
  const { index, setActive, run, onKeyDown } = usePaletteKeys(items, onClose);

  return createPortal(
    <>
      <div className="scrim enter" onClick={onClose} />
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search">
        <div className="pal-in">
          <Icon name="search" size={16} />
          <input
            autoFocus
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search tasks, people, teams and pages…"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items.length ? `palette-item-${index}` : undefined}
          />
          <span className="kbd">Esc</span>
        </div>
        {items.length ? (
          <ResultList items={items} active={index} onRun={run} onHover={setActive} />
        ) : (
          <p className="muted" style={{ padding: 16, margin: 0 }}>
            No results for “{query}”.
          </p>
        )}
      </div>
    </>,
    document.body,
  );
}

export function CommandPalette() {
  const open = useUiStore(state => state.commandPaletteOpen);
  const setOpen = useUiStore(state => state.setCommandPaletteOpen);

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      setOpen(!useUiStore.getState().commandPaletteOpen);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  return open ? <PaletteDialog onClose={() => setOpen(false)} /> : null;
}
