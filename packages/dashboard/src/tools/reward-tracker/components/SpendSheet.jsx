import { useState } from 'react';
import './ActionSheet.css';

const QUICK = [1, 5, 10, 25, 50];

// Props: student (string), balance (number), onConfirm (delta, note), onClose
export default function SpendSheet({ student, balance, onConfirm, onClose }) {
  const [value, setValue] = useState(5);
  const [desc, setDesc]   = useState('');

  const tooMany = value > balance;

  function handleConfirm() {
    if (tooMany) return;
    onConfirm(value, desc);
  }

  return (
    <div className="action-overlay" onClick={onClose}>
      <div className="action-sheet" onClick={e => e.stopPropagation()}>
        <div className="action-sheet-handle" />
        <header className="action-sheet-header">
          <h2 className="action-sheet-title">🎁 Spend — {student}</h2>
          <button className="action-sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="action-sheet-body">
          <div className="action-stepper">
            <button className="action-stepper-btn" onClick={() => setValue(v => Math.max(1, v - 1))}
              disabled={value <= 1}>−</button>
            <span className="action-stepper-value">{value}</span>
            <button className="action-stepper-btn" onClick={() => setValue(v => v + 1)}>+</button>
          </div>

          <div className="action-quick-picks">
            {QUICK.map(q => (
              <button key={q} className={`action-quick-btn${value === q ? ' action-quick-btn--active' : ''}`}
                onClick={() => setValue(q)}>{q}</button>
            ))}
          </div>

          <p className="action-balance">Balance: {balance} pts{tooMany ? ' — not enough pts' : ''}</p>

          <textarea className="action-input" rows={2} value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="e.g. 30 min Xbox, ice cream, stay up late" />
        </div>

        <div className="action-sheet-footer">
          <button className="action-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="action-confirm-btn action-confirm-btn--spend"
            onClick={handleConfirm} disabled={tooMany}>
            Spend {value} pts!
          </button>
        </div>
      </div>
    </div>
  );
}
