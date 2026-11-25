import { useState } from 'react';
import type { Task } from '@gr8r/domain';
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from '@gr8r/domain';
import { Icon } from '../../../shared/ui/Icon';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { PriorityIcon, StatusIcon } from '../../../shared/ui/vocab';
import { diffDays, parseDate, relativeDate, TODAY } from '../../../shared/dates';
import type { HomeData } from './HomePage';

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
  return due ? diffDays(due, TODAY) : null;
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
  return (
    <div className={`mini ${task.status === 'done' ? 'done' : ''}`.trim()} role="button" tabIndex={0}>
      <input type="checkbox" className="check round" defaultChecked={task.status === 'done'} aria-label={task.title} />
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
        <button className="ibtn ibtn-sm" type="button" data-tip="Open My Tasks" aria-label="Open My Tasks">
          <Icon name="arrow-up-right" size={15} />
        </button>
      </div>
    </div>
  );
}

export function MyTasksPanel({ data }: { data: HomeData }) {
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
        <button className="addrow" type="button" style={{ paddingLeft: 14, borderTop: '1px solid var(--divider)', borderBottom: 0 }}>
          View all {lists[tab].length} tasks <Icon name="arrow-right" size={13} />
        </button>
      )}
    </section>
  );
}
