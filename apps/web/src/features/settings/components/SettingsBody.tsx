import type { ReactNode } from 'react';
import { useMembers } from '../../members/queries';
import { useTasks } from '../../tasks/queries';
import { useBootstrap } from '../../workspace/queries';
import { MembersTable } from '../../members/components/MembersTable';
import { TeamsGrid } from '../../members/components/TeamsGrid';
import { PermissionsTable } from '../../members/components/PermissionsTable';
import { AppearanceSection } from './AppearanceSection';
import { WorkspaceSection } from './WorkspaceSection';
import { ProfileSection } from './ProfileSection';
import { ShortcutsSection } from './ShortcutsSection';

function SectionHead({ title, lead }: { title: string; lead: string }) {
  return (
    <>
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
    </>
  );
}

export function SettingsBody({ section }: { section: string }) {
  const { data: members = [] } = useMembers();
  const { data: tasks = [] } = useTasks();
  const { data: bootstrap } = useBootstrap();
  const me = bootstrap?.me;
  const meId = me?.id ?? '';

  const sections: Record<string, ReactNode> = {
    appearance: <AppearanceSection />,
    members: (
      <>
        <SectionHead title="Members" lead="People with access to this workspace." />
        <MembersTable members={members} tasks={tasks} meId={meId} />
      </>
    ),
    teams: (
      <>
        <SectionHead title="Teams" lead="Groups of people who work together." />
        <TeamsGrid teams={[]} members={members} onOpen={() => {}} />
      </>
    ),
    permissions: (
      <>
        <SectionHead title="Permissions" lead="What each role can do in this workspace." />
        <PermissionsTable />
      </>
    ),
    profile: <ProfileSection me={me} />,
    shortcuts: <ShortcutsSection />,
  };

  return sections[section] ?? <WorkspaceSection workspace={bootstrap?.workspace} />;
}
