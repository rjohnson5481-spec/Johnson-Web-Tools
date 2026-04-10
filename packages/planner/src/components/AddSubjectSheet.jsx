import { useState } from 'react';
import { SUBJECT_PRESETS } from '../constants/subjects.js';
import './AddSubjectSheet.css';

// Props: existingSubjects (string[]), onAdd (fn receives subject string), onClose (fn)
export default function AddSubjectSheet({ existingSubjects, onAdd, onClose }) {
  const [custom, setCustom] = useState('');

  const available = SUBJECT_PRESETS.filter(s => !existingSubjects.includes(s));

  function handleCustomAdd() {
    const trimmed = custom.trim();
    if (!trimmed || existingSubjects.includes(trimmed)) return;
    onAdd(trimmed);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleCustomAdd();
  }

  return (
    <div className="add-sheet-overlay" onClick={onClose}>
      <div className="add-sheet" onClick={e => e.stopPropagation()}>

        <div className="add-sheet-handle" aria-hidden="true" />

        <header className="add-sheet-header">
          <h2 className="add-sheet-title">Add Subject</h2>
          <button className="add-sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="add-sheet-body">
          {/* Custom subject input */}
          <div className="add-sheet-custom">
            <input
              className="add-sheet-input"
              type="text"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Custom subject name…"
              autoFocus
            />
            <button
              className="add-sheet-add-btn"
              onClick={handleCustomAdd}
              disabled={!custom.trim() || existingSubjects.includes(custom.trim())}
            >
              Add
            </button>
          </div>

          {/* Preset quick-picks */}
          {available.length > 0 && (
            <>
              <p className="add-sheet-section-label">Quick add</p>
              <div className="add-sheet-presets">
                {available.map(subject => (
                  <button
                    key={subject}
                    className="add-sheet-preset-btn"
                    onClick={() => onAdd(subject)}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
