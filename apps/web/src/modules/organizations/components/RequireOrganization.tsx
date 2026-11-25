import { useEffect } from 'react';
import { useAuth, useClerk, useUser } from '@clerk/react';
import { Outlet } from 'react-router-dom';
import { Providers } from '../../../app/providers';
import { Modal } from '../../core/components/Modal';
import { CreateOrganizationForm } from './CreateOrganizationForm';

function CreateOrganizationModal() {
  return (
    <div className="auth">
      <Modal open title="Create your organization" centered>
        <p className="muted">Your tasks and notes live inside an organization. Create one to start.</p>
        <CreateOrganizationForm />
      </Modal>
    </div>
  );
}

export function RequireOrganization() {
  const { orgId } = useAuth({ treatPendingAsSignedOut: false });
  const { isLoaded, user } = useUser();
  const { setActive } = useClerk();
  const firstOrganizationId = user?.organizationMemberships[0]?.organization.id;

  useEffect(() => {
    if (!orgId && firstOrganizationId) void setActive({ organization: firstOrganizationId });
  }, [orgId, firstOrganizationId, setActive]);

  if (orgId) {
    return (
      <Providers key={orgId}>
        <Outlet />
      </Providers>
    );
  }
  if (!isLoaded || firstOrganizationId) return <div className="auth" aria-busy="true" />;
  return <CreateOrganizationModal />;
}
