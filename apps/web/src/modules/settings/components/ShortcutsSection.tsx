const SHORTCUTS: Array<[string, string]> = [
  ['Search or jump to', '⌘K'],
  ['New task', 'C'],
  ['New project', 'P'],
  ['Toggle sidebar', '['],
  ['Close dialog', 'Esc'],
  ['Open command menu', '⌘/'],
];

export function ShortcutsSection() {
  return (
    <>
      <h1>Keyboard shortcuts</h1>
      <p className="lead">Move faster without leaving the keyboard.</p>
      <div className="sblock" style={{ marginTop: 0 }}>
        {SHORTCUTS.map(([label, keys]) => (
          <div key={label} className="srow">
            <div>
              <div className="t">{label}</div>
            </div>
            <div className="row">
              <kbd>{keys}</kbd>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
