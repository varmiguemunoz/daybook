import type { ReactNode } from 'react';
import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';
import type { Folder } from '@daybook/domain';
import { Icon } from '../../core/components/Icon';
import { ROOT_DROP, useTreeDnd } from '../hooks/use-tree-dnd';

function RootDrop({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: ROOT_DROP, data: { folderId: null } });
  return (
    <div ref={setNodeRef} className={`ntree-root ${isOver ? 'drop-over' : ''}`.trim()}>
      {children}
    </div>
  );
}

// Drag notes and folders onto a folder, or onto empty tree space to move them to the top level.
export function TreeDnd({ folders, children }: { folders: Folder[]; children: ReactNode }) {
  const dnd = useTreeDnd(folders);

  return (
    <DndContext
      sensors={dnd.sensors}
      collisionDetection={dnd.collision}
      onDragStart={dnd.onDragStart}
      onDragEnd={dnd.onDragEnd}
      onDragCancel={dnd.onDragCancel}
    >
      <RootDrop>{children}</RootDrop>
      <DragOverlay dropAnimation={null}>
        {dnd.dragging && (
          <div className="nrow drag-ghost">
            <Icon name={dnd.dragging.kind === 'note' ? 'file-text' : 'folder'} size={15} />
            <span className="trunc">{dnd.dragging.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
