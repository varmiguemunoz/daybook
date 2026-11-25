import { useState } from 'react';
import { useClerk } from '@clerk/react';
import { ApiError } from '../../core/services/api-client';

type Clerk = ReturnType<typeof useClerk>;

let recovering: Promise<unknown> | null = null;

async function leaveOrganization(clerk: Clerk): Promise<void> {
  const current = clerk.organization?.id;
  await clerk.user?.reload();
  const next = clerk.user?.organizationMemberships.find(membership => membership.organization.id !== current);
  await clerk.setActive({ organization: next?.organization.id ?? null });
}

function recover(clerk: Clerk, error: unknown): void {
  if (recovering || !(error instanceof ApiError)) return;
  if (error.status === 401) recovering = clerk.signOut();
  else if (error.code === 'organization_required') recovering = leaveOrganization(clerk);
  void recovering?.finally(() => {
    recovering = null;
  });
}

export function useSessionRecovery(): (error: unknown) => void {
  const clerk = useClerk();
  const [handler] = useState(() => (error: unknown) => recover(clerk, error));
  return handler;
}
