import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task } from '@daybook/domain';
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from '@daybook/domain';
import { Icon } from '../../core/components/Icon';
import { EmptyState } from '../../core/components/EmptyState';
import { PriorityIcon, StatusIcon } from '../../core/components/vocab';
import { diffDays, parseDate, relativeDate, today } from '../../core/utils/dates';
import type { HomeData } from '../lib/home-data';
import { useUpdateTask } from '../../tasks/services/queries';
import { useTaskUi } from '../../tasks/states/task-ui-store';

type Tab = 'upcoming' | 'overdue' | 'completed';

const TABS: Array<[Tab, string]> = [
  ['upcoming', 'Upcoming'],
  ['overdue', 'Overdue'],
  ['completed', 'Completed'],
];

function byDue(a: Task, b: Task): number {
  const left = parseDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const right = parseDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return left - right;
}

function delta(task: Task): number | null {
  const due = parseDate(task.dueDate);
  return due ? diffDays(due, today()) : null;
}

function bucket(mine: Task[], tab: Tab): Task[] {
  const open = mine.filter(task => task.status !== 'done');
  const lists = {
    upcoming: open.filter(task => {
      const value = delta(task);
      return value === null || value >= 0;
    }),
    overdue: open.filter(task => (delta(task) ?? 0) < 0),
    completed: mine.filter(task => task.status === 'done'),
  };
  return lists[tab].sort(byDue);
}

function MiniRow({ task }: { task: Task }) {
  const update = useUpdateTask();
  const openTask = useTaskUi(state => state.openTask);
  const done = task.status === 'done';

  return (
    <div
      className={`mini ${done ? 'done' : ''}`.trim()}
      role="button"
      tabIndex={0}
      onClick={() => openTask(task.id)}
      onKeyDown={event => event.key === 'Enter' && event.target === event.currentTarget && openTask(task.id)}
    >
      <input
        type="checkbox"
        className="check round"
        checked={done}
        onClick={event => event.stopPropagation()}
        onChange={() => update.mutate({ id: task.id, patch: { status: done ? 'todo' : 'done' } })}
        aria-label={`${done ? 'Reopen' : 'Complete'} ${task.title}`}
      />
      <span data-tip={TASK_STATUS_LABELS[task.status]}>
        <StatusIcon status={task.status} />
      </span>
      <span className="tt">{task.title}</span>
      <span data-tip={`${PRIORITY_LABELS[task.priority]} priority`}>
        <PriorityIcon priority={task.priority} />
      </span>
      <span className="hide-m" style={{ width: 74, textAlign: 'right' }}>
        {task.dueDate ? relativeDate(task.dueDate) : ''}
      </span>
    </div>
  );
}

function PanelHead({ tab, counts, onTab }: { tab: Tab; counts: Record<Tab, number>; onTab: (tab: Tab) => void }) {
  const navigate = useNavigate();
  return (
    <div className="panel-h">
      <h2 id="h-mytasks">My tasks</h2>
      <div className="acts">
        <div className="seg" role="tablist">
          {TABS.map(([key, label]) => (
            <button key={key} type="button" role="tab" className={tab === key ? 'on' : ''} onClick={() => onTab(key)}>
              {label} <span className="faint">{counts[key]}</span>
            </button>
          ))}
        </div>
        <button className="ibtn ibtn-sm" type="button" data-tip="Open Tasks" aria-label="Open Tasks" onClick={() => navigate('/tasks')}>
          <Icon name="arrow-up-right" size={15} />
        </button>
      </div>
    </div>
  );
}

export function MyTasksPanel({ data }: { data: HomeData }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('upcoming');
  const mine = data.tasks.filter(task => task.assigneeId === data.me.id);
  const lists = {
    upcoming: bucket(mine, 'upcoming'),
    overdue: bucket(mine, 'overdue'),
    completed: bucket(mine, 'completed'),
  };
  const current = lists[tab].slice(0, 7);

  return (
    <section className="panel" aria-labelledby="h-mytasks">
      <PanelHead tab={tab} counts={{ upcoming: lists.upcoming.length, overdue: lists.overdue.length, completed: lists.completed.length }} onTab={setTab} />
      {current.length ? (
        current.map(task => <MiniRow key={task.id} task={task} />)
      ) : (
        <EmptyState
          icon={tab === 'overdue' ? 'circle-check' : 'list-checks'}
          title={tab === 'overdue' ? 'Nothing overdue' : 'No tasks here'}
          text={tab === 'overdue' ? 'Every task assigned to you is on schedule.' : 'Add a task to get things moving.'}
          className="sm"
        />
      )}
      {lists[tab].length > 7 && (
        <button
          className="addrow"
          type="button"
          onClick={() => navigate('/tasks')}
          style={{ paddingLeft: 14, borderTop: '1px solid var(--divider)', borderBottom: 0 }}
        >
          View all {lists[tab].length} tasks <Icon name="arrow-right" size={13} />
        </button>
      )}
    </section>
  );
}
