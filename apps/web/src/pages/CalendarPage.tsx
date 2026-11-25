import { useState } from 'react';
import { Skeleton } from '../modules/core/components/Skeleton';
import { PageHeader } from '../modules/core/components/PageHeader';
import { SearchField } from '../modules/core/components/SearchField';
import { MONL, today, addDays, formatDate, isoDate, startOfWeek } from '../modules/core/utils/dates';
import { CalendarToolbar, type CalendarMode } from '../modules/views/components/CalendarToolbar';
import { CalendarGrid } from '../modules/views/components/CalendarGrid';
import { useTaskView } from '../modules/tasks/hooks/use-task-view';
import { NewTaskButton } from '../modules/tasks/components/NewTaskButton';
import { TaskFilters } from '../modules/tasks/components/TaskFilters';

const WEEK_LENGTH = 7;

function monthLabel(date: Date): string {
  return `${MONL[date.getMonth()]} ${date.getFullYear()}`;
}

function rangeLabel(start: Date): string {
  const end = addDays(start, WEEK_LENGTH - 1);
  return `${formatDate(isoDate(start))} – ${formatDate(isoDate(end))}, ${end.getFullYear()}`;
}

export function CalendarPage() {
  const view = useTaskView('calendar');
  const [mode, setMode] = useState<CalendarMode>('month');
  const [cursor, setCursor] = useState(today);

  const shift = (delta: number) =>
    setCursor(current => (mode === 'month' ? new Date(current.getFullYear(), current.getMonth() + delta, 1) : addDays(current, delta * WEEK_LENGTH)));

  return (
    <div className="page flush">
      <PageHeader title="Calendar" subtitle="Deadlines across your workspace. Drag a task to another day to reschedule it." action={<NewTaskButton />} />
      <CalendarToolbar
        mode={mode}
        label={mode === 'month' ? monthLabel(cursor) : rangeLabel(startOfWeek(cursor))}
        onMode={setMode}
        onShift={shift}
        onToday={() => setCursor(today())}
        tools={
          <>
            <SearchField value={view.query} onChange={view.setQuery} />
            <TaskFilters filter={view.filter} members={view.members} onChange={view.setFilter} />
          </>
        }
      />
      {view.isLoading && <Skeleton lines={8} />}
      {view.error && <p className="error">{view.error.message}</p>}
      {!view.isLoading && !view.error && <CalendarGrid mode={mode} cursor={cursor} tasks={view.tasks} memberById={view.memberById} />}
    </div>
  );
}
