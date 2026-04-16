// All Firestore path builders for Academic Records — never hardcode paths elsewhere.
// Data model:
//   /users/{uid}/schoolYears/{yearId}                       → { label, startDate, endDate }
//   /users/{uid}/schoolYears/{yearId}/quarters/{quarterId}  → { label, startDate, endDate }
//   /users/{uid}/schoolYears/{yearId}/breaks/{breakId}      → { label, startDate, endDate }
//   /users/{uid}/courses/{courseId}                         → { name, curriculum, gradingType }
//   /users/{uid}/enrollments/{enrollmentId}                 → { courseId, student, yearId, notes, syncPlanner }
//   /users/{uid}/grades/{gradeId}                           → { enrollmentId, quarterId, grade }
//
// Courses, enrollments, and grades are top-level per-user collections (not nested under
// schoolYears) so a course can be reused across years and a grade lookup doesn't need
// the year. Cross-references are by document id stored as fields.

// ── School years ──────────────────────────────────────────────────────────
export const schoolYearDoc = (uid, yearId) =>
  `users/${uid}/schoolYears/${yearId}`;

// ── Quarters (subcollection of a school year) ─────────────────────────────
export const quartersCol = (uid, yearId) =>
  `users/${uid}/schoolYears/${yearId}/quarters`;

export const quarterDoc = (uid, yearId, quarterId) =>
  `users/${uid}/schoolYears/${yearId}/quarters/${quarterId}`;

// ── Breaks (subcollection of a school year) ───────────────────────────────
export const breaksCol = (uid, yearId) =>
  `users/${uid}/schoolYears/${yearId}/breaks`;

export const breakDoc = (uid, yearId, breakId) =>
  `users/${uid}/schoolYears/${yearId}/breaks/${breakId}`;

// ── Courses ───────────────────────────────────────────────────────────────
export const coursesCol = (uid) =>
  `users/${uid}/courses`;

export const courseDoc = (uid, courseId) =>
  `users/${uid}/courses/${courseId}`;

// ── Enrollments (course × student × year) ─────────────────────────────────
export const enrollmentsCol = (uid) =>
  `users/${uid}/enrollments`;

export const enrollmentDoc = (uid, enrollmentId) =>
  `users/${uid}/enrollments/${enrollmentId}`;

// ── Grades (one row per enrollment × quarter) ─────────────────────────────
export const gradesCol = (uid) =>
  `users/${uid}/grades`;

export const gradeDoc = (uid, gradeId) =>
  `users/${uid}/grades/${gradeId}`;

// ── Grading type constants (mirror the keys in scales.js GRADING_TYPES) ───
export const GRADING_TYPE_LETTER = 'letter';
export const GRADING_TYPE_ESNU   = 'esnu';

// ── Grade levels ──────────────────────────────────────────────────────────
export const GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
