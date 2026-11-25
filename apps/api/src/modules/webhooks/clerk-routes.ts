import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { Webhook } from 'svix';
import type { Repositories } from '../../ports/repositories';

function deriveName(data: Record<string, unknown>): { name: string; email: string | undefined } {
  const email = (data.email_addresses as Array<{ email_address: string }>)?.[0]?.email_address;
  const firstName = (data.first_name as string) ?? '';
  const lastName = (data.last_name as string) ?? '';
  const name = `${firstName} ${lastName}`.trim() || email || 'New member';
  return { name, email };
}

async function upsertClerkUser(repositories: Repositories, data: Record<string, unknown>): Promise<void> {
  const clerkUserId = String(data.id);
  const { name, email } = deriveName(data);

  const workspace = await repositories.workspaces.findFirst();
  if (!workspace) return;

  const members = await repositories.members.listByWorkspace(workspace.id);
  const existing = members.find(member => member.clerkUserId === clerkUserId);
  if (existing) {
    await repositories.members.update(existing.id, { name, email: email ?? existing.email });
    return;
  }

  await createClerkMember(repositories, workspace.id, clerkUserId, name, email, members.length === 0);
}

async function createClerkMember(repositories: Repositories, workspaceId: string, clerkUserId: string, name: string, email: string | undefined, isFirst: boolean): Promise<void> {
  const { memberSchema } = await import('@gr8r/domain');
  const member = memberSchema.parse({
    id: `m_${randomUUID()}`,
    workspaceId,
    name,
    email: email ?? `${clerkUserId}@clerk.local`,
    role: isFirst ? 'owner' : 'member',
    clerkUserId,
    color: '#6B7280',
  });
  await repositories.members.create(member);
}

function verifyClerkEvent(secret: string | undefined, payload: string, context: { req: { header: (name: string) => string | undefined } }): { type: string; data: Record<string, unknown> } | null {
  if (!secret) return JSON.parse(payload) as { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(secret);
    const verified = (wh.verify as (p: string, h: Record<string, string>) => unknown)(payload, {
      'svix-id': context.req.header('svix-id') ?? '',
      'svix-timestamp': context.req.header('svix-timestamp') ?? '',
      'svix-signature': context.req.header('svix-signature') ?? '',
    });
    return verified as { type: string; data: Record<string, unknown> };
  } catch {
    return null;
  }
}

export function clerkWebhookRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.post('/', async context => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    const payload = await context.req.text();
    const event = verifyClerkEvent(secret, payload, context);
    if (!event) return context.json({ error: { message: 'Invalid signature' } }, 400);

    if (event.type === 'user.created' || event.type === 'user.updated') {
      await upsertClerkUser(repositories, event.data);
    }

    return context.json({ received: true });
  });

  return routes;
}
