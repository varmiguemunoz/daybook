import type { Member, Task } from '@gr8r/domain';
import { Icon } from '../../../shared/ui/Icon';
import { WD, diffDays, isoDate, TODAY } from '../../../shared/dates';
import { MonthChip } from './CalendarChips';

interface Props {
  days: Date[];
  month: Date;
  tasks: Task[];
  members: Map<string, Member>;
}

const WEEK_START = 0;

function dayTasks(day: string, tasks: Task[]): Task[] {
  return tasks.filter(task => task.dueDate === day);
}

function MonthCell({ day, month, tasks, members }: Omit<Props, 'days'> & { day: Date }) {
  const key = isoDate(day);
  const items = dayTasks(key, tasks);
  const isToday = diffDays(day, TODAY) === 0;

  return (
    <div className={`cday ${day.getMonth() !== month.getMonth() ? 'out' : ''} ${isToday ? 'today' : ''}`.trim()}>
      <span className="dn" aria-current={isToday ? 'date' : undefined}>
        {day.getDate()}
      </span>
      <button className="ibtn ibtn-xs add" type="button" aria-label={`Add task on ${key}`}>
        <Icon name="plus" size={13} />
      </button>
      {items.slice(0, 3).map(task => (
        <MonthChip key={task.id} task={task} assignee={task.assigneeId ? members.get(task.assigneeId) : undefined} />
      ))}
      {items.length > 3 && (
        <button className="cmore" type="button">
          +{items.length - 3} more
        </button>
      )}
    </div>
  );
}

export function CalendarMonth({ days, month, tasks, members }: Props) {
  return (
    <>
      <div className="cal-h">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index}>{WD[(index + WEEK_START) % 7]}</div>
        ))}
      </div>
      <div className="cal-g" style={{ gridTemplateRows: `repeat(${days.length / 7},minmax(112px,1fr))` }}>
        {days.map(day => (
          <MonthCell key={isoDate(day)} day={day} month={month} tasks={tasks} members={members} />
        ))}
      </div>
    </>
  );
}
