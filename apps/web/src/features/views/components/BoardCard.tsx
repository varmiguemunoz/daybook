import type { Member, Task } from '@gr8r/domain';
import { Icon } from '../../../shared/ui/Icon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar } from '../../../shared/ui/Avatar';
import { DueBadge, LabelChip, PriorityIcon, ProgressBar, StatusIcon } from '../../../shared/ui/vocab';
import { subtaskProgress } from '../view-model';
import { useTaskUi } from '../../tasks/task-ui-store';
import { useUpdateTask } from '../../tasks/queries';
import { AssigneeMenu, DueMenu, PriorityMenu } from '../../tasks/components/TaskMenus';

interface CardProps {
  task: Task;
  members: Member[];
  memberById: Map<string, Member>;
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

function CardMeta({ task, members, memberById }: CardProps) {
  const assignee = task.assigneeId ? memberById.get(task.assigneeId) : undefined;

  return (
    <div className="meta">
      <span className="key">{task.key}</span>
      <PriorityMenu task={task} className="m">
        <PriorityIcon priority={task.priority} size={13} />
      </PriorityMenu>
      {task.dueDate && (
        <DueMenu task={task} className="m">
          <DueBadge task={task} />
        </DueMenu>
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
      <span style={{ marginLeft: 'auto' }}>
        <AssigneeMenu task={task} members={members} className="m">
          <Avatar member={assignee} className="sm" tip={false} />
        </AssigneeMenu>
      </span>
    </div>
  );
}

function CardActions({ task }: { task: Task }) {
  const update = useUpdateTask();
  const openTask = useTaskUi(state => state.openTask);
  const done = task.status === 'done';

  return (
    <div className="hacts" onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
      <button
        className="ibtn ibtn-xs"
        type="button"
        data-tip={done ? 'Reopen' : 'Mark complete'}
        aria-label={done ? 'Reopen' : 'Mark complete'}
        onClick={() => update.mutate({ id: task.id, patch: { status: done ? 'todo' : 'done' } })}
      >
        <Icon name={done ? 'rotate-ccw' : 'check'} size={13} />
      </button>
      <button className="ibtn ibtn-xs" type="button" data-tip="Edit" aria-label={`Edit ${task.key}`} onClick={() => openTask(task.id)}>
        <Icon name="pencil" size={12} />
      </button>
    </div>
  );
}

export function BoardCardView({ task, members, memberById }: CardProps) {
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
      <CardMeta task={task} members={members} memberById={memberById} />
      <CardActions task={task} />
    </div>
  );
}

export function BoardCard({ task, members, memberById }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const openTask = useTaskUi(state => state.openTask);
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, cursor: 'grab' };
  return (
    <div ref={setNodeRef} style={style} onClick={() => openTask(task.id)} {...attributes} {...listeners}>
      <BoardCardView task={task} members={members} memberById={memberById} />
    </div>
  );
}
