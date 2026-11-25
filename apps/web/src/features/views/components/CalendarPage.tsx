import { useState } from 'react';
import { Icon } from '../../../shared/ui/Icon';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { Modal } from '../../../shared/ui/Modal';
import { MONL, TODAY, addDays, formatDate, isoDate, monthRange, startOfWeek } from '../../../shared/dates';
import type { Member, Task } from '@gr8r/domain';
import { useViewData } from '../use-view-data';
import { CalendarToolbar, type CalendarMode } from './CalendarToolbar';
import { CalendarMonth } from './CalendarMonth';
import { CalendarWeek } from './CalendarWeek';
import { TaskForm } from '../../tasks/components/TaskForm';

const WEEK_LENGTH = 7;

function monthLabel(date: Date): string {
  return `${MONL[date.getMonth()]} ${date.getFullYear()}`;
}

function rangeLabel(start: Date): string {
  const end = addDays(start, WEEK_LENGTH - 1);
  return `${formatDate(isoDate(start))} – ${formatDate(isoDate(end))}, ${end.getFullYear()}`;
}

function CalendarBody({ mode, cursor, tasks, memberById }: {
  mode: CalendarMode;
  cursor: Date;
  tasks: Task[];
  memberById: Map<string, Member>;
}) {
  const days =
    mode === 'month' ? monthRange(cursor) : Array.from({ length: WEEK_LENGTH }, (_, index) => addDays(startOfWeek(cursor), index));

  return (
    <div className="cal" style={{ minHeight: 640 }}>
      {mode === 'month' ? (
        <CalendarMonth days={days} month={cursor} tasks={tasks} members={memberById} />
      ) : (
        <CalendarWeek days={days} tasks={tasks} members={memberById} />
      )}
    </div>
  );
}

export function CalendarPage() {
  const { tasks, memberById, isLoading, error } = useViewData();
  const [mode, setMode] = useState<CalendarMode>('month');
  const [cursor, setCursor] = useState(TODAY);
  const [composerOpen, setComposerOpen] = useState(false);
  const projectId = undefined;

  const shift = (delta: number) =>
    setCursor(current => (mode === 'month' ? new Date(current.getFullYear(), current.getMonth() + delta, 1) : addDays(current, delta * WEEK_LENGTH)));

  return (
    <div className="page flush">
      <PageHeader
        title="Calendar"
        subtitle="Deadlines and events across every project."
        action={
          <button className="btn btn-primary" type="button" onClick={() => setComposerOpen(true)}>
            <Icon name="plus" size={14} />
            New task
          </button>
        }
      />
      <CalendarToolbar
        mode={mode}
        label={mode === 'month' ? monthLabel(cursor) : rangeLabel(startOfWeek(cursor))}
        onMode={setMode}
        onShift={shift}
        onToday={() => setCursor(TODAY)}
      />
      {isLoading && <Skeleton lines={8} />}
      {error && <p className="error">{(error as Error).message}</p>}
      {!isLoading && !error && <CalendarBody mode={mode} cursor={cursor} tasks={tasks} memberById={memberById} />}
      {projectId && (
        <Modal open={composerOpen} onClose={() => setComposerOpen(false)} title="New task">
          <TaskForm projectId={projectId} />
        </Modal>
      )}
    </div>
  );
}
