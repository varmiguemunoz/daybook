import type { Member, Task, TaskStatus } from '@gr8r/domain';
import { TASK_STATUS_LABELS, TASK_STATUSES } from '@gr8r/domain';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import { Icon } from '../../../shared/ui/Icon';
import { StatusIcon } from '../../../shared/ui/vocab';
import { BoardCard, BoardCardView } from './BoardCard';
import { DragOverlay } from '@dnd-kit/core';
import { tasksByStatus } from '../view-model';

interface Props {
  tasks: Task[];
  members: Map<string, Member>;
  onAdd: (status: TaskStatus) => void;
  onOpen: (task: Task) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
}

function BoardColumn({ status, tasks, members, onAdd, onOpen }: Props & { status: TaskStatus }) {
  const { setNodeRef } = useDroppable({ id: status });
  return (
    <section className="bcol" aria-label={TASK_STATUS_LABELS[status]}>
      <div className="bcol-h">
        <StatusIcon status={status} />
        <span>{TASK_STATUS_LABELS[status]}</span>
        <span className="cnt">{tasks.length}</span>
        <span className="acts">
          <button
            className="ibtn ibtn-xs"
            type="button"
            onClick={() => onAdd(status)}
            data-tip="Add task"
            aria-label={`Add task to ${TASK_STATUS_LABELS[status]}`}
          >
            <Icon name="plus" size={14} />
          </button>
          <button className="ibtn ibtn-xs" type="button" aria-label="Column options">
            <Icon name="ellipsis" size={14} />
          </button>
        </span>
      </div>
      <div className="bcol-b" ref={setNodeRef}>
        {tasks.map(task => (
          <BoardCard key={task.id} task={task} members={members} onOpen={onOpen} />
        ))}
        <button className="addcard" type="button" onClick={() => onAdd(status)}>
          <Icon name="plus" size={14} />
          Add task
        </button>
      </div>
    </section>
  );
}

function targetStatusFor(over: { id: string | number } | null, grouped: (s: TaskStatus) => Task[]): TaskStatus | undefined {
  if (!over) return undefined;
  if (TASK_STATUSES.includes(over.id as TaskStatus)) return over.id as TaskStatus;
  return TASK_STATUSES.find(status => grouped(status).some(item => item.id === over.id));
}

function BoardOverlay({ activeTask, members }: { activeTask?: Task; members: Map<string, Member> }) {
  if (!activeTask) return null;
  return (
    <DragOverlay>
      <div style={{ width: 260, cursor: 'grabbing' }}>
        <BoardCardView task={activeTask} members={members} />
      </div>
    </DragOverlay>
  );
}

export function Board({ tasks, members, onAdd, onOpen, onMove }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const grouped = (status: TaskStatus) => tasksByStatus(tasks, status);
  const activeTask = activeId ? tasks.find(task => task.id === activeId) : undefined;

  function handleDragStart(event: { active: { id: string | number } }) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const taskId = String(active.id);
    const task = tasks.find(item => item.id === taskId);
    if (!task) return;
    const targetStatus = targetStatusFor(over, grouped) as TaskStatus | undefined;
    if (!targetStatus || targetStatus === task.status) return;
    onMove(taskId, targetStatus);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="board">
        {TASK_STATUSES.map(status => (
          <BoardColumn key={status} status={status} tasks={grouped(status)} members={members} onAdd={onAdd} onOpen={onOpen} onMove={onMove} />
        ))}
      </div>
      <BoardOverlay activeTask={activeTask} members={members} />
    </DndContext>
  );
}
