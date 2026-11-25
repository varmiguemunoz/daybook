import { useState } from 'react';
import { useOrganization } from '@clerk/react';
import { useLocation } from 'react-router-dom';
import { useMembers } from '../modules/members/services/queries';
import { MembersHeader, type MembersTab } from '../modules/members/components/MembersHeader';
import { MembersSection } from '../modules/members/components/MembersSection';
import { PermissionsTable } from '../modules/members/components/PermissionsTable';
import { TeamsManager } from '../modules/teams/components/TeamsManager';

export function MembersPage() {
  const { data: members = [] } = useMembers();
  const { organization } = useOrganization();
  const { pathname } = useLocation();
  const [tab, setTab] = useState<MembersTab>(pathname === '/teams' ? 'teams' : 'members');

  return (
    <div className="page wide" style={{ maxWidth: 1200 }}>
      <MembersHeader
        tab={tab}
        onTab={setTab}
        workspace={organization?.name ?? 'this workspace'}
        total={members.length}
        pending={organization?.pendingInvitationsCount ?? 0}
      />
      {tab === 'members' && <MembersSection />}
      {tab === 'teams' && <TeamsManager />}
      {tab === 'roles' && <PermissionsTable />}
    </div>
  );
}
