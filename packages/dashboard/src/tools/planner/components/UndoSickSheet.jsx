import './UndoSickSheet.css';

export default function UndoSickSheet({ day, onConfirm, onClose }) {
  return (
    <div className="undo-sick-overlay" onClick={onClose}>
      <div className="undo-sick-sheet" onClick={e => e.stopPropagation()}>
        <div className="undo-sick-handle" />
        <div className="undo-sick-header">
          <span className="undo-sick-title">Undo Sick Day</span>
          <button className="undo-sick-close" onClick={onClose}>✕</button>
        </div>
        <div className="undo-sick-body">
          {day === 4 ? (
            <p className="undo-sick-msg">
              Sick day marker removed. Friday lessons were permanently deleted
              and cannot be restored.
            </p>
          ) : (
            <p className="undo-sick-msg">
              This will shift lessons back one day for the days they were shifted.
            </p>
          )}
        </div>
        <div className="undo-sick-footer">
          <button className="undo-sick-cancel" onClick={onClose}>Cancel</button>
          <button className="undo-sick-confirm" onClick={onConfirm}>Undo Sick Day</button>
        </div>
      </div>
    </div>
  );
}
