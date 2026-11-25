import type { Member } from '@gr8r/domain';
import { Icon } from './Icon';

interface AvatarProps {
  member: Member | null | undefined;
  className?: string;
  tip?: boolean;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .slice(0, 2);
}

export function Avatar({ member, className = '', tip = true }: AvatarProps) {
  if (!member) {
    return (
      <span className={`av empty ${className}`.trim()} data-tip={tip ? 'Unassigned' : undefined}>
        <Icon name="user" size={11} />
      </span>
    );
  }

  return (
    <span className={`av ${className}`.trim()} style={{ ['--c' as string]: member.color }} data-tip={tip ? member.name : undefined} aria-label={member.name}>
      {initials(member.name)}
    </span>
  );
}

interface AvatarStackProps {
  members: Member[];
  max?: number;
  className?: string;
}

export function AvatarStack({ members, max = 4, className = 'sm' }: AvatarStackProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <span className="avs">
      {visible.map(member => (
        <Avatar key={member.id} member={member} className={className} />
      ))}
      {overflow > 0 && (
        <span className={`av ${className} more`.trim()} style={{ ['--c' as string]: 'var(--gray)' }}>
          +{overflow}
        </span>
      )}
    </span>
  );
}
