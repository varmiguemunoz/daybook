import { useState } from 'react';
import type { Folder, Note, NoteDetail, NoteSummary } from '@daybook/domain';
import { ConfirmDialog } from '../../core/components/ConfirmDialog';
import { showToast } from '../../core/components/Toast';
import { useWikiResolver } from '../hooks/use-wiki-resolver';
import { useNoteEditor } from '../hooks/use-note-editor';
import { useDeleteNote } from '../services/queries';
import { MarkdownView } from './MarkdownView';
import { NoteEditor, editorKeys } from './NoteEditor';
import { NoteConflict } from './NoteConflict';
import { NoteHeader } from './NoteHeader';
import { RelatedNotes } from './RelatedNotes';
import { WikiContext } from './WikiContext';

export interface NoteViewProps {
  detail: NoteDetail;
  folders: Folder[];
  fresh: boolean;
  onOpenNote: (note: NoteSummary) => void;
  onCreateNote: (folderId: string | null, title: string) => void;
  onClose: () => void;
  onDirty: (dirty: boolean) => void;
}

type Confirm = 'discard' | 'delete' | null;

interface DialogsProps {
  confirm: Confirm;
  note: Note;
  onDiscard: () => void;
  onDeleted: () => void;
  onClose: () => void;
}

function NoteDialogs({ confirm, note, onDiscard, onDeleted, onClose }: DialogsProps) {
  const remove = useDeleteNote();
  // Leaving editing first clears the unsaved flag, so closing the deleted note is not blocked.
  const afterDelete = () => {
    onDiscard();
    onDeleted();
  };
  const onDelete = () => remove.mutate(note.id, { onSuccess: afterDelete, onError: () => showToast('Could not delete the note', 'error') });
  return (
    <>
      <ConfirmDialog
        open={confirm === 'discard'}
        title="Discard your changes?"
        message="The edits since your last save will be lost."
        confirmLabel="Discard"
        onConfirm={onDiscard}
        onClose={onClose}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title={`Delete “${note.title}”?`}
        message="The note and its links are removed for everyone in the workspace. This cannot be undone."
        confirmLabel="Delete note"
        onConfirm={onDelete}
        onClose={onClose}
      />
    </>
  );
}

export function NoteView({ detail, folders, fresh, onOpenNote, onCreateNote, onClose, onDirty }: NoteViewProps) {
  const { note } = detail;
  const editor = useNoteEditor(note, fresh, onDirty);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const wiki = useWikiResolver(note.folderId, onOpenNote, onCreateNote);
  const stopEditing = () => (editor.dirty ? setConfirm('discard') : editor.finish());

  return (
    <WikiContext.Provider value={wiki}>
      <div className="notes-doc">
        <article className={`notes-pane ${editor.editing ? 'editing' : ''}`.trim()} onKeyDown={editor.editing ? editorKeys(editor, stopEditing) : undefined}>
          <NoteHeader
            note={note}
            folders={folders}
            editor={editor}
            focusTitle={fresh}
            onDone={() => editor.persist(editor.finish)}
            onDelete={() => setConfirm('delete')}
            onBack={onClose}
          />
          <NoteConflict editor={editor} />
          {editor.editing ? <NoteEditor editor={editor} noteId={note.id} autoFocus={!fresh} /> : <MarkdownView body={note.body} onEdit={editor.start} />}
        </article>
        <RelatedNotes detail={detail} onOpen={onOpenNote} />
        <NoteDialogs confirm={confirm} note={note} onDiscard={editor.finish} onDeleted={onClose} onClose={() => setConfirm(null)} />
      </div>
    </WikiContext.Provider>
  );
}
