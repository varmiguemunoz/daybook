import type { Member, Task } from '@gr8r/domain';
import { PRIORITY_LABELS } from '@gr8r/domain';
import { Icon } from '../../../shared/ui/Icon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar } from '../../../shared/ui/Avatar';
import { DueBadge, LabelChip, PriorityIcon, ProgressBar, StatusIcon } from '../../../shared/ui/vocab';
import { subtaskProgress } from '../view-model';

interface CardProps {
  task: Task;
  members: Map<string, Member>;
  onOpen: (task: Task) => void;
}

function CardLabels({ task }: { task: Task }) {
  if (!task.labels.length) return null;
  return (
    <div className="labels">
      {task.labels.map(label => (
        <LabelChip key={label} label={label} />
      ))}
    </div>
  );
}

function CardSubtaskBar({ task }: { task: Task }) {
  if (!task.subtasks.length) return null;
  const done = task.subtasks.filter(subtask => subtask.done).length;
  const percent = subtaskProgress(task);

  return (
    <div className="subp">
      <Icon name="list-checks" size={12} />
      <span className="num">
        {done}/{task.subtasks.length}
      </span>
      <ProgressBar value={percent} tone={done === task.subtasks.length ? 'green' : ''} />
    </div>
  );
}

function CardMeta({ task, members }: Omit<CardProps, 'onOpen'>) {
  const assignee = task.assigneeId ? members.get(task.assigneeId) : undefined;

  return (
    <div className="meta">
      <span className="key">{task.key}</span>
      <button className="m" type="button" data-tip={PRIORITY_LABELS[task.priority]} aria-label={`Priority: ${PRIORITY_LABELS[task.priority]}`}>
        <PriorityIcon priority={task.priority} size={13} />
      </button>
      {task.dueDate && (
        <button className="m" type="button" aria-label="Due date">
          <DueBadge task={task} />
        </button>
      )}
      {task.recurrence && (
        <span className="m" data-tip={`Repeats ${task.recurrence}`}>
          <Icon name="repeat" size={12} />
        </span>
      )}
      {task.attachments.length > 0 && (
        <span className="m" aria-label={`${task.attachments.length} attachments`}>
          <Icon name="paperclip" size={12} />
          {task.attachments.length}
        </span>
      )}
      <button className="m" type="button" style={{ marginLeft: 'auto' }} aria-label="Assignee">
        <Avatar member={assignee} className="sm" />
      </button>
    </div>
  );
}

export function BoardCardView({ task, members }: Omit<CardProps, 'onOpen'>) {
  return (
    <div className={`kcard ${task.status === 'done' ? 'done' : ''}`.trim()} aria-label={task.title}>
      <CardLabels task={task} />
      <div className="top">
        {task.status === 'done' && (
          <span className="done-ic" style={{ margin: '2px 7px 0 0', display: 'inline-flex' }} aria-label="Done">
            <StatusIcon status="done" size={14} />
          </span>
        )}
        <div className="title">{task.title}</div>
      </div>
      <CardSubtaskBar task={task} />
      <CardMeta task={task} members={members} />
      <div className="hacts">
        <button
          className="ibtn ibtn-xs"
          type="button"
          data-tip={task.status === 'done' ? 'Reopen' : 'Mark complete'}
          aria-label={task.status === 'done' ? 'Reopen' : 'Mark complete'}
        >
          <Icon name={task.status === 'done' ? 'rotate-ccw' : 'check'} size={13} />
        </button>
        <button className="ibtn ibtn-xs" type="button" data-tip="Quick edit" aria-label="Quick edit">
          <Icon name="pencil" size={12} />
        </button>
        <button className="ibtn ibtn-xs" type="button" aria-label="More">
          <Icon name="ellipsis" size={13} />
        </button>
      </div>
    </div>
  );
}

export function BoardCard({ task, members, onOpen }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, cursor: 'grab' };
  return (
    <div ref={setNodeRef} style={style} onClick={() => onOpen(task)} {...attributes} {...listeners}>
      <BoardCardView task={task} members={members} />
    </div>
  );
}
