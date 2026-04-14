import './DebugSheet.css';

// Props: log (string[]), onClose
// Displayed on top of UploadSheet (z-index 300).
export default function DebugSheet({ log, onClose }) {
  function copyAll() {
    navigator.clipboard.writeText(log.join('\n')).catch(() => {});
  }

  return (
    <div className="debug-sheet-overlay" onClick={onClose}>
      <div className="debug-sheet" onClick={e => e.stopPropagation()}>
        <div className="debug-sheet-handle" />
        <div className="debug-sheet-header">
          <span className="debug-sheet-title">Import Log</span>
          <div className="debug-sheet-header-actions">
            <button className="debug-sheet-copy" onClick={copyAll}>Copy All</button>
            <button className="debug-sheet-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>
        <div className="debug-sheet-body">
          {log.length === 0
            ? <p className="debug-sheet-empty">No log entries yet.</p>
            : log.map((entry, i) => <p key={i} className="debug-sheet-entry">{entry}</p>)
          }
        </div>
      </div>
    </div>
  );
}
