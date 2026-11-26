import { Icon } from '../../core/components/Icon';
import { timeAgo } from '../../core/utils/dates';
import type { NoteEditorState } from '../hooks/use-note-editor';

export function NoteConflict({ editor }: { editor: NoteEditorState }) {
  if (!editor.conflict) return null;
  return (
    <div className="note-conflict" role="alert">
      <Icon name="triangle-alert" size={16} />
      <p>Someone saved a newer version {timeAgo(editor.conflict.updatedAt)}. Your changes are not saved yet.</p>
      <div className="note-conflict-acts">
        <button type="button" className="btn btn-secondary btn-sm" onClick={editor.takeTheirs}>
          Use their version
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={editor.keepMine} disabled={editor.saving}>
          Keep mine
        </button>
      </div>
    </div>
  );
}
