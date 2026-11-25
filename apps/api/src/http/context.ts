import type { Context } from 'hono';
import type { Member, Workspace } from '@gr8r/domain';
import type { Repositories } from '../ports/repositories';
import { memberSchema } from '@gr8r/domain';
import { randomUUID } from 'node:crypto';
import { unauthorized } from './errors';
import { memberIdOf } from './actor';

function clerkConfigured(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY);
}

async function findClerkMember(repositories: Repositories, workspace: Workspace, userId: string): Promise<Member | null> {
  const members = await repositories.members.listByWorkspace(workspace.id);
  return members.find(candidate => candidate.clerkUserId === userId) ?? null;
}

async function provisionMember(repositories: Repositories, workspace: Workspace, userId: string): Promise<Member> {
  const member = memberSchema.parse({
    id: `m_${randomUUID()}`,
    workspaceId: workspace.id,
    name: 'New member',
    email: `${userId}@clerk.local`,
    role: 'owner',
    clerkUserId: userId,
  });
  return repositories.members.create(member);
}

export async function requestContext(repositories: Repositories, context: Context): Promise<{ workspace: Workspace; member: Member }> {
  const workspace = await repositories.workspaces.findFirst();
  if (!workspace) throw unauthorized();

  if (clerkConfigured()) {
    try {
      const { getAuth } = await import('@clerk/hono');
      const auth = getAuth(context);
      if (auth?.userId) {
        const existing = await findClerkMember(repositories, workspace, auth.userId);
        if (existing) return { workspace, member: existing };
        const provisioned = await provisionMember(repositories, workspace, auth.userId);
        return { workspace, member: provisioned };
      }
    } catch {
      // fall through to header-based resolution
    }
  }

  const memberId = memberIdOf(context);
  const member = await repositories.members.findById(memberId);
  if (!member || member.workspaceId !== workspace.id) throw unauthorized();

  return { workspace, member };
}
