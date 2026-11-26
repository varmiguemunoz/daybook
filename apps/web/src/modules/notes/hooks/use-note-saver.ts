import { useState } from 'react';
import type { Note } from '@daybook/domain';
import { showToast } from '../../core/components/Toast';
import { ApiError } from '../../core/services/api-client';
import { useSaveNote } from '../services/queries';

interface Content {
  title: string;
  body: string;
}

// A 409 carries the version that won, so the user can compare and choose.
function newerVersion(error: Error): Note | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  return (error.issues as { note?: Note } | null)?.note ?? null;
}

export function useNoteSaver(id: string, onSaved: (note: Note) => void) {
  const save = useSaveNote();
  const [conflict, setConflict] = useState<Note | null>(null);

  function run(content: Content, baseUpdatedAt: number | undefined, then?: () => void) {
    if (save.isPending) return;
    save.mutate(
      { id, patch: { ...content, baseUpdatedAt } },
      {
        onSuccess: note => {
          setConflict(null);
          onSaved(note);
          then?.();
        },
        onError: error => {
          const theirs = newerVersion(error);
          if (theirs) setConflict(theirs);
          else showToast(error instanceof ApiError && error.status < 500 ? error.message : 'Could not save the note', 'error');
        },
      },
    );
  }

  function reset() {
    save.reset();
    setConflict(null);
  }

  return { run, reset, conflict, clearConflict: () => setConflict(null), saving: save.isPending, saved: save.isSuccess };
}
