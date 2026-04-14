import { useState } from 'react';
import { SUBJECT_PRESETS } from '../constants/subjects.js';
import { DAY_SHORT } from '../constants/days.js';
import './AddSubjectSheet.css';

// Props: existingSubjects (string[]), presets (string[]|undefined),
//        weekDates (Date[5]), currentDayIndex (0-4), currentStudent (string),
//        students (string[]),
//        onAdd(subject, cells) — cells: [{ dayIndex, student }]
//        onAddAllDay(name, note), onEditAllDay, onClose
// presets: per-student Firestore subjects; falls back to SUBJECT_PRESETS if absent.
const STUDENT_EMOJI = { Orion: '😎', Malachi: '🐼' };

export default function AddSubjectSheet({
  existingSubjects, presets,
  weekDates, currentDayIndex, currentStudent, students,
  onAdd, onAddAllDay, onEditAllDay, onClose,
}) {
  const [subject, setSubject]         = useState('');
  const [selectedDays, setSelectedDays]         = useState(() => new Set([currentDayIndex]));
  const [selectedStudents, setSelectedStudents] = useState(() => new Set([currentStudent]));
  const [showAllDayForm, setShowAllDayForm] = useState(false);
  const [allDayName, setAllDayName]   = useState('');
  const [allDayNote, setAllDayNote]   = useState('');
  const hasAllDay = existingSubjects.includes('allday');

  const available = presets ?? SUBJECT_PRESETS;
  const trimmed   = subject.trim();

  function toggleDay(i) {
    setSelectedDays(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  function toggleStudent(s) {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  function selectAllDays() { setSelectedDays(new Set([0, 1, 2, 3, 4])); }
  function clearDays()     { setSelectedDays(new Set()); }

  function handleConfirm() {
    if (!trimmed || selectedDays.size === 0 || selectedStudents.size === 0) return;
    const cells = [];
    for (const s of selectedStudents) {
      for (const d of selectedDays) cells.push({ dayIndex: d, student: s });
    }
    onAdd(trimmed, cells);
  }

  function handleAddAllDay() {
    const name = allDayName.trim();
    if (!name) return;
    onAddAllDay(name, allDayNote.trim());
  }

  const cellCount = selectedDays.size * selectedStudents.size;
  const canSubmit = trimmed.length > 0 && cellCount > 0;
  const studentsSummary =
    selectedStudents.size === students.length ? 'all students'
    : Array.from(selectedStudents).join(' & ');

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
                onClick={onEditAllDay}>Edit All Day Event ›</button>
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
                  disabled={!allDayName.trim()}>Add Event</button>
              </div>
            ) : (
              <button className="add-sheet-allday-btn"
                onClick={() => setShowAllDayForm(true)}>+ All Day Event</button>
            )}
          </div>
          <div className="add-sheet-divider" />

          {/* Subject input */}
          <p className="add-sheet-section-label">Subject</p>
          <input
            className="add-sheet-input"
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            placeholder="Subject name…"
          />

          {/* Preset quick-picks — tap to select into input */}
          {available.length > 0 && (
            <>
              <p className="add-sheet-section-label">Quick pick</p>
              <div className="add-sheet-presets">
                {available.map(s => (
                  <button
                    key={s}
                    className={`add-sheet-preset-btn${trimmed === s ? ' add-sheet-preset-btn--active' : ''}`}
                    onClick={() => setSubject(s)}
                  >{s}</button>
                ))}
              </div>
            </>
          )}

          {/* Days selector */}
          <div className="add-sheet-row-header">
            <p className="add-sheet-section-label">Add to days</p>
            <div className="add-sheet-row-actions">
              <button className="add-sheet-link-btn" onClick={selectAllDays}>Select all</button>
              <button className="add-sheet-link-btn" onClick={clearDays}>Clear</button>
            </div>
          </div>
          <div className="add-sheet-day-pills">
            {[0, 1, 2, 3, 4].map(i => (
              <button
                key={i}
                className={`add-sheet-day-pill${selectedDays.has(i) ? ' add-sheet-day-pill--active' : ''}`}
                onClick={() => toggleDay(i)}
              >
                <span className="add-sheet-day-short">{DAY_SHORT[i]}</span>
                <span className="add-sheet-day-date">{weekDates?.[i]?.getDate() ?? ''}</span>
              </button>
            ))}
          </div>

          {/* Students selector */}
          <p className="add-sheet-section-label">Add for students</p>
          <div className="add-sheet-student-pills">
            {students.map(s => (
              <button
                key={s}
                className={`add-sheet-student-pill${selectedStudents.has(s) ? ' add-sheet-student-pill--active' : ''}`}
                onClick={() => toggleStudent(s)}
              >
                <span className="add-sheet-student-emoji">{STUDENT_EMOJI[s] ?? '🧒'}</span>
                <span>{s}</span>
              </button>
            ))}
          </div>

          {/* Summary line */}
          {canSubmit && (
            <p className="add-sheet-summary">
              Adding <strong>{trimmed}</strong> to {selectedDays.size} {selectedDays.size === 1 ? 'day' : 'days'} for {studentsSummary}
            </p>
          )}

          {/* Confirm */}
          <button
            className="add-sheet-confirm-btn"
            onClick={handleConfirm}
            disabled={!canSubmit}
          >
            Add {cellCount} {cellCount === 1 ? 'cell' : 'cells'} →
          </button>
        </div>

      </div>
    </div>
  );
}
