import type { MiddlewareHandler } from 'hono';
import { can, type Member, type Permission } from '@daybook/domain';
import { forbidden } from './errors';

const ACTIONS: Record<Permission, string> = {
  'project:read': 'read projects',
  'project:write': 'edit projects',
  'project:delete': 'delete projects',
  'task:write': 'edit tasks',
  'comment:write': 'write comments',
  'note:write': 'edit notes',
  'workspace:manage': 'manage the workspace (admins only)',
};

export function requirePermission(member: Member, permission: Permission): void {
  if (!can(member.role, permission)) throw forbidden(ACTIONS[permission]);
}

export function permit(permission: Permission): MiddlewareHandler {
  return async (context, next) => {
    requirePermission(context.get('scope').member, permission);
    await next();
  };
}
