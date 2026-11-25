import { Hono } from 'hono';
import type { OrganizationMembershipJSON, UserJSON, WebhookEvent } from '@clerk/backend';
import { verifyWebhook } from '@clerk/backend/webhooks';
import type { Repositories } from '../../ports/repositories';
import type { ConfirmMembership } from '../../http/auth';
import { emit } from '../../shared/events/bus';
import { roleOf, syncMember, syncWorkspace } from '../identity/identity-service';
import { purgeMember } from '../members/member-service';

function fullName(first: string | null, last: string | null, fallback: string): string {
  return [first, last].filter(Boolean).join(' ') || fallback;
}

// Svix does not guarantee order, so a late created/updated event must not revive a removed membership.
async function syncMembership(repositories: Repositories, confirmMembership: ConfirmMembership, data: OrganizationMembershipJSON): Promise<void> {
  if (!(await confirmMembership(data.organization.id, data.public_user_data.user_id))) return;
  const workspace = await syncWorkspace(repositories, data.organization.id, data.organization.name);
  const user = data.public_user_data;
  const name = fullName(user.first_name, user.last_name, user.identifier);
  await syncMember(repositories, workspace.id, { clerkUserId: user.user_id, name, email: user.identifier, role: roleOf(data.role) });
}

async function removeMembership(repositories: Repositories, data: OrganizationMembershipJSON): Promise<void> {
  const workspace = await repositories.workspaces.findByClerkOrgId(data.organization.id);
  if (!workspace) return;
  const member = await repositories.members.findByClerkUserId(workspace.id, data.public_user_data.user_id);
  if (member) await purgeMember(repositories, workspace.id, member.id);
}

async function purgeWorkspace(repositories: Repositories, clerkOrgId: string | undefined): Promise<void> {
  const workspace = clerkOrgId ? await repositories.workspaces.findByClerkOrgId(clerkOrgId) : null;
  if (!workspace) return;
  await repositories.workspaces.purge(workspace.id);
  emit(workspace.id, { type: 'workspace.deleted' });
}

async function syncUser(repositories: Repositories, data: UserJSON): Promise<void> {
  const email = data.email_addresses.find(address => address.id === data.primary_email_address_id)?.email_address;
  if (!email) return;
  await repositories.members.updateByClerkUserId(data.id, { name: fullName(data.first_name, data.last_name, email), email });
}

async function handle(repositories: Repositories, confirmMembership: ConfirmMembership, event: WebhookEvent): Promise<void> {
  switch (event.type) {
    case 'organization.created':
    case 'organization.updated':
      await syncWorkspace(repositories, event.data.id, event.data.name);
      return;
    case 'organization.deleted':
      return purgeWorkspace(repositories, event.data.id);
    case 'organizationMembership.created':
    case 'organizationMembership.updated':
      return syncMembership(repositories, confirmMembership, event.data);
    case 'organizationMembership.deleted':
      return removeMembership(repositories, event.data);
    case 'user.updated':
      return syncUser(repositories, event.data);
    case 'user.deleted':
      if (event.data.id) await repositories.members.updateByClerkUserId(event.data.id, { status: 'disabled' });
  }
}

export function clerkWebhookRoutes(repositories: Repositories, signingSecret: string, confirmMembership: ConfirmMembership): Hono {
  const routes = new Hono();

  routes.post('/', async context => {
    const event = await verifyWebhook(context.req.raw, { signingSecret }).catch(() => null);
    if (!event) return context.json({ error: { message: 'Invalid signature' } }, 400);
    await handle(repositories, confirmMembership, event);
    return context.json({ received: true });
  });

  return routes;
}
