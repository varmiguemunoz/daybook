import { useState, type KeyboardEvent, type RefObject } from 'react';
import type { NoteSummary } from '@daybook/domain';
import { caretPoint } from '../lib/caret';

const OPEN_LINK = /\[\[([^[\]|\n]{0,80})$/;
const MAX_OPTIONS = 6;

interface Open {
  query: string;
  start: number;
  top: number;
  left: number;
}

const KEYS: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };

// Suggests note titles while the caret sits right after an unclosed [[.
export function useWikiSuggest(ref: RefObject<HTMLTextAreaElement | null>, notes: NoteSummary[], onInsert: (body: string, caret: number) => void) {
  const [open, setOpen] = useState<Open | null>(null);
  const [active, setActive] = useState(0);
  const term = open?.query.trim().toLowerCase() ?? '';
  const options = open ? notes.filter(note => note.title.toLowerCase().includes(term)).slice(0, MAX_OPTIONS) : [];

  function update() {
    const field = ref.current;
    const match = field ? OPEN_LINK.exec(field.value.slice(0, field.selectionStart)) : null;
    if (!field || !match || field.selectionStart !== field.selectionEnd) return setOpen(null);
    const point = caretPoint(field, field.selectionStart);
    const left = Math.max(0, Math.min(point.left, field.clientWidth - 260));
    if (open?.query !== match[1]) setActive(0);
    setOpen({ query: match[1] ?? '', start: field.selectionStart - (match[1] ?? '').length, top: point.top + point.height + 6, left });
  }

  function insert(title: string) {
    const field = ref.current;
    if (!field || !open) return;
    const after = field.value.slice(field.selectionStart);
    const closing = after.startsWith(']]') ? '' : ']]';
    onInsert(field.value.slice(0, open.start) + title + closing + after, open.start + title.length + 2);
    setOpen(null);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!open || !options.length) return;
    const step = KEYS[event.key];
    if (step) setActive((active + step + options.length) % options.length);
    else if (event.key === 'Enter' || event.key === 'Tab') insert(options[active]?.title ?? '');
    else if (event.key === 'Escape') setOpen(null);
    else return;
    event.preventDefault();
  }

  return { open, options, active, update, insert, onKeyDown, close: () => setOpen(null) };
}

export type WikiSuggestState = ReturnType<typeof useWikiSuggest>;
