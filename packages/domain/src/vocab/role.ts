export const ROLES = ['admin', 'member'] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  member: 'Member',
};
