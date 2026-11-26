import { Icon } from '../../core/components/Icon';
import type { WikiSuggestState } from '../hooks/use-wiki-suggest';

export const SUGGEST_ID = 'wiki-suggest';

export function WikiSuggest({ suggest }: { suggest: WikiSuggestState }) {
  const { open, options, active } = suggest;
  if (!open) return null;

  return (
    <ul id={SUGGEST_ID} className="wiki-suggest" role="listbox" aria-label="Link to a note" style={{ top: open.top, left: open.left }}>
      {options.length ? (
        options.map((note, index) => (
          <li
            key={note.id}
            id={`${SUGGEST_ID}-${index}`}
            role="option"
            aria-selected={index === active}
            className={`mi ${index === active ? 'hl' : ''}`.trim()}
            onMouseDown={event => {
              event.preventDefault();
              suggest.insert(note.title);
            }}
          >
            <Icon name="file-text" size={14} />
            <span className="trunc">{note.title}</span>
          </li>
        ))
      ) : (
        <li className="wiki-suggest-empty" role="presentation">
          {open.query.trim() ? `No note named “${open.query.trim()}”. Close with ]] to link it anyway.` : 'Type to find a note.'}
        </li>
      )}
    </ul>
  );
}
