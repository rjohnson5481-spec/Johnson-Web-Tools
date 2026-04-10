// All Firestore path builders live here — never hardcode paths elsewhere.
// Data model:
//   /users/{uid}/weeks/{weekId}/students/{student}/days/{dayIndex}/subjects/{subject}
//   → { lesson, note, done, flag }
// Subjects are implicit: a subject exists on a day only when its document exists.

export const weekPath = (uid, weekId) =>
  `users/${uid}/weeks/${weekId}`;

export const studentPath = (uid, weekId, student) =>
  `users/${uid}/weeks/${weekId}/students/${student}`;

// Collection of all subjects present on a given day.
export const daySubjectsPath = (uid, weekId, student, dayIndex) =>
  `users/${uid}/weeks/${weekId}/students/${student}/days/${dayIndex}/subjects`;

// Individual cell document (one subject on one day).
export const cellPath = (uid, weekId, student, dayIndex, subject) =>
  `users/${uid}/weeks/${weekId}/students/${student}/days/${dayIndex}/subjects/${subject}`;
