import { useState } from 'react';
import { SUBJECT_PRESETS } from '../constants/subjects.js';
import './AddSubjectSheet.css';

// Props: existingSubjects (string[]), presets (string[]|undefined),
//        onAdd (fn), onAddAllDay (name, note) (fn), onEditAllDay (fn), onClose (fn)
// presets: per-student Firestore subjects; falls back to SUBJECT_PRESETS if absent.
export default function AddSubjectSheet({ existingSubjects, presets, onAdd, onAddAllDay, onEditAllDay, onClose }) {
  const [custom, setCustom]           = useState('');
  const [showAllDayForm, setShowAllDayForm] = useState(false);
  const [allDayName, setAllDayName]   = useState('');
  const [allDayNote, setAllDayNote]   = useState('');
  const hasAllDay = existingSubjects.includes('allday');

  const available = (presets ?? SUBJECT_PRESETS).filter(s => !existingSubjects.includes(s));

  function handleCustomAdd() {
    const trimmed = custom.trim();
    if (!trimmed || existingSubjects.includes(trimmed)) return;
    onAdd(trimmed);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleCustomAdd();
  }

  function handleAddAllDay() {
    const name = allDayName.trim();
    if (!name) return;
    onAddAllDay(name, allDayNote.trim());
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
          {/* All Day Event option */}
          <div className="add-sheet-allday">
            {hasAllDay ? (
              <button className="add-sheet-allday-btn add-sheet-allday-btn--edit"
                onClick={onEditAllDay}>
                Edit All Day Event ›
              </button>
            ) : showAllDayForm ? (
              <div className="add-sheet-allday-form">
                <input className="add-sheet-input" type="text" value={allDayName}
                  onChange={e => setAllDayName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddAllDay()}
                  placeholder="Event name…" autoFocus />
                <input className="add-sheet-input" type="text" value={allDayNote}
                  onChange={e => setAllDayNote(e.target.value)}
                  placeholder="Note (optional)…" />
                <button className="add-sheet-add-btn" onClick={handleAddAllDay}
                  disabled={!allDayName.trim()}>
                  Add Event
                </button>
              </div>
            ) : (
              <button className="add-sheet-allday-btn"
                onClick={() => setShowAllDayForm(true)}>
                + All Day Event
              </button>
            )}
          </div>
          <div className="add-sheet-divider" />

          {/* Custom subject input */}
          <div className="add-sheet-custom">
            <input
              className="add-sheet-input"
              type="text"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Custom subject name…"
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
