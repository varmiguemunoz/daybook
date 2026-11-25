import { randomUUID } from 'node:crypto';
import { invitationSchema, memberSchema, type CreateInvitationInput, type Invitation, type Member, type Workspace } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { forbidden, notFound } from '../../http/errors';
import { requirePermission } from '../../http/actor';
import { notify } from '../notifications/notification-service';

const INVITE_TTL = 7 * 24 * 60 * 60 * 1000;

export function listInvitations(repositories: Repositories, workspaceId: string): Promise<Invitation[]> {
  return repositories.invitations.listByWorkspace(workspaceId);
}

export async function createInvitation(repositories: Repositories, workspace: Workspace, member: Member, input: CreateInvitationInput): Promise<Invitation> {
  requirePermission(member, 'member:invite');

  const invitation = invitationSchema.parse({
    id: `i_${randomUUID()}`,
    workspaceId: workspace.id,
    email: input.email,
    role: input.role,
    token: randomUUID().replace(/-/g, ''),
    invitedBy: member.id,
    expiresAt: Date.now() + INVITE_TTL,
    acceptedAt: null,
    createdAt: Date.now(),
  });

  const created = await repositories.invitations.create(invitation);

  const inviter = member;
  await notify(repositories, {
    workspaceId: workspace.id,
    userId: member.id,
    type: 'update',
    actorId: member.id,
    text: `Invitation sent to ${input.email}`,
    channel: 'inapp',
  });

  // Send invitation email (best-effort)
  const { sendEmail } = await import('../../shared/notifications/email');
  const acceptUrl = `${process.env.APP_URL ?? 'http://localhost:5175'}/invitations/${created.token}/accept`;
  await sendEmail(
    input.email,
    `You're invited to ${workspace.name}`,
    `<p>${inviter.name} invited you to join <b>${workspace.name}</b> as ${input.role}.</p><p><a href="${acceptUrl}">Accept invitation</a></p>`,
  );

  return created;
}

export async function acceptInvitation(repositories: Repositories, token: string): Promise<{ invitation: Invitation; member: Member }> {
  const invitation = await repositories.invitations.findByToken(token);
  if (!invitation) throw notFound('Invitation');
  if (invitation.acceptedAt) throw forbidden('already accepted');
  if (invitation.expiresAt < Date.now()) throw forbidden('expired');

  await repositories.invitations.markAccepted(invitation.id, Date.now());

  // Provision member
  const existing = (await repositories.members.listByWorkspace(invitation.workspaceId)).find(m => m.email === invitation.email);
  let member: Member;
  if (existing) {
    member = existing;
  } else {
    member = memberSchema.parse({
      id: `m_${randomUUID()}`,
      workspaceId: invitation.workspaceId,
      name: invitation.email.split('@')[0],
      email: invitation.email,
      role: invitation.role,
      title: '',
      teamId: null,
      color: '#6B7280',
      status: 'active',
      timezone: 'UTC',
      lastSeenAt: null,
      clerkUserId: null,
    });
    await repositories.members.create(member);
  }

  return { invitation: { ...invitation, acceptedAt: Date.now() }, member };
}
