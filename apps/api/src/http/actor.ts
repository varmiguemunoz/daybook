import type { MiddlewareHandler } from 'hono';
import { can, type Member, type Permission } from '@daybook/domain';
import { forbidden } from './errors';

export function requirePermission(member: Member, permission: Permission): void {
  if (!can(member.role, permission)) throw forbidden(permission.replace(':', ' '));
}

export function permit(permission: Permission): MiddlewareHandler {
  return async (context, next) => {
    requirePermission(context.get('scope').member, permission);
    await next();
  };
}
