import { CloseIcon } from './Icons.jsx';

const SHORTCUTS = [
  { key: 'H', action: 'Go to Home Dashboard' },
  { key: 'M', action: 'Open Mission Generator' },
  { key: 'J', action: 'Open Nature Journal' },
  { key: 'L', action: 'Browse Field Library' },
  { key: '?', action: 'Open Keyboard Shortcuts (this menu)' },
  { key: 'Esc', action: 'Close any open modal or dialog' },
];

export function KeyboardShortcutsModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card modal-shortcuts" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Naturalist Keyboard Shortcuts</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close shortcuts">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="shortcuts-sub">
            Navigate FieldNote quickly and keep your hands off the mouse for distraction-free attention.
          </p>

          <div className="shortcuts-table">
            {SHORTCUTS.map((item) => (
              <div key={item.key} className="shortcut-row">
                <span className="shortcut-action">{item.action}</span>
                <kbd className="shortcut-kbd">{item.key}</kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
