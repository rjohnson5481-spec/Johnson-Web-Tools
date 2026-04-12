// Firestore reads and writes for user settings.
// No business logic — pure I/O only.
// All paths from constants/firestore.js.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@homeschool/shared';
import { settingsStudentsPath, settingsSubjectsPath } from '../constants/firestore.js';
import { SUBJECT_PRESETS } from '../constants/subjects.js';

const DEFAULT_STUDENTS = ['Orion', 'Malachi'];

// Reads student list. Returns names array; falls back to DEFAULT_STUDENTS if no doc.
export async function readSettingsStudents(uid) {
  const snap = await getDoc(doc(db, settingsStudentsPath(uid)));
  return snap.exists() ? snap.data().names : DEFAULT_STUDENTS;
}

// Writes student list.
export function writeSettingsStudents(uid, names) {
  return setDoc(doc(db, settingsStudentsPath(uid)), { names });
}

// Reads default subject presets for one student.
// Falls back to SUBJECT_PRESETS constant if no doc exists.
export async function readSettingsSubjects(uid, student) {
  const snap = await getDoc(doc(db, settingsSubjectsPath(uid, student)));
  return snap.exists() ? snap.data().subjects : [...SUBJECT_PRESETS];
}

// Writes default subject presets for one student.
export function writeSettingsSubjects(uid, student, subjects) {
  return setDoc(doc(db, settingsSubjectsPath(uid, student)), { subjects });
}
