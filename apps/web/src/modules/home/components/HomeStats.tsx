import { Icon } from '../../core/components/Icon';
import { isOverdue } from '../../core/utils/dates';
import type { HomeData } from '../lib/home-data';

const WEEK = 7 * 86_400_000;

interface StatProps {
  icon: string;
  label: string;
  value: number;
  detail: string;
  tone?: 'bad' | 'up';
  strong?: boolean;
}

function Stat({ icon, label, value, detail, tone, strong }: StatProps) {
  return (
    <button className="stat" type="button">
      <span className="k">
        <Icon name={icon} size={14} />
        {label}
      </span>
      <span className="v" style={strong ? { color: 'var(--red)' } : undefined}>
        {value}
      </span>
      <span className={`d ${tone ?? ''}`.trim()}>{detail}</span>
    </button>
  );
}

export function HomeStats({ data }: { data: HomeData }) {
  const open = data.tasks.filter(task => task.status !== 'done');
  const overdue = data.tasks.filter(task => isOverdue(task.dueDate, task.status)).length;
  const completed = data.tasks.filter(task => task.status === 'done' && task.completedAt && Date.now() - task.completedAt < WEEK).length;

  return (
    <div className="stats" style={{ marginBottom: 16 }}>
      <Stat
        icon="circle-dashed"
        label="Open tasks"
        value={open.length}
        detail={`${open.filter(task => task.assigneeId === data.me.id).length} assigned to you`}
      />
      <Stat icon="circle-check" label="Completed" value={completed} detail="this week" tone="up" />
      <Stat
        icon="clock-alert"
        label="Overdue"
        value={overdue}
        detail={overdue ? 'need attention' : 'all on track'}
        tone={overdue ? 'bad' : undefined}
        strong={overdue > 0}
      />
    </div>
  );
}
