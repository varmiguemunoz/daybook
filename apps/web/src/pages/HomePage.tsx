import { useState } from 'react';
import { useBootstrap } from '../features/workspace/queries';
import { useTaskUi } from '../features/tasks/task-ui-store';
import { useTasks } from '../features/tasks/queries';
import { Skeleton } from '../shared/ui/Skeleton';
import { Modal } from '../shared/ui/Modal';
import { HomeHeader } from '../features/home/components/HomeHeader';
import { HomeStats } from '../features/home/components/HomeStats';
import { MyTasksPanel } from '../features/home/components/MyTasksPanel';
import { RecentActivityPanel } from '../features/home/components/RecentActivityPanel';
import { InviteForm } from '../features/members/components/InviteForm';
import type { HomeData } from '../features/home/home-data';

export function HomePage() {
  const { data, isLoading } = useBootstrap();
  const openComposer = useTaskUi(state => state.openComposer);
  const { data: tasks } = useTasks();
  const [inviteOpen, setInviteOpen] = useState(false);
  if (isLoading || !data) return <Skeleton lines={10} />;

  const home: HomeData = {
    me: data.me,
    tasks: tasks ?? data.tasks,
    members: data.members,
    activity: data.activity,
  };

  return (
    <div className="page">
      <HomeHeader name={data.me.name} onInvite={() => setInviteOpen(true)} onNewTask={() => openComposer()} />
      <HomeStats data={home} />
      <div className="grid2">
        <div className="stack">
          <MyTasksPanel data={home} />
        </div>
        <div className="stack">
          <RecentActivityPanel data={home} />
        </div>
      </div>
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite member">
        <InviteForm />
      </Modal>
    </div>
  );
}
