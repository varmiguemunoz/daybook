import { useState } from 'react';
import type { NoteSummary } from '@daybook/domain';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../modules/core/components/ConfirmDialog';
import { EmptyState } from '../modules/core/components/EmptyState';
import { Icon } from '../modules/core/components/Icon';
import { showToast } from '../modules/core/components/Toast';
import { MOD } from '../modules/core/utils/platform';
import { NotePane } from '../modules/notes/components/NotePane';
import { NotesSidebar } from '../modules/notes/components/NotesSidebar';
import { useUnsavedGuard } from '../modules/notes/hooks/use-unsaved-guard';
import { useCreateNote } from '../modules/notes/services/queries';
import { failureMessage } from '../modules/core/services/api-client';

function useNotesLocation() {
  const [params, setParams] = useSearchParams();
  const noteId = params.get('note');
  const folderId = params.get('folder');

  function go(next: { note?: string | null; folder?: string | null }) {
    const note = next.note === undefined ? noteId : next.note;
    const folder = next.folder === undefined ? folderId : next.folder;
    setParams({ ...(folder && { folder }), ...(note && { note }) });
  }

  return { noteId, folderId, go };
}

function NotesHome({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="notes-doc notes-blank">
      <EmptyState
        icon="notebook-pen"
        title="Pick a note to read"
        text={`Choose one from the list, or start a new one. While editing, ${MOD}+S saves.`}
        action={
          <button type="button" className="btn btn-primary btn-sm" onClick={onCreate}>
            <Icon name="plus" size={14} />
            New note
          </button>
        }
      />
    </div>
  );
}

// Creates an untitled note and opens it straight into edit mode.
function useNewNote(guard: ReturnType<typeof useUnsavedGuard>, go: ReturnType<typeof useNotesLocation>['go']) {
  const create = useCreateNote();
  const [fresh, setFresh] = useState<string | null>(null);

  function createNote(targetFolder: string | null, title = 'Untitled') {
    guard.run(() =>
      create.mutate(
        { title, folderId: targetFolder, body: '' },
        {
          onSuccess: note => {
            setFresh(note.id);
            go({ note: note.id, folder: note.folderId });
          },
          onError: error => showToast(failureMessage(error, 'Could not create the note'), 'error'),
        },
      ),
    );
  }

  return { fresh, creating: create.isPending, createNote };
}

function LeaveDialog({ guard }: { guard: ReturnType<typeof useUnsavedGuard> }) {
  return (
    <ConfirmDialog
      open={guard.pending}
      title="Leave without saving?"
      message="This note has unsaved changes. They will be lost if you continue."
      confirmLabel="Discard changes"
      onConfirm={guard.confirm}
      onClose={guard.cancel}
    />
  );
}

export function NotesPage() {
  const { noteId, folderId, go } = useNotesLocation();
  const guard = useUnsavedGuard();
  const { fresh, creating, createNote } = useNewNote(guard, go);

  function openNote(note: NoteSummary) {
    if (note.id !== noteId) go({ note: note.id, folder: note.folderId });
  }

  return (
    <div className={`notes ${noteId ? 'has-note' : ''}`.trim()}>
      <NotesSidebar
        activeNoteId={noteId}
        activeFolderId={folderId}
        creating={creating}
        onOpenNote={openNote}
        onSelectFolder={id => go({ folder: id })}
        onCreateNote={createNote}
      />
      {noteId ? (
        <NotePane
          key={noteId}
          id={noteId}
          fresh={fresh === noteId}
          onOpenNote={openNote}
          onCreateNote={createNote}
          onClose={() => go({ note: null })}
          onDirty={guard.setDirty}
        />
      ) : (
        <NotesHome onCreate={() => createNote(folderId)} />
      )}
      <LeaveDialog guard={guard} />
    </div>
  );
}
