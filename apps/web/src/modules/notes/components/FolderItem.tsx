import { useRef, useState } from 'react';
import { ConfirmDialog } from '../../core/components/ConfirmDialog';
import { OptionList } from '../../core/components/OptionMenu';
import { Popover } from '../../core/components/Popover';
import { showToast } from '../../core/components/Toast';
import { ApiError } from '../../core/services/api-client';
import { descendantIds, folderPath, type FolderNode } from '../lib/folder-tree';
import { useCreateFolder, useDeleteFolder, useUpdateFolder } from '../services/queries';
import { FolderNameInput } from './FolderNameInput';
import { folderOptions, ROOT } from './FolderPicker';
import { FolderRow, type FolderAction } from './FolderRow';
import { FolderTree, type TreeContext } from './FolderTree';

interface Props {
  node: FolderNode;
  depth: number;
  ctx: TreeContext;
}

type Mode = 'idle' | 'adding' | 'renaming' | 'deleting';

const MODES: Partial<Record<FolderAction, Mode>> = { folder: 'adding', rename: 'renaming', delete: 'deleting' };

const onError = (error: Error) => showToast(error instanceof ApiError && error.status < 500 ? error.message : 'Could not update the folder', 'error');

function MoveMenu({ node, ctx, anchor, onClose }: Props & { anchor: HTMLElement | null; onClose: () => void }) {
  const update = useUpdateFolder();
  const { folder } = node;
  const options = folderOptions(ctx.folders, descendantIds(ctx.folders, folder.id), 'Top level');

  function choose(value: string) {
    onClose();
    if (value !== (folder.parentId ?? ROOT)) update.mutate({ id: folder.id, patch: { parentId: value || null } }, { onError });
  }

  return (
    <Popover open={Boolean(anchor)} anchor={anchor} onClose={onClose} className="pop enter">
      <OptionList label={`Move ${folder.name} to`} value={folder.parentId ?? ROOT} options={options} onChoose={choose} onDismiss={onClose} />
    </Popover>
  );
}

function DeleteFolder({ node, ctx, onClose }: Props & { onClose: () => void }) {
  const remove = useDeleteFolder();
  const parent = folderPath(ctx.folders, node.folder.parentId).at(-1);
  return (
    <ConfirmDialog
      open
      title={`Delete “${node.folder.name}”?`}
      message={`Its notes and subfolders move to ${parent ? `“${parent.name}”` : 'the top level'}. Nothing inside is deleted.`}
      confirmLabel="Delete folder"
      onConfirm={() => remove.mutate(node.folder.id, { onError })}
      onClose={onClose}
    />
  );
}

function RenameFolder({ node, depth, onDone }: Omit<Props, 'ctx'> & { onDone: () => void }) {
  const update = useUpdateFolder();
  return (
    <FolderNameInput
      initial={node.folder.name}
      depth={depth}
      label="Folder name"
      onSubmit={name => update.mutate({ id: node.folder.id, patch: { name } }, { onError, onSettled: onDone })}
      onCancel={onDone}
    />
  );
}

function AddSubfolder({ node, depth, onDone }: Omit<Props, 'ctx'> & { onDone: () => void }) {
  const create = useCreateFolder();
  return (
    <FolderNameInput
      depth={depth + 1}
      label="New folder name"
      onSubmit={name => create.mutate({ name, parentId: node.folder.id }, { onError, onSettled: onDone })}
      onCancel={onDone}
    />
  );
}

export function FolderItem({ node, depth, ctx }: Props) {
  const [mode, setMode] = useState<Mode>('idle');
  const [moveAnchor, setMoveAnchor] = useState<HTMLElement | null>(null);
  const menuRef = useRef<HTMLSpanElement>(null);
  const { folder } = node;
  const open = !ctx.collapsed.has(folder.id) || mode === 'adding';
  const idle = () => setMode('idle');

  function onAction(action: FolderAction) {
    if (action === 'note') ctx.onCreateNote(folder.id);
    else if (action === 'move') setMoveAnchor(menuRef.current?.querySelector('button') ?? null);
    else setMode(MODES[action] ?? 'idle');
  }

  function onToggle() {
    ctx.toggle(folder.id);
    ctx.onSelectFolder(folder.id);
  }

  return (
    <li>
      {mode === 'renaming' ? (
        <RenameFolder node={node} depth={depth} onDone={idle} />
      ) : (
        <FolderRow
          folder={folder}
          depth={depth}
          open={open}
          selected={ctx.activeFolderId === folder.id}
          menuRef={menuRef}
          onToggle={onToggle}
          onAction={onAction}
        />
      )}
      {mode === 'adding' && <AddSubfolder node={node} depth={depth} onDone={idle} />}
      {open && (node.folders.length > 0 || node.notes.length > 0) && <FolderTree nodes={node.folders} notes={node.notes} depth={depth + 1} ctx={ctx} />}
      {mode === 'deleting' && <DeleteFolder node={node} depth={depth} ctx={ctx} onClose={idle} />}
      <MoveMenu node={node} depth={depth} ctx={ctx} anchor={moveAnchor} onClose={() => setMoveAnchor(null)} />
    </li>
  );
}
