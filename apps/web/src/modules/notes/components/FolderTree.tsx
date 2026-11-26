import type { Folder, NoteSummary } from '@daybook/domain';
import type { FolderNode } from '../lib/folder-tree';
import { FolderItem } from './FolderItem';
import { NoteListItem } from './NoteListItem';

export interface TreeContext {
  folders: Folder[];
  activeNoteId: string | null;
  activeFolderId: string | null;
  collapsed: Set<string>;
  toggle: (id: string, open?: boolean) => void;
  onOpenNote: (note: NoteSummary) => void;
  onSelectFolder: (id: string | null) => void;
  onCreateNote: (folderId: string | null) => void;
}

interface Props {
  nodes: FolderNode[];
  notes: NoteSummary[];
  depth: number;
  ctx: TreeContext;
}

export function FolderTree({ nodes, notes, depth, ctx }: Props) {
  return (
    <ul className="ntree">
      {nodes.map(node => (
        <FolderItem key={node.folder.id} node={node} depth={depth} ctx={ctx} />
      ))}
      {notes.map(note => (
        <NoteListItem key={note.id} note={note} depth={depth} active={note.id === ctx.activeNoteId} onOpen={ctx.onOpenNote} />
      ))}
    </ul>
  );
}
