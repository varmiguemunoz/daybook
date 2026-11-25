import { can, type Member, type Permission } from '@gr8r/domain';
import { forbidden } from './errors';

export function requirePermission(member: Member, permission: Permission): void {
  if (!can(member.role, permission)) {
    throw forbidden(permission.replace(':', ' '));
  }
}
