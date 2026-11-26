import type { Folder, Note } from '@daybook/domain';
import { Icon } from '../../core/components/Icon';
import { showToast } from '../../core/components/Toast';
import { useSaveNote } from '../services/queries';
import type { NoteEditorState } from '../hooks/use-note-editor';
import { exportMarkdown } from '../lib/export-markdown';
import { folderPath } from '../lib/folder-tree';
import { FolderPicker } from './FolderPicker';

interface Props {
  note: Note;
  folders: Folder[];
  editor: NoteEditorState;
  focusTitle: boolean;
  onDone: () => void;
  onDelete: () => void;
  onBack: () => void;
}

function Location({ note, folders }: Pick<Props, 'note' | 'folders'>) {
  const path = folderPath(folders, note.folderId);
  const save = useSaveNote();
  const onMove = (folderId: string | null) =>
    save.mutate({ id: note.id, patch: { folderId } }, { onError: () => showToast('Could not move the note', 'error') });
  return (
    <FolderPicker label="Move note to folder" folders={folders} value={note.folderId} onSelect={onMove} className="note-loc">
      <Icon name={path.length ? 'folder' : 'inbox'} size={13} />
      <span className="trunc">{path.length ? path.map(folder => folder.name).join(' / ') : 'No folder'}</span>
      <Icon name="chevron-down" size={12} />
    </FolderPicker>
  );
}

function Actions({ note, editor, onDone, onDelete }: Pick<Props, 'note' | 'editor' | 'onDone' | 'onDelete'>) {
  return (
    <div className="note-acts">
      <span className={`note-status ${editor.dirty ? 'dirty' : ''}`.trim()} role="status" aria-live="polite">
        {editor.status}
      </span>
      {editor.editing ? (
        <button type="button" className="btn btn-primary btn-sm" onClick={onDone} disabled={editor.saving}>
          <Icon name="check" size={14} />
          Done
        </button>
      ) : (
        <button type="button" className="btn btn-secondary btn-sm" onClick={editor.start}>
          <Icon name="pencil" size={14} />
          Edit
        </button>
      )}
      <button type="button" className="ibtn ibtn-sm" onClick={() => exportMarkdown(note)} aria-label="Download as Markdown" data-tip="Download .md">
        <Icon name="download" size={15} />
      </button>
      <button type="button" className="ibtn ibtn-sm" onClick={onDelete} aria-label="Delete note" data-tip="Delete note">
        <Icon name="trash-2" size={15} />
      </button>
    </div>
  );
}

export function NoteHeader({ note, folders, editor, focusTitle, onDone, onDelete, onBack }: Props) {
  return (
    <header className="note-h">
      <div className="note-bar">
        <button type="button" className="ibtn ibtn-sm notes-back" onClick={onBack} aria-label="Back to notes">
          <Icon name="arrow-left" size={16} />
        </button>
        <Location note={note} folders={folders} />
        <Actions note={note} editor={editor} onDone={onDone} onDelete={onDelete} />
      </div>
      {editor.editing ? (
        <input
          className="note-title-in"
          aria-label="Note title"
          value={editor.draft.title}
          onChange={event => editor.change({ title: event.target.value })}
          maxLength={200}
          autoFocus={focusTitle}
          onFocus={event => focusTitle && event.currentTarget.select()}
          onKeyDown={event => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            event.currentTarget.closest('.notes-pane')?.querySelector('textarea')?.focus();
          }}
        />
      ) : (
        <h1 className="note-title" onDoubleClick={editor.start}>
          {note.title}
        </h1>
      )}
    </header>
  );
}
