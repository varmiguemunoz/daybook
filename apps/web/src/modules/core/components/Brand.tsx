const LOGO_PANELS =
  'M81.4 0 91.1 39.2 50.7 62 9.9 39.6ZM167.6 46.4V101.7L114.7 130.8 90.1 117.5V88.4ZM0 52.2 44.9 77V166.1L0 140.6ZM60.4 118.5 118.6 151V208L60.4 174.7Z';
const LOGO_ACCENT = 'M167.6 27.4 134.9 46.4 101.8 27.9 134.4 9Z';

export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg className="logo" height={size} width={Math.round((size * 167.6) / 208)} viewBox="0 0 167.6 208" aria-hidden="true">
      <path d={LOGO_PANELS} fill="#F0E1C9" />
      <path d={LOGO_ACCENT} fill="#F17919" />
    </svg>
  );
}

export function Brand({ size = 26 }: { size?: number }) {
  return (
    <span className="brand">
      <LogoMark size={size} />
      <span className="brand-name">Daybook</span>
    </span>
  );
}

interface WorkspaceLogoProps {
  name: string;
  color: string;
  size?: number;
}

export function WorkspaceLogo({ name, color, size = 22 }: WorkspaceLogoProps) {
  return (
    <span className="ws-logo" style={{ ['--c' as string]: color, width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.46)) }}>
      {name.charAt(0)}
    </span>
  );
}
