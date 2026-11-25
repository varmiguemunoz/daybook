import { useState } from 'react';
import { useBootstrap } from '../modules/workspace/services/queries';
import { useTaskUi } from '../modules/tasks/states/task-ui-store';
import { useTasks } from '../modules/tasks/services/queries';
import { Skeleton } from '../modules/core/components/Skeleton';
import { Modal } from '../modules/core/components/Modal';
import { HomeHeader } from '../modules/home/components/HomeHeader';
import { HomeStats } from '../modules/home/components/HomeStats';
import { MyTasksPanel } from '../modules/home/components/MyTasksPanel';
import { RecentActivityPanel } from '../modules/home/components/RecentActivityPanel';
import { InviteForm } from '../modules/members/components/InviteForm';
import type { HomeData } from '../modules/home/lib/home-data';

export function HomePage() {
  const { data, isLoading } = useBootstrap();
  const openComposer = useTaskUi(state => state.openComposer);
  const { data: tasks } = useTasks();
  const [inviteOpen, setInviteOpen] = useState(false);
  if (isLoading || !data || !tasks) return <Skeleton lines={10} />;

  const home: HomeData = {
    me: data.me,
    tasks,
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
