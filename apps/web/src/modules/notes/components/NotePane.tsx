import { EmptyState } from '../../core/components/EmptyState';
import { Skeleton } from '../../core/components/Skeleton';
import { ApiError } from '../../core/services/api-client';
import { useFolders, useNote } from '../services/queries';
import { NoteView, type NoteViewProps } from './NoteView';

type Props = Omit<NoteViewProps, 'detail' | 'folders'> & { id: string };

function NoteError({ error, onClose, onRetry }: { error: Error; onClose: () => void; onRetry: () => void }) {
  const missing = error instanceof ApiError && error.status === 404;
  return (
    <div className="notes-doc notes-blank">
      <EmptyState
        className={missing ? '' : 'err'}
        icon={missing ? 'file-x' : 'circle-alert'}
        title={missing ? 'This note no longer exists' : 'The note did not load'}
        text={missing ? 'Someone may have deleted it. Pick another note from the list.' : 'Check your connection and try again.'}
        action={
          <button type="button" className="btn btn-secondary btn-sm" onClick={missing ? onClose : onRetry}>
            {missing ? 'Back to notes' : 'Try again'}
          </button>
        }
      />
    </div>
  );
}

export function NotePane({ id, ...props }: Props) {
  const note = useNote(id);
  const folders = useFolders();

  if (note.isPending) {
    return (
      <div className="notes-doc">
        <div className="notes-pane">
          <Skeleton lines={8} />
        </div>
      </div>
    );
  }

  if (note.error) return <NoteError error={note.error} onClose={props.onClose} onRetry={() => void note.refetch()} />;

  return <NoteView detail={note.data} folders={folders.data ?? []} {...props} />;
}
