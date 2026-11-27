import type { ReactNode } from 'react';
import { Skeleton } from '../../core/components/Skeleton';
import { useBootstrap } from '../../workspace/services/queries';
import { MembersSection } from '../../members/components/MembersSection';
import { PermissionsTable } from '../../members/components/PermissionsTable';
import { TeamsManager } from '../../teams/components/TeamsManager';
import { AppearanceSection } from './AppearanceSection';
import { WorkspaceSection } from './WorkspaceSection';
import { ProfileSection } from './ProfileSection';
import { ShortcutsSection } from './ShortcutsSection';
import { AssistantsSection } from './AssistantsSection';

function Section({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <>
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
      {children}
    </>
  );
}

function ProfileLoader() {
  const { data } = useBootstrap();
  return data ? <ProfileSection key={data.me.id} me={data.me} /> : <Skeleton lines={6} />;
}

export function SettingsBody({ section }: { section: string }) {
  const sections: Record<string, ReactNode> = {
    appearance: <AppearanceSection />,
    members: (
      <Section title="Members" lead="People with access to this workspace.">
        <MembersSection />
      </Section>
    ),
    teams: (
      <Section title="Teams" lead="Groups of people who work together. A person can be in several teams.">
        <TeamsManager />
      </Section>
    ),
    permissions: (
      <Section title="Permissions" lead="What each role can do in this workspace.">
        <PermissionsTable />
      </Section>
    ),
    profile: <ProfileLoader />,
    shortcuts: <ShortcutsSection />,
    assistants: <AssistantsSection />,
  };

  return sections[section] ?? <WorkspaceSection />;
}
