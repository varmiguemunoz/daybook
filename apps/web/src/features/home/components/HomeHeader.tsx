import { Icon } from '../../../shared/ui/Icon';
import { MONL, TODAY, WDL } from '../../../shared/dates';

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomeHeader({ name, onInvite, onNewTask }: { name: string; onInvite: () => void; onNewTask: () => void }) {
  return (
    <div className="ph">
      <div>
        <h1>
          {greeting(new Date().getHours())}, {name.split(' ')[0]}
        </h1>
        <p>
          <span className="num">
            {WDL[TODAY.getDay()]}, {MONL[TODAY.getMonth()]} {TODAY.getDate()}
          </span>{' '}
          · Here&apos;s what&apos;s happening across your workspace.
        </p>
      </div>
      <div className="acts">
        <button className="btn btn-secondary hide-m" type="button" onClick={onInvite}>
          <Icon name="user-plus" size={14} />
          Invite member
        </button>
        <button className="btn btn-primary" type="button" onClick={onNewTask}>
          <Icon name="plus" size={14} />
          New task
        </button>
      </div>
    </div>
  );
}
