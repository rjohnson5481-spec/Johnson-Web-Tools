import { useState, useEffect } from 'react';
import { GRADING_TYPE_LETTER, GRADING_TYPE_ESNU } from '../constants/academics.js';
import './AddEditCourseSheet.css';

// Stacked bottom sheet for adding/editing a single course.
// Stacks ABOVE CourseCatalogSheet (overlay z-index 310 vs catalog 300) so
// the catalog stays visible behind. Closing this sheet returns to the
// catalog without dismissing it.
//
// Props:
//   open      — boolean, controls visibility
//   onClose   — () => void, dismisses this sheet only
//   onSave    — (data) => void, called with { name, curriculum, gradingType }
//   onDelete  — () => void, only invoked in Edit mode after inline confirmation
//   course    — null in Add mode; { id, name, curriculum, gradingType } in Edit

export default function AddEditCourseSheet({ open, onClose, onSave, onDelete, course }) {
  const isEdit = course != null;

  // Local form state — initialized from `course` when it changes.
  const [name, setName]               = useState('');
  const [curriculum, setCurriculum]   = useState('');
  const [gradingType, setGradingType] = useState(GRADING_TYPE_LETTER);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Re-seed when sheet opens or course changes.
  useEffect(() => {
    if (!open) return;
    setName(course?.name ?? '');
    setCurriculum(course?.curriculum ?? '');
    setGradingType(course?.gradingType ?? GRADING_TYPE_LETTER);
    setConfirmDelete(false);
  }, [open, course]);

  if (!open) return null;

  const trimmedName = name.trim();
  const canSave     = trimmedName.length > 0;

  function handleSave() {
    if (!canSave) return;
    onSave({ name: trimmedName, curriculum: curriculum.trim(), gradingType });
  }

  return (
    <div className="aec-sheet-overlay" onClick={onClose}>
      <div className="aec-sheet" onClick={e => e.stopPropagation()}>

        <div className="aec-sheet-handle" aria-hidden="true" />

        <header className="aec-sheet-header">
          <h2 className="aec-sheet-title">{isEdit ? 'Edit Course' : 'Add Course'}</h2>
          <button className="aec-sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="aec-sheet-body">

          {/* Course name */}
          <label className="aec-field">
            <span className="aec-label">Course name</span>
            <input
              className="aec-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Reading 3"
              autoFocus
            />
          </label>

          {/* Curriculum (optional) */}
          <label className="aec-field">
            <span className="aec-label">Curriculum</span>
            <input
              className="aec-input"
              type="text"
              value={curriculum}
              onChange={e => setCurriculum(e.target.value)}
              placeholder="e.g. BJU Press"
            />
          </label>

          {/* Grading scale */}
          <div className="aec-field">
            <span className="aec-label">Grading scale</span>
            <div className="aec-scale-options">
              <button
                type="button"
                className={`aec-scale-btn${gradingType === GRADING_TYPE_LETTER ? ' aec-scale-btn--active' : ''}`}
                onClick={() => setGradingType(GRADING_TYPE_LETTER)}
              >
                Letter (A–F)
              </button>
              <button
                type="button"
                className={`aec-scale-btn${gradingType === GRADING_TYPE_ESNU ? ' aec-scale-btn--active' : ''}`}
                onClick={() => setGradingType(GRADING_TYPE_ESNU)}
              >
                E / S / N / U
              </button>
            </div>
          </div>

          {/* Inline delete confirmation (Edit mode only) */}
          {isEdit && !confirmDelete && (
            <button className="aec-delete-btn" onClick={() => setConfirmDelete(true)}>
              Remove Course
            </button>
          )}
          {isEdit && confirmDelete && (
            <div className="aec-confirm">
              <p className="aec-confirm-msg">Remove this course? This cannot be undone.</p>
              <div className="aec-confirm-actions">
                <button className="aec-confirm-cancel" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
                <button className="aec-confirm-yes" onClick={onDelete}>
                  Confirm
                </button>
              </div>
            </div>
          )}

        </div>

        <footer className="aec-sheet-footer">
          <button className="aec-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="aec-save-btn" onClick={handleSave} disabled={!canSave}>
            Save
          </button>
        </footer>

      </div>
    </div>
  );
}
