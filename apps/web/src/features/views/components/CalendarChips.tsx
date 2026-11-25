import { useDraggable } from '@dnd-kit/core';
import type { Member, Task } from '@gr8r/domain';
import { Avatar } from '../../../shared/ui/Avatar';
import { PriorityIcon, StatusIcon } from '../../../shared/ui/vocab';
import { useTaskUi } from '../../tasks/task-ui-store';

export interface ChipProps {
  task: Task;
  assignee?: Member;
}

function useTaskDrag(task: Task) {
  const openTask = useTaskUi(state => state.openTask);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return { ref: setNodeRef, opacity: isDragging ? 0.4 : 1, handlers: { ...attributes, ...listeners, onClick: () => openTask(task.id) } };
}

export function MonthChipContent({ task, assignee }: ChipProps) {
  return (
    <>
      {task.status === 'done' ? <StatusIcon status="done" size={11} /> : <PriorityIcon priority={task.priority} size={11} />}
      <span className="trunc">{task.title}</span>
      <Avatar member={assignee} className="" tip={false} />
    </>
  );
}

export function MonthChip({ task, assignee }: ChipProps) {
  const drag = useTaskDrag(task);
  return (
    <button
      ref={drag.ref}
      className={`cev ${task.status === 'done' ? 'done' : ''}`.trim()}
      type="button"
      style={{ ['--c' as string]: 'var(--gray)', opacity: drag.opacity }}
      title={task.title}
      {...drag.handlers}
    >
      <MonthChipContent task={task} assignee={assignee} />
    </button>
  );
}

export function WeekChip({ task, assignee }: ChipProps) {
  const drag = useTaskDrag(task);
  return (
    <button ref={drag.ref} className="wcard" type="button" style={{ ['--c' as string]: 'var(--gray)', opacity: drag.opacity }} {...drag.handlers}>
      <span className="t" style={task.status === 'done' ? { textDecoration: 'line-through', color: 'var(--text-3)' } : undefined}>
        <span className="pdot" style={{ ['--c' as string]: 'var(--gray)' }} />
        {task.title}
      </span>
      <span className="m">
        <StatusIcon status={task.status} size={11} />
        <PriorityIcon priority={task.priority} size={11} />
        <span className="trunc grow">{task.key}</span>
        <Avatar member={assignee} className="sm" tip={false} />
      </span>
    </button>
  );
}
