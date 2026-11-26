import { useRef, useState } from 'react';
import type { Note } from '@daybook/domain';
import { useAutosave } from './use-autosave';
import { useNoteSaver } from './use-note-saver';

interface Draft {
  title: string;
  body: string;
}

interface Baseline extends Draft {
  updatedAt: number;
}

const titleOf = (title: string) => title.trim() || 'Untitled';
const snapshot = ({ title, body, updatedAt }: Note): Baseline => ({ title, body, updatedAt });
const differs = (draft: Draft, base: Baseline) => titleOf(draft.title) !== base.title || draft.body !== base.body;

function statusOf(saving: boolean, conflict: boolean, dirty: boolean, saved: boolean): string {
  if (saving) return 'Saving…';
  if (conflict) return 'Not saved';
  if (dirty) return 'Unsaved changes';
  return saved ? 'Saved' : '';
}

// The baseline is the version the draft started from, so a newer save by someone else is caught, not overwritten.
function useDraft(note: Note, onDirty: (dirty: boolean) => void) {
  const [draft, setDraft] = useState<Draft>({ title: note.title, body: note.body });
  const [baseline, setBaseline] = useState(() => snapshot(note));
  const latest = useRef(draft);

  function reset(source: Note) {
    const base = snapshot(source);
    latest.current = { title: source.title, body: source.body };
    setDraft(latest.current);
    setBaseline(base);
    onDirty(false);
  }

  function change(patch: Partial<Draft>) {
    latest.current = { ...latest.current, ...patch };
    setDraft(latest.current);
    onDirty(differs(latest.current, baseline));
  }

  function rebase(saved: Note) {
    const base = snapshot(saved);
    setBaseline(base);
    onDirty(differs(latest.current, base));
  }

  return { draft, baseline, changed: differs(draft, baseline), reset, change, rebase };
}

// Keep mine overwrites the newer version; use theirs swaps the draft for it.
function conflictChoice(saver: ReturnType<typeof useNoteSaver>, doc: ReturnType<typeof useDraft>, content: Draft) {
  return {
    keepMine: () => saver.run(content, undefined),
    takeTheirs: () => {
      if (saver.conflict) doc.reset(saver.conflict);
      saver.clearConflict();
    },
  };
}

export function useNoteEditor(note: Note, startEditing: boolean, onDirty: (dirty: boolean) => void) {
  const [editing, setEditing] = useState(startEditing);
  const doc = useDraft(note, onDirty);
  const saver = useNoteSaver(note.id, doc.rebase);
  const dirty = editing && doc.changed;
  const content = { title: titleOf(doc.draft.title), body: doc.draft.body };

  function start() {
    saver.reset();
    doc.reset(note);
    setEditing(true);
  }

  function finish() {
    setEditing(false);
    onDirty(false);
  }

  function persist(then?: () => void) {
    if (saver.conflict) return;
    if (!dirty) return then?.();
    saver.run(content, doc.baseline.updatedAt, then);
  }

  useAutosave(dirty && !saver.conflict && !saver.saving, doc.draft, persist);
  const status = statusOf(saver.saving, Boolean(saver.conflict), dirty, saver.saved);
  const resolve = conflictChoice(saver, doc, content);
  return { editing, draft: doc.draft, dirty, saving: saver.saving, conflict: saver.conflict, status, change: doc.change, start, finish, persist, ...resolve };
}

export type NoteEditorState = ReturnType<typeof useNoteEditor>;
