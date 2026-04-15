import { useState } from 'react';
import { GRADING_TYPE_LETTER } from '../constants/academics.js';
import './EnrollmentSheet.css';

// Bottom sheet listing enrollments grouped by student.
// Student selector pills filter the list; one pill per student.
// Tap a row to edit; tap "+ Enroll [student]" to create a new enrollment
// for the currently-selected student. Both flows hand control back to the
// parent (AcademicRecordsTab) which opens AddEditEnrollmentSheet on top.
//
// Enrollment + courses state owned by the parent — passed in as props so
// a save in the parent reflects here without close-then-reopen.
//
// Props:
//   open               — boolean, controls visibility (parent unmounts on false)
//   onClose            — () => void
//   enrollments        — Array<{ id, courseId, student, yearId, notes, syncPlanner }>
//   courses            — Array<{ id, name, curriculum, gradingType }>
//   loading            — boolean
//   error              — string | null
//   onEditEnrollment   — (enrollment) => void
//   onAddEnrollment    — (studentName) => void

const STUDENTS = ['Orion', 'Malachi'];

const DOT_COLORS = [
  '#1565c0', '#c0392b', '#2e7d32', '#7b1fa2',
  '#e65100', '#00838f', '#558b2f', '#ad1457',
];

export default function EnrollmentSheet({
  open, onClose, enrollments, courses, loading, error,
  onEditEnrollment, onAddEnrollment,
}) {
  const [selectedStudent, setSelectedStudent] = useState(STUDENTS[0]);

  if (!open) return null;

  const studentEnrollments = (enrollments ?? []).filter(e => e.student === selectedStudent);
  const courseById = new Map((courses ?? []).map(c => [c.id, c]));

  return (
    <div className="en-sheet-overlay" onClick={onClose}>
      <div className="en-sheet" onClick={e => e.stopPropagation()}>

        <div className="en-sheet-handle" aria-hidden="true" />

        <header className="en-sheet-header">
          <h2 className="en-sheet-title">Enrollments</h2>
          <button className="en-sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="en-sheet-body">

          <div className="en-student-pills">
            {STUDENTS.map(s => (
              <button
                key={s}
                className={`en-student-pill${s === selectedStudent ? ' en-student-pill--active' : ''}`}
                onClick={() => setSelectedStudent(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <p className="en-section-label"><span>{selectedStudent}</span></p>

          {error && (
            <p className="en-loading" role="alert">⚠ {error}</p>
          )}

          {loading && (
            <p className="en-loading">Loading enrollments…</p>
          )}

          {!loading && studentEnrollments.length === 0 && (
            <p className="en-empty">
              No enrollments yet. Enroll {selectedStudent} in a course to get started.
            </p>
          )}

          {!loading && studentEnrollments.length > 0 && (
            <div className="en-enrollment-list">
              {studentEnrollments.map((enr, i) => {
                const course = courseById.get(enr.courseId);
                const courseName = course?.name ?? '(deleted course)';
                const curriculum = course?.curriculum;
                const isLetter = course?.gradingType === GRADING_TYPE_LETTER;
                return (
                  <button
                    key={enr.id}
                    className="en-enrollment-row"
                    onClick={() => onEditEnrollment(enr)}
                  >
                    <span
                      className="en-enrollment-dot"
                      style={{ background: DOT_COLORS[i % DOT_COLORS.length] }}
                      aria-hidden="true"
                    />
                    <div className="en-enrollment-body">
                      <span className="en-enrollment-name">{courseName}</span>
                      {curriculum && (
                        <span className="en-enrollment-curriculum">{curriculum}</span>
                      )}
                    </div>
                    <div className="en-enrollment-badges">
                      {course && (
                        <span className={`en-enrollment-badge${isLetter ? ' en-enrollment-badge--letter' : ' en-enrollment-badge--esnu'}`}>
                          {isLetter ? 'Letter' : 'E/S/N/U'}
                        </span>
                      )}
                      {enr.syncPlanner && (
                        <span className="en-enrollment-badge en-enrollment-badge--planner">
                          ✓ Planner
                        </span>
                      )}
                    </div>
                    <span className="en-enrollment-chevron" aria-hidden="true">›</span>
                  </button>
                );
              })}
            </div>
          )}

          <button className="en-add-btn" onClick={() => onAddEnrollment(selectedStudent)}>
            + Enroll {selectedStudent} in a course
          </button>

        </div>

      </div>
    </div>
  );
}
