import { ThemeCards } from './ThemeCards';

export function AppearanceSection() {
  return (
    <>
      <h1>Appearance</h1>
      <p className="lead">How the app looks for you. Saved to your profile, so it follows you to every device.</p>
      <div className="sblock" style={{ marginTop: 0 }}>
        <h2>Theme</h2>
        <ThemeCards />
      </div>
    </>
  );
}
