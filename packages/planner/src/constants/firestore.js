// All Firestore path builders live here — never hardcode paths elsewhere.
// Data model:
//   /users/{uid}/weeks/{weekId}/students/{student}/subjects/{subject}/days/{0-4}
//   /users/{uid}/subjectLists/{student}

export const weekPath = (uid, weekId) =>
  `users/${uid}/weeks/${weekId}`;

export const studentPath = (uid, weekId, student) =>
  `users/${uid}/weeks/${weekId}/students/${student}`;

export const subjectPath = (uid, weekId, student, subject) =>
  `users/${uid}/weeks/${weekId}/students/${student}/subjects/${subject}`;

export const dayPath = (uid, weekId, student, subject, dayIndex) =>
  `users/${uid}/weeks/${weekId}/students/${student}/subjects/${subject}/days/${dayIndex}`;

export const subjectListPath = (uid, student) =>
  `users/${uid}/subjectLists/${student}`;
