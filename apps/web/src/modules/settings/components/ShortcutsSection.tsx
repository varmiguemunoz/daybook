import { MOD } from '../../core/utils/platform';

const SHORTCUTS: Array<[string, string[]]> = [
  ['Search or jump to', [MOD, 'K']],
  ['Move through results and menus', ['↑', '↓']],
  ['Close a dialog or menu', ['Esc']],
  ['Save the note you are editing', [MOD, 'S']],
  ['Stop editing a note', ['Esc']],
  ['Pick a note after typing [[', ['Enter']],
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
            <div className="row" style={{ gap: 4 }}>
              {keys.map(key => (
                <kbd key={key}>{key}</kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
