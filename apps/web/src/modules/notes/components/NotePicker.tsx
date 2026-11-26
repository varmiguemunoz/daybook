import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '../../core/components/Icon';
import { Popover } from '../../core/components/Popover';
import { SearchField } from '../../core/components/SearchField';
import { useNoteIndex } from '../services/queries';

interface Props {
  exclude: Set<string>;
  onPick: (id: string) => void;
}

function Results({ query, exclude, onPick }: Props & { query: string }) {
  const { data = [], isPending } = useNoteIndex();
  const term = query.trim().toLowerCase();
  const options = data.filter(note => !exclude.has(note.id) && note.title.toLowerCase().includes(term)).slice(0, 12);
  if (isPending) return <p className="picker-note">Loading notes…</p>;
  if (!options.length) return <p className="picker-note">{query ? `No other notes match “${query}”.` : 'No other notes to link yet.'}</p>;

  return (
    <div className="picker-list" role="list">
      {options.map(note => (
        <button key={note.id} type="button" className="mi" role="listitem" onClick={() => onPick(note.id)}>
          <Icon name="file-text" size={14} />
          <span className="trunc">{note.title}</span>
        </button>
      ))}
    </div>
  );
}

// Enter in the search field links the first match.
function pickFirst(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) return;
  event.preventDefault();
  event.currentTarget.querySelector<HTMLButtonElement>('.mi')?.click();
}

function PickerBody({ exclude, onPick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');

  // Focus once the popover is shown; autoFocus would fire before showPopover and be lost.
  useEffect(() => ref.current?.querySelector('input')?.focus(), []);

  return (
    <div ref={ref} onKeyDown={pickFirst}>
      <SearchField value={query} onChange={setQuery} placeholder="Find a note to link" />
      <Results query={query} exclude={exclude} onPick={onPick} />
    </div>
  );
}

export function NotePicker({ exclude, onPick }: Props) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        onClick={event => setAnchor(anchor ? null : event.currentTarget)}
      >
        <Icon name="link" size={14} />
        Link note
      </button>
      <Popover open={Boolean(anchor)} anchor={anchor} onClose={() => setAnchor(null)} className="pop enter picker">
        <PickerBody
          exclude={exclude}
          onPick={id => {
            onPick(id);
            setAnchor(null);
          }}
        />
      </Popover>
    </>
  );
}
