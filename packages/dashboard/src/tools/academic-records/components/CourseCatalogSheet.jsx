import { useCourses } from '../hooks/useCourses.js';
import { GRADING_TYPE_LETTER } from '../constants/academics.js';
import './CourseCatalogSheet.css';

// Bottom sheet listing the school-wide course catalog.
// Tap a row to edit; tap "+ Add Course" to create. Both flows hand control
// to the parent (AcademicRecordsTab) which opens the AddEditCourseSheet
// stacked on top of this one.
//
// Props:
//   open           — boolean, controls visibility (parent unmounts on false)
//   onClose        — () => void, dismisses the sheet
//   uid            — Firebase user id (passed to useCourses)
//   onEditCourse   — (course) => void, fires when a row is tapped
//   onAddCourse    — () => void, fires when "+ Add Course" is tapped

// Color palette for course dots — cycled by index, matches Ink & Gold.
const DOT_COLORS = [
  '#1565c0', '#c0392b', '#2e7d32', '#7b1fa2',
  '#e65100', '#00838f', '#558b2f', '#ad1457',
];

export default function CourseCatalogSheet({ open, onClose, uid, onEditCourse, onAddCourse }) {
  const { courses, loading } = useCourses(uid);

  if (!open) return null;

  return (
    <div className="cc-sheet-overlay" onClick={onClose}>
      <div className="cc-sheet" onClick={e => e.stopPropagation()}>

        <div className="cc-sheet-handle" aria-hidden="true" />

        <header className="cc-sheet-header">
          <h2 className="cc-sheet-title">Course Catalog</h2>
          <button className="cc-sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="cc-sheet-body">
          <p className="cc-section-label"><span>Courses</span></p>

          {loading && (
            <p className="cc-loading">Loading courses…</p>
          )}

          {!loading && courses.length === 0 && (
            <p className="cc-empty">No courses yet. Add your first course to get started.</p>
          )}

          {!loading && courses.length > 0 && (
            <div className="cc-course-list">
              {courses.map((course, i) => {
                const isLetter = course.gradingType === GRADING_TYPE_LETTER;
                return (
                  <button
                    key={course.id}
                    className="cc-course-row"
                    onClick={() => onEditCourse(course)}
                  >
                    <span
                      className="cc-course-dot"
                      style={{ background: DOT_COLORS[i % DOT_COLORS.length] }}
                      aria-hidden="true"
                    />
                    <div className="cc-course-body">
                      <span className="cc-course-name">{course.name}</span>
                      {course.curriculum && (
                        <span className="cc-course-curriculum">{course.curriculum}</span>
                      )}
                    </div>
                    <span className={`cc-course-badge${isLetter ? ' cc-course-badge--letter' : ' cc-course-badge--esnu'}`}>
                      {isLetter ? 'Letter' : 'E/S/N/U'}
                    </span>
                    <span className="cc-course-chevron" aria-hidden="true">›</span>
                  </button>
                );
              })}
            </div>
          )}

          <button className="cc-add-btn" onClick={onAddCourse}>
            + Add Course
          </button>
        </div>

      </div>
    </div>
  );
}
