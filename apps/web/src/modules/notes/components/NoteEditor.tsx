import { useEffect, useRef, type KeyboardEvent } from 'react';
import { MOD } from '../../core/utils/platform';
import type { NoteEditorState } from '../hooks/use-note-editor';
import { useWikiSuggest } from '../hooks/use-wiki-suggest';
import { useNoteIndex } from '../services/queries';
import { SUGGEST_ID, WikiSuggest } from './WikiSuggest';

export function editorKeys(editor: NoteEditorState, onEscape: () => void) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault(); // Stops the browser's "Save page" dialog.
      editor.persist();
    } else if (event.key === 'Escape' && !event.defaultPrevented) {
      event.preventDefault();
      onEscape();
    }
  };
}

function Field({ editor, autoFocus, noteId }: { editor: NoteEditorState; autoFocus: boolean; noteId: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { data: notes = [] } = useNoteIndex();
  const suggest = useWikiSuggest(
    ref,
    notes.filter(note => note.id !== noteId),
    (body, caret) => {
      editor.change({ body });
      requestAnimationFrame(() => ref.current?.setSelectionRange(caret, caret));
    },
  );

  // Start with the caret after the existing text, where writing usually continues.
  useEffect(() => {
    const field = ref.current;
    if (autoFocus && field) field.setSelectionRange(field.value.length, field.value.length);
  }, [autoFocus]);

  return (
    <div className="note-field">
      <textarea
        ref={ref}
        className="note-editor"
        aria-label="Note body in Markdown"
        aria-autocomplete="list"
        aria-expanded={Boolean(suggest.open)}
        aria-controls={suggest.open ? SUGGEST_ID : undefined}
        aria-activedescendant={suggest.open && suggest.options.length ? `${SUGGEST_ID}-${suggest.active}` : undefined}
        value={editor.draft.body}
        onChange={event => editor.change({ body: event.target.value })}
        onSelect={suggest.update}
        onKeyDown={suggest.onKeyDown}
        onBlur={suggest.close}
        placeholder="Write in Markdown… Type [[ to link another note."
        maxLength={100_000}
        autoFocus={autoFocus}
      />
      <WikiSuggest suggest={suggest} />
    </div>
  );
}

export function NoteEditor({ editor, noteId, autoFocus }: { editor: NoteEditorState; noteId: string; autoFocus: boolean }) {
  return (
    <div className="note-edit">
      <Field editor={editor} autoFocus={autoFocus} noteId={noteId} />
      <p className="note-hint">
        <kbd>{MOD}</kbd>
        <kbd>S</kbd> saves · edits also save on their own · <kbd>Esc</kbd> stops editing · <code>[[Title]]</code> links a note
      </p>
    </div>
  );
}
