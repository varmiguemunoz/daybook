import { useState } from 'react';
import { PointerSensor, pointerWithin, useSensor, useSensors, type CollisionDetection, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import type { Folder } from '@daybook/domain';
import { showToast } from '../../core/components/Toast';
import { ApiError } from '../../core/services/api-client';
import { descendantIds } from '../lib/folder-tree';
import { useSaveNote, useUpdateFolder } from '../services/queries';

export interface DragItem {
  kind: 'note' | 'folder';
  id: string;
  title: string;
  from: string | null;
}

export interface DropTarget {
  folderId: string | null;
}

export const ROOT_DROP = 'drop:root';

// The whole tree is the top-level target; any folder under the pointer wins over it.
const collision: CollisionDetection = args => {
  const hits = pointerWithin(args);
  const folders = hits.filter(hit => hit.id !== ROOT_DROP);
  return folders.length ? folders : hits;
};

const onError = (error: Error) => showToast(error instanceof ApiError && error.status < 500 ? error.message : 'Could not move it', 'error');

export function useTreeDnd(folders: Folder[]) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [dragging, setDragging] = useState<DragItem | null>(null);
  const saveNote = useSaveNote();
  const updateFolder = useUpdateFolder();

  function onDragEnd({ active, over }: DragEndEvent) {
    setDragging(null);
    const item = active.data.current as DragItem | undefined;
    const target = over?.data.current as DropTarget | undefined;
    if (!item || !target || target.folderId === item.from) return;
    if (item.kind === 'note') return saveNote.mutate({ id: item.id, patch: { folderId: target.folderId } }, { onError });
    if (target.folderId && descendantIds(folders, item.id).has(target.folderId)) return;
    updateFolder.mutate({ id: item.id, patch: { parentId: target.folderId } }, { onError });
  }

  return {
    sensors,
    collision,
    dragging,
    onDragStart: ({ active }: DragStartEvent) => setDragging((active.data.current as DragItem | undefined) ?? null),
    onDragEnd,
    onDragCancel: () => setDragging(null),
  };
}
