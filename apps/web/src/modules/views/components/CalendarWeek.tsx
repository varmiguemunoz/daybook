import { useDroppable } from '@dnd-kit/core';
import type { Member, Task } from '@daybook/domain';
import { Icon } from '../../core/components/Icon';
import { WD, diffDays, isoDate, today } from '../../core/utils/dates';
import { useTaskUi } from '../../tasks/states/task-ui-store';
import { WeekChip } from './CalendarChips';

interface Props {
  days: Date[];
  tasks: Task[];
  members: Map<string, Member>;
}

function WeekColumn({ day, tasks, members }: Omit<Props, 'days'> & { day: Date }) {
  const key = isoDate(day);
  const isToday = diffDays(day, today()) === 0;
  const items = tasks.filter(task => task.dueDate === key);
  const { setNodeRef, isOver } = useDroppable({ id: key });
  const openComposer = useTaskUi(state => state.openComposer);

  return (
    <div className="wcol">
      <div className={`wcol-h ${isToday ? 'today' : ''}`.trim()}>
        <span className="n">{day.getDate()}</span>
        <span className="muted" style={{ fontSize: 12 }}>
          {WD[day.getDay()]}
        </span>
        <span className="sp" />
        <button className="ibtn ibtn-xs" type="button" aria-label={`Add task on ${key}`} onClick={() => openComposer({ dueDate: key })}>
          <Icon name="plus" size={13} />
        </button>
      </div>
      <div ref={setNodeRef} className={`wcol-b ${isOver ? 'over' : ''}`.trim()}>
        {items.length ? (
          items.map(task => <WeekChip key={task.id} task={task} assignee={task.assigneeId ? members.get(task.assigneeId) : undefined} />)
        ) : (
          <span className="faint" style={{ fontSize: 12, padding: 4 }}>
            No tasks
          </span>
        )}
      </div>
    </div>
  );
}

export function CalendarWeek({ days, tasks, members }: Props) {
  return (
    <div className="week">
      {days.map(day => (
        <WeekColumn key={isoDate(day)} day={day} tasks={tasks} members={members} />
      ))}
    </div>
  );
}
