import type { CSSProperties, RefObject } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { Folder } from '@daybook/domain';
import { Icon } from '../../core/components/Icon';
import { OptionMenu } from '../../core/components/OptionMenu';

export type FolderAction = 'note' | 'folder' | 'rename' | 'move' | 'delete';

const ACTIONS: Array<{ value: FolderAction; label: string; icon: string }> = [
  { value: 'note', label: 'New note here', icon: 'file-plus' },
  { value: 'folder', label: 'New subfolder', icon: 'folder-plus' },
  { value: 'rename', label: 'Rename', icon: 'pencil' },
  { value: 'move', label: 'Move to…', icon: 'folder-input' },
  { value: 'delete', label: 'Delete folder', icon: 'trash-2' },
];
const OPTIONS = ACTIONS.map(action => ({ ...action, icon: <Icon name={action.icon} size={14} /> }));

interface Props {
  folder: Folder;
  depth: number;
  open: boolean;
  selected: boolean;
  menuRef: RefObject<HTMLSpanElement | null>;
  onToggle: () => void;
  onAction: (action: FolderAction) => void;
}

export function FolderRow({ folder, depth, open, selected, menuRef, onToggle, onAction }: Props) {
  const drop = useDroppable({ id: `drop:${folder.id}`, data: { folderId: folder.id } });
  const drag = useDraggable({ id: `folder:${folder.id}`, data: { kind: 'folder', id: folder.id, title: folder.name, from: folder.parentId } });
  const state = `${selected ? 'sel' : ''} ${drop.isOver ? 'drop-over' : ''} ${drag.isDragging ? 'dragging' : ''}`;

  return (
    <div ref={drop.setNodeRef} className={`tree-row folder ${state}`.replace(/\s+/g, ' ').trim()} style={{ '--depth': depth } as CSSProperties}>
      <button ref={drag.setNodeRef} {...drag.listeners} type="button" className="tree-row-main" aria-expanded={open} onClick={onToggle}>
        <Icon name="chevron-right" size={13} className="tree-row-chev" />
        <Icon name={open ? 'folder-open' : 'folder'} size={15} />
        <span className="trunc">{folder.name}</span>
      </button>
      <span ref={menuRef} className="tree-row-menu">
        <OptionMenu label={`Actions for ${folder.name}`} options={OPTIONS} onSelect={onAction} className="ibtn ibtn-xs">
          <Icon name="ellipsis" size={14} />
        </OptionMenu>
      </span>
    </div>
  );
}
