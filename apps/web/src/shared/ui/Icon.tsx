import { ICONS } from 'virtual:icons';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

const FALLBACK = '<rect x="5" y="5" width="14" height="14" rx="3"/>';

/** Renders a Lucide glyph with the same geometry the legacy shell used. */
export function Icon({ name, size = 16, className = '' }: IconProps) {
  return (
    <svg
      className={`i ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] ?? FALLBACK }}
    />
  );
}
