import { useUiStore } from '../../stores/ui-store';

const COMMANDS = [
  { label: 'Go to Tasks', href: '/tasks' },
  { label: 'Go to Board', href: '/board' },
  { label: 'Go to Settings', href: '/settings' },
];

export function CommandPalette() {
  const open = useUiStore(state => state.commandPaletteOpen);
  const setOpen = useUiStore(state => state.setCommandPaletteOpen);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
      <div className="modal" onClick={event => event.stopPropagation()}>
        <header className="modal-header">
          <h2>Command palette</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close">
            ×
          </button>
        </header>
        <div className="modal-body">
          <ul className="command-list">
            {COMMANDS.map(command => (
              <li key={command.href}>
                <a href={command.href} onClick={() => setOpen(false)}>
                  {command.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
