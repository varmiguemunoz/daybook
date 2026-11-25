interface Props {
  lines?: number;
  className?: string;
}

export function Skeleton({ lines = 3, className }: Props) {
  return (
    <div className={`skeleton ${className ?? ''}`.trim()} aria-busy="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="skeleton-line" />
      ))}
    </div>
  );
}
