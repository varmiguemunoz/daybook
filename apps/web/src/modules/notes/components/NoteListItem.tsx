import type { CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { NoteSummary } from '@daybook/domain';
import { Icon } from '../../core/components/Icon';

interface Props {
  note: NoteSummary;
  depth: number;
  active: boolean;
  meta?: string;
  onOpen: (note: NoteSummary) => void;
}

export function NoteListItem({ note, depth, active, meta, onOpen }: Props) {
  const drag = useDraggable({ id: `note:${note.id}`, data: { kind: 'note', id: note.id, title: note.title, from: note.folderId } });
  return (
    <li>
      <button
        ref={drag.setNodeRef}
        {...drag.listeners}
        type="button"
        className={`nrow note ${active ? 'on' : ''} ${drag.isDragging ? 'dragging' : ''}`.trim()}
        style={{ '--depth': depth } as CSSProperties}
        aria-current={active ? 'page' : undefined}
        onClick={() => onOpen(note)}
      >
        <span className="nrow-chev" />
        <Icon name="file-text" size={15} />
        <span className="trunc">{note.title}</span>
        {meta && <span className="nrow-meta trunc">{meta}</span>}
      </button>
    </li>
  );
}
