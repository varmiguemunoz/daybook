import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Member, Task } from '@gr8r/domain';
import { Icon } from '../../../shared/ui/Icon';
import { Popover } from '../../../shared/ui/Popover';
import { WD, diffDays, isoDate, TODAY } from '../../../shared/dates';
import { useTaskUi } from '../../tasks/task-ui-store';
import { MonthChip } from './CalendarChips';

interface Props {
  days: Date[];
  month: Date;
  tasks: Task[];
  members: Map<string, Member>;
}

const WEEK_START = 0;
const VISIBLE_CHIPS = 3;

function DayOverflow({ tasks, members }: { tasks: Task[]; members: Map<string, Member> }) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  return (
    <>
      <button
        className="cmore"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        onClick={event => setAnchor(anchor ? null : event.currentTarget)}
      >
        +{tasks.length - VISIBLE_CHIPS} more
      </button>
      <Popover open={Boolean(anchor)} anchor={anchor} onClose={() => setAnchor(null)} className="pop enter">
        <div className="col" style={{ gap: 4, minWidth: 220 }}>
          {tasks.map(task => (
            <MonthChip key={task.id} task={task} assignee={task.assigneeId ? members.get(task.assigneeId) : undefined} />
          ))}
        </div>
      </Popover>
    </>
  );
}

function MonthCell({ day, month, tasks, members }: Omit<Props, 'days'> & { day: Date }) {
  const key = isoDate(day);
  const items = tasks.filter(task => task.dueDate === key);
  const isToday = diffDays(day, TODAY) === 0;
  const { setNodeRef, isOver } = useDroppable({ id: key });
  const openComposer = useTaskUi(state => state.openComposer);
  const classes = ['cday', day.getMonth() !== month.getMonth() && 'out', isToday && 'today', isOver && 'over'].filter(Boolean).join(' ');

  return (
    <div ref={setNodeRef} className={classes}>
      <span className="dn" aria-current={isToday ? 'date' : undefined}>
        {day.getDate()}
      </span>
      <button className="ibtn ibtn-xs add" type="button" aria-label={`Add task on ${key}`} onClick={() => openComposer({ dueDate: key })}>
        <Icon name="plus" size={13} />
      </button>
      {items.slice(0, VISIBLE_CHIPS).map(task => (
        <MonthChip key={task.id} task={task} assignee={task.assigneeId ? members.get(task.assigneeId) : undefined} />
      ))}
      {items.length > VISIBLE_CHIPS && <DayOverflow tasks={items} members={members} />}
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
