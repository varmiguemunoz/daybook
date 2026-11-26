import { ROLE_LABELS, ROLES } from '@daybook/domain';
import { Icon } from '../../core/components/Icon';

const PERMISSIONS: Array<[string, number, number]> = [
  ['View projects & tasks', 1, 1],
  ['Comment on tasks', 1, 1],
  ['Create and edit tasks', 1, 1],
  ['Create and edit notes', 1, 1],
  ['Create projects', 1, 1],
  ['Delete projects', 1, 0],
  ['Invite members', 1, 0],
  ['Manage roles', 1, 0],
  ['Workspace settings', 1, 0],
];

export function PermissionsTable() {
  return (
    <div className="panel" style={{ overflowX: 'auto' }}>
      <table className="perm-t" style={{ minWidth: 560 }}>
        <thead>
          <tr>
            <th style={{ paddingLeft: 14 }}>Permission</th>
            {ROLES.map(role => (
              <th key={role}>{ROLE_LABELS[role]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSIONS.map(([label, ...flags]) => (
            <tr key={label}>
              <td style={{ paddingLeft: 14 }}>{label}</td>
              {flags.map((flag, index) => (
                <td key={ROLES[index] ?? index}>
                  {flag ? (
                    <span style={{ color: 'var(--green)', display: 'inline-flex' }} aria-label="Allowed">
                      <Icon name="check" size={15} />
                    </span>
                  ) : (
                    <span className="faint" style={{ display: 'inline-flex' }} aria-label="Not allowed">
                      <Icon name="minus" size={15} />
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
