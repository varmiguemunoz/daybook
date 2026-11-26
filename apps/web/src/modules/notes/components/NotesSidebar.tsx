import { useState } from 'react';
import type { Folder, NoteSummary } from '@daybook/domain';
import { EmptyState } from '../../core/components/EmptyState';
import { Icon } from '../../core/components/Icon';
import { SearchField } from '../../core/components/SearchField';
import { Skeleton } from '../../core/components/Skeleton';
import { showToast } from '../../core/components/Toast';
import { useCollapsedFolders } from '../hooks/use-collapsed-folders';
import { buildTree, pathLabel } from '../lib/folder-tree';
import { useCreateFolder, useFolders, useNoteIndex } from '../services/queries';
import { FolderNameInput } from './FolderNameInput';
import { FolderTree, type TreeContext } from './FolderTree';
import { NoteListItem } from './NoteListItem';
import { TreeDnd } from './TreeDnd';

interface Props {
  activeNoteId: string | null;
  activeFolderId: string | null;
  creating: boolean;
  onOpenNote: (note: NoteSummary) => void;
  onSelectFolder: (id: string | null) => void;
  onCreateNote: (folderId: string | null) => void;
}

function SearchResults({ query, notes, folders, ctx }: { query: string; notes: NoteSummary[]; folders: Folder[]; ctx: TreeContext }) {
  const term = query.trim().toLowerCase();
  const matches = notes.filter(note => note.title.toLowerCase().includes(term));
  if (!matches.length) return <p className="notes-side-empty">No notes match “{query.trim()}”.</p>;
  return (
    <ul className="ntree">
      {matches.map(note => (
        <NoteListItem
          key={note.id}
          note={note}
          depth={0}
          active={note.id === ctx.activeNoteId}
          meta={note.folderId ? pathLabel(folders, note.folderId) : undefined}
          onOpen={ctx.onOpenNote}
        />
      ))}
    </ul>
  );
}

function Explorer({ ctx, notes, adding, onAdded }: { ctx: TreeContext; notes: NoteSummary[]; adding: boolean; onAdded: () => void }) {
  const create = useCreateFolder();
  const tree = buildTree(ctx.folders, notes);
  return (
    <>
      {adding && (
        <FolderNameInput
          depth={0}
          label="New folder name"
          onSubmit={name => create.mutate({ name, parentId: null }, { onSettled: onAdded, onError: () => showToast('Could not create the folder', 'error') })}
          onCancel={onAdded}
        />
      )}
      {tree.folders.length || tree.notes.length ? (
        <TreeDnd folders={ctx.folders}>
          <FolderTree nodes={tree.folders} notes={tree.notes} depth={0} ctx={ctx} />
        </TreeDnd>
      ) : (
        !adding && <EmptyState className="sm" icon="notebook-pen" title="No notes yet" text="Create a note, or a folder to group them." level={3} />
      )}
    </>
  );
}

export function NotesSidebar({ creating, ...props }: Props) {
  const folders = useFolders();
  const notes = useNoteIndex();
  const { collapsed, toggle } = useCollapsedFolders();
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const ctx: TreeContext = { ...props, folders: folders.data ?? [], collapsed, toggle };

  return (
    <nav className="notes-side" aria-label="Notes">
      <div className="notes-side-h">
        <h1>Notes</h1>
        <button type="button" className="ibtn ibtn-sm" onClick={() => setAdding(true)} aria-label="New folder" data-tip="New folder">
          <Icon name="folder-plus" size={15} />
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => props.onCreateNote(props.activeFolderId)} disabled={creating}>
          <Icon name="plus" size={14} />
          New note
        </button>
      </div>
      <div className="notes-search">
        <SearchField value={query} onChange={setQuery} placeholder="Search notes" />
      </div>
      <div className="notes-tree">
        {folders.isPending || notes.isPending ? (
          <Skeleton lines={6} />
        ) : folders.error || notes.error ? (
          <EmptyState className="sm err" icon="circle-alert" title="Notes did not load" text="Check your connection and reload the page." level={3} />
        ) : query.trim() ? (
          <SearchResults query={query} notes={notes.data} folders={ctx.folders} ctx={ctx} />
        ) : (
          <Explorer ctx={ctx} notes={notes.data} adding={adding} onAdded={() => setAdding(false)} />
        )}
      </div>
    </nav>
  );
}
