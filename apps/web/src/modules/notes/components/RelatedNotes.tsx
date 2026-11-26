import type { Member, NoteDetail, NoteSummary } from '@daybook/domain';
import { Icon } from '../../core/components/Icon';
import { showToast } from '../../core/components/Toast';
import { useMembers } from '../../members/services/queries';
import { useSetNoteLinks } from '../services/queries';
import { formatDate, isoDate, timeAgo } from '../../core/utils/dates';
import { NotePicker } from './NotePicker';

interface Props {
  detail: NoteDetail;
  onOpen: (note: NoteSummary) => void;
}

function LinkRow({ note, icon, onOpen, onRemove }: { note: NoteSummary; icon: string; onOpen: (note: NoteSummary) => void; onRemove?: () => void }) {
  return (
    <li className="link-row">
      <button type="button" className="link-open" onClick={() => onOpen(note)}>
        <Icon name={icon} size={14} />
        <span className="trunc">{note.title}</span>
      </button>
      {onRemove && (
        <button type="button" className="ibtn ibtn-xs" onClick={onRemove} aria-label={`Unlink ${note.title}`} data-tip="Unlink">
          <Icon name="x" size={13} />
        </button>
      )}
    </li>
  );
}

function RailMeta({ note, members }: { note: NoteDetail['note']; members: Member[] }) {
  const author = members.find(member => member.id === note.authorId);
  return (
    <dl className="rail-meta">
      <dt>Author</dt>
      <dd>{author?.name ?? 'Former member'}</dd>
      <dt>Updated</dt>
      <dd>{timeAgo(note.updatedAt)}</dd>
      <dt>Created</dt>
      <dd>{formatDate(isoDate(new Date(note.createdAt)), true)}</dd>
    </dl>
  );
}

function Backlinks({ notes, onOpen }: { notes: NoteSummary[]; onOpen: (note: NoteSummary) => void }) {
  return (
    <section className="rail-sec">
      <h2>
        Mentioned in <span className="ct">{notes.length || ''}</span>
      </h2>
      {notes.length ? (
        <ul className="link-list">
          {notes.map(source => (
            <LinkRow key={source.id} note={source} icon="arrow-down-left" onOpen={onOpen} />
          ))}
        </ul>
      ) : (
        <p className="rail-empty">No note links here yet.</p>
      )}
    </section>
  );
}

export function RelatedNotes({ detail, onOpen }: Props) {
  const { note, related, backlinks } = detail;
  const { data: members = [] } = useMembers();
  const links = useSetNoteLinks();
  const onLinksChange = (linkIds: string[]) => links.mutate({ id: note.id, linkIds }, { onError: () => showToast('Could not update the links', 'error') });
  const linked = new Set([note.id, ...note.linkIds]);

  return (
    <aside className="notes-rail" aria-label="Connections">
      <section className="rail-sec">
        <h2>
          Related <span className="ct">{related.length || ''}</span>
        </h2>
        {related.length > 0 && (
          <ul className="link-list">
            {related.map(target => (
              <LinkRow
                key={target.id}
                note={target}
                icon="arrow-up-right"
                onOpen={onOpen}
                onRemove={() => onLinksChange(note.linkIds.filter(id => id !== target.id))}
              />
            ))}
          </ul>
        )}
        <NotePicker exclude={linked} onPick={id => onLinksChange([...note.linkIds, id])} />
      </section>
      <Backlinks notes={backlinks} onOpen={onOpen} />
      <RailMeta note={note} members={members} />
    </aside>
  );
}
