import type { LabelId, Priority, Task, TaskStatus } from '@gr8r/domain';
import { LABEL_LABELS, PRIORITY_LABELS, PRIORITY_WEIGHT, TASK_STATUS_LABELS } from '@gr8r/domain';
import { diffDays, parseDate, relativeDate, TODAY } from '../dates';
import { Icon } from './Icon';

export const PRIORITY_NAMES: Record<Priority, string> = PRIORITY_LABELS;
export const STATUS_NAMES: Record<TaskStatus, string> = TASK_STATUS_LABELS;

const PRIORITY_FILL: Record<Priority, string> = {
  urgent: 'var(--red)',
  high: 'var(--text-2)',
  medium: 'var(--text-2)',
  low: 'var(--text-2)',
  none: 'var(--border-strong)',
};

export function StatusIcon({ status, size = 14 }: { status: TaskStatus; size?: number }) {
  const color = `var(--st-${status})`;

  if (status === 'done') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" style={{ flexShrink: 0 }}>
        <circle cx="7" cy="7" r="6.2" fill={color} />
        <path d="M4.4 7.2 6.2 9 9.7 5.3" fill="none" stroke="var(--surface)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="5.4" fill="none" stroke={color} strokeWidth={1.5} strokeDasharray={status === 'backlog' ? '1.9 2.1' : undefined} />
      {status === 'progress' && <path d="M7 3.4A3.6 3.6 0 0 1 7 10.6Z" fill={color} />}
      {status === 'review' && <path d="M7 3.4A3.6 3.6 0 1 1 3.4 7L7 7Z" fill={color} />}
    </svg>
  );
}

export function PriorityIcon({ priority, size = 14 }: { priority: Priority; size?: number }) {
  if (priority === 'urgent') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" style={{ flexShrink: 0 }}>
        <rect x="1" y="1" width="12" height="12" rx="3" fill="var(--red)" />
        <path d="M7 3.8v4" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" />
        <circle cx="7" cy="10.1" r=".95" fill="#fff" />
      </svg>
    );
  }

  const weight = PRIORITY_WEIGHT[priority];
  const bar = (x: number, height: number, on: boolean) => (
    <rect key={x} x={x} y={12 - height} width="2.6" height={height} rx="1" fill={on ? PRIORITY_FILL[priority] : 'var(--border-strong)'} />
  );

  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" style={{ flexShrink: 0 }}>
      {bar(1.8, 4.5, weight >= 1)}
      {bar(5.7, 7.5, weight >= 2)}
      {bar(9.6, 10.5, weight >= 3)}
    </svg>
  );
}

export function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <>
      <StatusIcon status={status} />
      <span>{STATUS_NAMES[status]}</span>
    </>
  );
}

export function PriorityPill({ priority }: { priority: Priority }) {
  return (
    <>
      <PriorityIcon priority={priority} />
      <span>{PRIORITY_LABELS[priority]}</span>
    </>
  );
}

const LABEL_COLORS: Record<LabelId, string> = {
  design: 'var(--violet)',
  frontend: 'var(--blue)',
  backend: 'var(--teal)',
  research: 'var(--amber)',
  content: 'var(--rose)',
  bug: 'var(--red)',
  qa: 'var(--green)',
  growth: 'var(--orange)',
};

export function LabelChip({ label }: { label: LabelId }) {
  return (
    <span className="lbl" style={{ ['--c' as string]: LABEL_COLORS[label] }}>
      <i />
      {LABEL_LABELS[label]}
    </span>
  );
}
export function ProgressBar({ value, tone = '' }: { value: number; tone?: string }) {
  return (
    <span className={`prog ${tone}`.trim()} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ ['--p' as string]: value / 100 }} />
    </span>
  );
}

export function DueBadge({ task, withIcon = true }: { task: Task; withIcon?: boolean }) {
  if (!task.dueDate) return null;
  const due = parseDate(task.dueDate);
  const delta = due ? diffDays(due, TODAY) : 0;
  const tone = task.status === 'done' ? '' : delta < 0 ? 'over' : delta <= 1 ? 'soon' : '';

  return (
    <span className={`due ${tone}`.trim()}>
      {withIcon && <Icon name="calendar" size={12} />}
      {relativeDate(task.dueDate)}
    </span>
  );
}
