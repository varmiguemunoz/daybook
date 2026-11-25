import type { Role } from './vocab/role';

export const PERMISSIONS = [
  'project:read',
  'project:write',
  'project:delete',
  'task:write',
  'comment:write',
  'member:invite',
  'role:manage',
  'workspace:manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,
  admin: PERMISSIONS.filter(permission => permission !== 'project:delete'),
  member: ['project:read', 'project:write', 'task:write', 'comment:write'],
  guest: ['project:read'],
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}

export function permissionsOf(role: Role): readonly Permission[] {
  return MATRIX[role];
}
