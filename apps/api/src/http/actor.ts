import type { Context } from 'hono';
import { can, type Member, type Permission } from '@gr8r/domain';
import { forbidden } from './errors';

const FALLBACK_MEMBER_ID = 'm1';

export function memberIdOf(context: Context): string {
  return context.req.header('x-member-id') ?? FALLBACK_MEMBER_ID;
}

export function requirePermission(member: Member, permission: Permission): void {
  if (!can(member.role, permission)) {
    throw forbidden(permission.replace(':', ' '));
  }
}
