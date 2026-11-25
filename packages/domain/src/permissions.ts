import type { Role } from './vocab/role';

export const PERMISSIONS = ['project:read', 'project:write', 'project:delete', 'task:write', 'comment:write', 'workspace:manage'] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS,
  member: ['project:read', 'project:write', 'task:write', 'comment:write'],
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}

export function permissionsOf(role: Role): readonly Permission[] {
  return MATRIX[role];
}
