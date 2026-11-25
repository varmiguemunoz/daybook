import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="ph">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action && <div className="acts">{action}</div>}
    </div>
  );
}
