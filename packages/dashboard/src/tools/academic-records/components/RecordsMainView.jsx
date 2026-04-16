import { useMemo } from 'react';
import { GRADING_TYPE_LETTER } from '../constants/academics.js';

// Pure presentation for the Academic Records tab body.
// All data is owned by the parent (AcademicRecordsTab) and passed in as
// props. All sheet-open actions bubble back up via the three on*Open
// callbacks. No Firestore I/O happens here.
//
// Props:
//   selectedStudent, setSelectedStudent
//   selectedQuarterId, setSelectedQuarterId
//   summary               — output of useAcademicSummary
//   courses               — Array<{ id, name, curriculum, gradingType }>
//   grades                — Array<{ id, enrollmentId, quarterId, grade }> from useGrades
//   onCatalogOpen, onEnrollmentsOpen, onSchoolYearOpen, onEnterGrades — () => void

const STUDENTS = ['Orion', 'Malachi'];
const DOT_COLORS = [
  '#1565c0', '#c0392b', '#2e7d32', '#7b1fa2',
  '#e65100', '#00838f', '#558b2f', '#ad1457',
];

function gradeClass(grade, gradingType) {
  if (!grade) return '';
  const letter = String(grade).trim().toUpperCase();
  const prefix = gradingType === GRADING_TYPE_LETTER ? 'letter' : 'esnu';
  return `${prefix}-${letter.toLowerCase()}`;
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

export default function RecordsMainView({
  selectedStudent, setSelectedStudent,
  selectedQuarterId, setSelectedQuarterId,
  summary, courses, grades,
  onCatalogOpen, onEnrollmentsOpen, onSchoolYearOpen, onEnterGrades, onCalendarImport,
}) {
  const { activeSchoolYear, studentEnrollments, courseCount, attendanceDays } = summary;
  const today      = todayStr();
  const courseById = useMemo(() => new Map((courses ?? []).map(c => [c.id, c])), [courses]);
  const yearStart  = activeSchoolYear?.label?.split(/[–-]/)[0]?.trim() ?? '—';
  const yearLabel  = activeSchoolYear?.label ?? 'not set';
  const attendancePct = attendanceDays.required > 0
    ? Math.min(100, Math.round((attendanceDays.attended / attendanceDays.required) * 100))
    : 0;

  return (
    <>
      <header className="ar-header">
        <h1 className="ar-title">Academic Records</h1>
        <p className="ar-subtitle">{activeSchoolYear?.label ?? 'No school year set'}</p>
      </header>

      <div className="ar-student-row">
        {STUDENTS.map(s => (
          <button
            key={s}
            className={`ar-student-pill${s === selectedStudent ? ' active' : ''}`}
            onClick={() => setSelectedStudent(s)}
          >{s}</button>
        ))}
      </div>

      {(activeSchoolYear?.quarters?.length ?? 0) > 0 && (
        <div className="ar-quarter-row">
          {activeSchoolYear.quarters.map(q => {
            const isFuture = q.startDate && q.startDate > today;
            const cls = `ar-quarter-pill${q.id === selectedQuarterId ? ' active' : ''}${isFuture ? ' future' : ''}`;
            return (
              <button
                key={q.id}
                className={cls}
                disabled={isFuture}
                onClick={() => !isFuture && setSelectedQuarterId(q.id)}
              >{q.label}</button>
            );
          })}
        </div>
      )}

      <div className="ar-stats-row">
        <div className="ar-stat-card gold">
          <div className="ar-stat-label">Attendance</div>
          <div className="ar-stat-value">{summary.loading ? '—' : attendanceDays.attended}</div>
          <div className="ar-stat-sub">of 175 days required</div>
        </div>
        <div className="ar-stat-card">
          <div className="ar-stat-label">Courses</div>
          <div className="ar-stat-value">{courseCount}</div>
          <div className="ar-stat-sub">enrolled this year</div>
        </div>
        <div className="ar-stat-card">
          <div className="ar-stat-label">School Year</div>
          <div className="ar-stat-value">{yearStart}</div>
          <div className="ar-stat-sub">{yearLabel}</div>
        </div>
      </div>

      <p className="ar-section-label">Grades — {selectedStudent}</p>

      {studentEnrollments.length === 0 ? (
        <div className="ar-grade-card">
          <div className="ar-grade-empty">No courses enrolled. Add courses in Manage Enrollments.</div>
        </div>
      ) : (
        <div className="ar-grade-card">
          {studentEnrollments.map((enr, i) => {
            const course = courseById.get(enr.courseId);
            const gradingType = course?.gradingType ?? GRADING_TYPE_LETTER;
            const grade = (grades ?? []).find(g => g.enrollmentId === enr.id && g.quarterId === selectedQuarterId);
            return (
              <div key={enr.id} className="ar-grade-row">
                <span className="ar-course-dot" style={{ background: DOT_COLORS[i % DOT_COLORS.length] }} />
                <div className="ar-course-info">
                  <div className="ar-course-name">{course?.name ?? '(deleted course)'}</div>
                  <div className="ar-course-meta">
                    {course?.curriculum && <span>{course.curriculum}</span>}
                    <span className={gradingType === GRADING_TYPE_LETTER ? 'ar-badge-letter' : 'ar-badge-esnu'}>
                      {gradingType === GRADING_TYPE_LETTER ? 'Letter' : 'E/S/N/U'}
                    </span>
                  </div>
                </div>
                {grade ? (
                  <span className={`ar-grade-value ${gradeClass(grade.grade, gradingType)}`}>{grade.grade}</span>
                ) : (
                  <span className="ar-grade-value pending">— pending</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="ar-action-row">
        <button className="ar-action-btn" onClick={onEnterGrades}>
          <span>✏️ Enter Grades</span><span>›</span>
        </button>
        <button className="ar-action-btn disabled" disabled>
          <span>📄 Generate Report</span><span className="soon">Soon</span>
        </button>
      </div>

      <div className="ar-attendance-card">
        <p className="ar-section-label" style={{ marginBottom: 0 }}>
          Attendance — {activeSchoolYear?.label ?? '—'}
        </p>
        <div className="ar-attendance-num">{attendanceDays.attended}</div>
        <p className="ar-attendance-sub">days completed</p>
        <div className="ar-attendance-bar-track">
          <div className="ar-attendance-bar-fill" style={{ width: `${attendancePct}%` }} />
        </div>
        <div className="ar-attendance-labels">
          <span>{attendancePct}% complete</span>
          <span>175 days required (ND)</span>
        </div>
        <div className="ar-attendance-detail">
          <span>Attended: <strong>{attendanceDays.attended}</strong></span>
          <span>Sick: <strong>{attendanceDays.sick}</strong></span>
          {(attendanceDays.breakDays ?? 0) > 0 && (
            <span>Breaks: <strong>{attendanceDays.breakDays}</strong></span>
          )}
          <span>School days: <strong>{attendanceDays.schoolDays}</strong></span>
        </div>
        <p className="ar-attendance-note">Sick days pulled automatically from Planner</p>
      </div>

      <p className="ar-section-label">Quick Actions</p>

      <div className="ar-quick-actions">
        <button className="ar-action-btn" onClick={onCatalogOpen}>
          <span>📚 Manage Course Catalog</span><span>›</span>
        </button>
        <button className="ar-action-btn" onClick={onEnrollmentsOpen}>
          <span>👤 Manage Enrollments</span><span>›</span>
        </button>
        {onCalendarImport ? (
          <button className="ar-action-btn" onClick={onCalendarImport}>
            <span>📅 Import Calendar Breaks</span><span>›</span>
          </button>
        ) : (
          <button className="ar-action-btn disabled" disabled>
            <span>📅 Import Calendar Breaks</span><span className="soon">Soon</span>
          </button>
        )}
        <button className="ar-action-btn" onClick={onSchoolYearOpen}>
          <span>🗓️ Manage School Year &amp; Quarters</span><span>›</span>
        </button>
        <button className="ar-action-btn disabled" disabled>
          <span>📄 Generate Report Card</span><span className="soon">Soon</span>
        </button>
      </div>
    </>
  );
}
