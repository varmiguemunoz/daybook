import { useState } from 'react';
import { useBootstrap } from '../features/workspace/queries';
import { Skeleton } from '../shared/ui/Skeleton';
import { Modal } from '../shared/ui/Modal';
import { HomeHeader } from '../features/home/components/HomeHeader';
import { HomeStats } from '../features/home/components/HomeStats';
import { MyTasksPanel } from '../features/home/components/MyTasksPanel';
import { RecentActivityPanel } from '../features/home/components/RecentActivityPanel';
import { InviteForm } from '../features/members/components/InviteForm';
import { TaskForm } from '../features/tasks/components/TaskForm';
import type { HomeData } from '../features/home/home-data';

function HomeModals({
  inviteOpen,
  taskOpen,
  projectId,
  onCloseInvite,
  onCloseTask,
}: {
  inviteOpen: boolean;
  taskOpen: boolean;
  projectId?: string | null;
  onCloseInvite: () => void;
  onCloseTask: () => void;
}) {
  return (
    <>
      <Modal open={inviteOpen} onClose={onCloseInvite} title="Invite member">
        <InviteForm />
      </Modal>
      {projectId && (
        <Modal open={taskOpen} onClose={onCloseTask} title="New task">
          <TaskForm projectId={projectId} />
        </Modal>
      )}
    </>
  );
}

export function HomePage() {
  const { data, isLoading } = useBootstrap();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  if (isLoading || !data) return <Skeleton lines={10} />;

  const projectId = null;
  const home: HomeData = {
    me: data.me,
    tasks: data.tasks,
    members: data.members,
    activity: data.activity,
  };

  return (
    <div className="page">
      <HomeHeader name={data.me.name} onInvite={() => setInviteOpen(true)} onNewTask={() => setTaskOpen(true)} />
      <HomeStats data={home} />
      <div className="grid2">
        <div className="stack">
          <MyTasksPanel data={home} />
        </div>
        <div className="stack">
          <RecentActivityPanel data={home} />
        </div>
      </div>
      <HomeModals
        inviteOpen={inviteOpen}
        taskOpen={taskOpen}
        projectId={projectId}
        onCloseInvite={() => setInviteOpen(false)}
        onCloseTask={() => setTaskOpen(false)}
      />
    </div>
  );
}
