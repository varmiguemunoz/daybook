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
import { useTaskUi } from '../../tasks/task-ui-store';
import { useUpdateTask } from '../../tasks/queries';

interface Props {
  tasks: Task[];
  members: Member[];
  memberById: Map<string, Member>;
}

function BoardColumn({ status, tasks, members, memberById }: Props & { status: TaskStatus }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const openComposer = useTaskUi(state => state.openComposer);
  const onAdd = () => openComposer({ status });
  return (
    <section className={`bcol ${isOver ? 'over' : ''}`.trim()} aria-label={TASK_STATUS_LABELS[status]}>
      <div className="bcol-h">
        <StatusIcon status={status} />
        <span>{TASK_STATUS_LABELS[status]}</span>
        <span className="cnt">{tasks.length}</span>
        <span className="acts">
          <button className="ibtn ibtn-xs" type="button" onClick={onAdd} data-tip="Add task" aria-label={`Add task to ${TASK_STATUS_LABELS[status]}`}>
            <Icon name="plus" size={14} />
          </button>
        </span>
      </div>
      <div className="bcol-b" ref={setNodeRef}>
        {tasks.map(task => (
          <BoardCard key={task.id} task={task} members={members} memberById={memberById} />
        ))}
        <button className="addcard" type="button" onClick={onAdd}>
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

function BoardOverlay({ activeTask, members, memberById }: { activeTask?: Task; members: Member[]; memberById: Map<string, Member> }) {
  if (!activeTask) return null;
  return (
    <DragOverlay>
      <div style={{ width: 260, cursor: 'grabbing' }}>
        <BoardCardView task={activeTask} members={members} memberById={memberById} />
      </div>
    </DragOverlay>
  );
}

export function Board({ tasks, members, memberById }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const update = useUpdateTask();
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
    update.mutate({ id: taskId, patch: { status: targetStatus } });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="board">
        {TASK_STATUSES.map(status => (
          <BoardColumn key={status} status={status} tasks={grouped(status)} members={members} memberById={memberById} />
        ))}
      </div>
      <BoardOverlay activeTask={activeTask} members={members} memberById={memberById} />
    </DndContext>
  );
}
