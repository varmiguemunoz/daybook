import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  text: string;
  action?: ReactNode;
  className?: string;
  level?: 2 | 3;
}

export function EmptyState({ icon, title, text, action, className = '', level = 2 }: EmptyStateProps) {
  const Heading = level === 3 ? 'h3' : 'h2';

  return (
    <div className={`empty-state ${className}`.trim()}>
      <div className="glyph">
        <Icon name={icon} size={20} />
      </div>
      <Heading className="es-h">{title}</Heading>
      <p>{text}</p>
      {action}
    </div>
  );
}
