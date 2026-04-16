import { useState, useEffect, useMemo } from 'react';
import { GRADING_TYPE_LETTER } from '../constants/academics.js';
import { LETTER_SCALE, ESNU_SCALE } from '../constants/scales.js';
import './GradeEntrySheet.css';

// Bottom sheet for entering grades for one student × one quarter.
// Stacks ABOVE the Records main view (overlay z-index 310).
//
// Shows one row per enrollment. Each row has a pill-style grade picker
// that respects the course's gradingType (letter or ESNU). On Save,
// the caller receives the full set of grade edits to upsert.
//
// Props:
//   open              — boolean
//   onClose           — () => void
//   onSave            — (edits: Array<{ enrollmentId, quarterId, grade, existingId? }>) => Promise
//   enrollments       — Array<{ id, courseId, student }>  (already filtered to selected student)
//   courses           — Array<{ id, name, gradingType }>
//   grades            — Array<{ id, enrollmentId, quarterId, grade }>  (all grades, not pre-filtered)
//   selectedQuarterId — string
//   quarterLabel      — string, displayed in header

const DOT_COLORS = [
  '#1565c0', '#c0392b', '#2e7d32', '#7b1fa2',
  '#e65100', '#00838f', '#558b2f', '#ad1457',
];

export default function GradeEntrySheet({
  open, onClose, onSave,
  enrollments, courses, grades,
  selectedQuarterId, quarterLabel,
}) {
  const courseById = useMemo(
    () => new Map((courses ?? []).map(c => [c.id, c])),
    [courses],
  );

  // Build initial local state: { [enrollmentId]: gradeValue | '' }
  const initialValues = useMemo(() => {
    const map = {};
    (enrollments ?? []).forEach(enr => {
      const existing = (grades ?? []).find(
        g => g.enrollmentId === enr.id && g.quarterId === selectedQuarterId,
      );
      map[enr.id] = existing?.grade ?? '';
    });
    return map;
  }, [enrollments, grades, selectedQuarterId]);

  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  // Re-seed when sheet opens or quarter/enrollments change.
  useEffect(() => {
    if (!open) return;
    setValues(initialValues);
    setSaving(false);
  }, [open, initialValues]);

  if (!open) return null;

  const hasChanges = Object.keys(values).some(eid => values[eid] !== (initialValues[eid] ?? ''));

  function setGrade(enrollmentId, grade) {
    setValues(prev => ({ ...prev, [enrollmentId]: prev[enrollmentId] === grade ? '' : grade }));
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    const edits = (enrollments ?? [])
      .filter(enr => values[enr.id])
      .map(enr => {
        const existing = (grades ?? []).find(
          g => g.enrollmentId === enr.id && g.quarterId === selectedQuarterId,
        );
        return {
          enrollmentId: enr.id,
          quarterId: selectedQuarterId,
          grade: values[enr.id],
          existingId: existing?.id ?? null,
        };
      });
    try {
      await onSave(edits);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ge-sheet-overlay" onClick={onClose}>
      <div className="ge-sheet" onClick={e => e.stopPropagation()}>

        <div className="ge-sheet-handle" aria-hidden="true" />

        <header className="ge-sheet-header">
          <h2 className="ge-sheet-title">Enter Grades — {quarterLabel ?? 'Quarter'}</h2>
          <button className="ge-sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="ge-sheet-body">
          {(enrollments ?? []).length === 0 ? (
            <p className="ge-empty">No courses enrolled for this student.</p>
          ) : (
            (enrollments ?? []).map((enr, i) => {
              const course = courseById.get(enr.courseId);
              const isLetter = (course?.gradingType ?? GRADING_TYPE_LETTER) === GRADING_TYPE_LETTER;
              const scale = isLetter ? LETTER_SCALE : ESNU_SCALE;
              const selected = values[enr.id] ?? '';

              return (
                <div key={enr.id} className="ge-row">
                  <div className="ge-row-header">
                    <span className="ge-dot" style={{ background: DOT_COLORS[i % DOT_COLORS.length] }} />
                    <span className="ge-course-name">{course?.name ?? '(deleted course)'}</span>
                    <span className="ge-scale-badge">
                      {isLetter ? 'Letter' : 'E/S/N/U'}
                    </span>
                  </div>
                  <div className="ge-pills">
                    {scale.map(s => (
                      <button
                        key={s.grade}
                        className={`ge-pill${selected === s.grade ? ' active' : ''}`}
                        onClick={() => setGrade(enr.id, s.grade)}
                        title={s.descriptor}
                        type="button"
                      >{s.grade}</button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <footer className="ge-sheet-footer">
          <button className="ge-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="ge-save-btn"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving…' : 'Save Grades'}
          </button>
        </footer>

      </div>
    </div>
  );
}
