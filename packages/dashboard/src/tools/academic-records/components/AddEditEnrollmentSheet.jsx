import { useState, useEffect } from 'react';
import { GRADING_TYPE_LETTER, GRADE_LEVELS } from '../constants/academics.js';
import './AddEditEnrollmentSheet.css';
import './AddEditEnrollmentForm.css';

// Stacked bottom sheet for adding or editing one enrollment.
// Stacks ABOVE EnrollmentSheet (overlay z-index 310 vs list 300).
// Closing this sheet returns to the enrollment list.
//
// Course is locked once an enrollment exists — to switch courses, the user
// must delete the enrollment and re-enroll. This protects any grades that
// have already been recorded against this enrollment from silently moving.
//
// Props:
//   open        — boolean
//   onClose     — () => void, dismisses this sheet only
//   onSave      — (data) => void, receives { courseId, student, notes, syncPlanner }
//   onDelete    — () => void, called after inline confirm in Edit mode
//   student     — string, pre-selected (display only — not editable)
//   courses     — Array<{ id, name, curriculum, gradingType }> for the picker
//   enrollment  — null in Add mode; { id, courseId, student, notes, syncPlanner } in Edit

const DOT_COLORS = [
  '#1565c0', '#c0392b', '#2e7d32', '#7b1fa2',
  '#e65100', '#00838f', '#558b2f', '#ad1457',
];

export default function AddEditEnrollmentSheet({
  open, onClose, onSave, onDelete, student, courses, enrollment,
}) {
  const isEdit = enrollment != null;

  const [courseId, setCourseId]           = useState('');
  const [notes, setNotes]                 = useState('');
  const [gradeLevel, setGradeLevel]       = useState(null);
  const [syncPlanner, setSyncPlanner]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCourseId(enrollment?.courseId ?? '');
    setNotes(enrollment?.notes ?? '');
    setGradeLevel(enrollment?.gradeLevel ?? null);
    setSyncPlanner(enrollment?.syncPlanner ?? false);
    setConfirmDelete(false);
  }, [open, enrollment]);

  if (!open) return null;

  const canSave    = isEdit ? true : courseId !== '';
  const editCourse = isEdit ? (courses ?? []).find(c => c.id === enrollment.courseId) : null;

  function handleSave() {
    if (!canSave) return;
    onSave({
      courseId: isEdit ? enrollment.courseId : courseId,
      student,
      notes: notes.trim(),
      gradeLevel,
      syncPlanner,
    });
  }

  // Helper text under the Sync to Planner toggle — three cases.
  let syncHelper;
  if (!isEdit) {
    syncHelper = `Adds this course to ${student}'s default subjects in the Planner.`;
  } else if (syncPlanner) {
    syncHelper = 'Already synced to Planner.';
  } else {
    syncHelper = `Turn on to add this course to ${student}'s default subjects in the Planner.`;
  }

  return (
    <div className="aee-sheet-overlay" onClick={onClose}>
      <div className="aee-sheet" onClick={e => e.stopPropagation()}>

        <div className="aee-sheet-handle" aria-hidden="true" />

        <header className="aee-sheet-header">
          <h2 className="aee-sheet-title">
            {isEdit ? 'Edit Enrollment' : `Enroll ${student}`}
          </h2>
          <button className="aee-sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="aee-sheet-body">

          {/* Student (read-only in both modes) */}
          <div className="aee-field">
            <span className="aee-label">Student</span>
            <div className="aee-readonly">{student}</div>
          </div>

          {/* Course — picker in Add mode, read-only in Edit mode */}
          <div className="aee-field">
            <span className="aee-label">Course</span>
            {!isEdit ? (
              (courses ?? []).length === 0 ? (
                <p className="aee-helper">
                  No courses yet. Add a course in the Course Catalog first.
                </p>
              ) : (
                <div className="aee-course-list">
                  {(courses ?? []).map((c, i) => {
                    const isLetter = c.gradingType === GRADING_TYPE_LETTER;
                    const selected = c.id === courseId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`aee-course-row${selected ? ' aee-course-row--selected' : ''}`}
                        onClick={() => setCourseId(c.id)}
                      >
                        <span
                          className="aee-course-dot"
                          style={{ background: DOT_COLORS[i % DOT_COLORS.length] }}
                          aria-hidden="true"
                        />
                        <div className="aee-course-body">
                          <span className="aee-course-name">{c.name}</span>
                          {c.curriculum && (
                            <span className="aee-course-curriculum">{c.curriculum}</span>
                          )}
                        </div>
                        <span className={`aee-course-badge${isLetter ? ' aee-course-badge--letter' : ' aee-course-badge--esnu'}`}>
                          {isLetter ? 'Letter' : 'E/S/N/U'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              <>
                <div className="aee-readonly">{editCourse?.name ?? '(deleted course)'}</div>
                <p className="aee-helper">
                  To change the course, delete this enrollment and re-enroll.
                </p>
              </>
            )}
          </div>

          {/* Notes */}
          <label className="aee-field">
            <span className="aee-label">Notes</span>
            <textarea
              className="aee-notes"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes about this enrollment"
            />
          </label>

          {/* Grade level */}
          <div className="aee-field">
            <span className="aee-label">Grade level</span>
            <div className="aee-grade-pills">
              {GRADE_LEVELS.map(gl => (
                <button key={gl} type="button"
                  className={`aee-grade-pill${gradeLevel === gl ? ' selected' : ''}`}
                  onClick={() => setGradeLevel(gradeLevel === gl ? null : gl)}
                >{gl}</button>
              ))}
            </div>
          </div>

          {/* Sync to Planner */}
          <div className="aee-field">
            <div className="aee-toggle-row">
              <span className="aee-label">Sync to Planner</span>
              <button
                type="button"
                className={`aee-toggle${syncPlanner ? ' aee-toggle--on' : ''}`}
                onClick={() => setSyncPlanner(v => !v)}
                aria-label="Toggle sync to planner"
                aria-pressed={syncPlanner}
              />
            </div>
            <p className="aee-helper">{syncHelper}</p>
          </div>

          {/* Inline delete confirmation (Edit mode only) */}
          {isEdit && !confirmDelete && (
            <button className="aee-delete-btn" onClick={() => setConfirmDelete(true)}>
              Remove Enrollment
            </button>
          )}
          {isEdit && confirmDelete && (
            <div className="aee-confirm">
              <p className="aee-confirm-msg">
                Remove this enrollment? Planner subjects will not be affected.
              </p>
              <div className="aee-confirm-actions">
                <button className="aee-confirm-cancel" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
                <button className="aee-confirm-yes" onClick={onDelete}>
                  Confirm
                </button>
              </div>
            </div>
          )}

        </div>

        <footer className="aee-sheet-footer">
          <button className="aee-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="aee-save-btn" onClick={handleSave} disabled={!canSave}>
            Save
          </button>
        </footer>

      </div>
    </div>
  );
}
