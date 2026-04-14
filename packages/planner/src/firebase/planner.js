// All Firestore reads and writes for the planner.
// No business logic — pure I/O only.
// All paths from constants/firestore.js — nothing hardcoded here.

import { doc, collection, onSnapshot, setDoc, deleteDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@homeschool/shared';
import { daySubjectsPath, cellPath, sickDayPath } from '../constants/firestore.js';

// Subscribes to all subjects present on one day for one student/week.
// cb receives: { [subject]: { lesson, note, done, flag } }
// A subject is present iff its document exists in the subjects subcollection.
// Returns the Firestore unsubscribe function.
export function subscribeDaySubjects(uid, weekId, student, dayIndex, cb) {
  const colRef = collection(db, daySubjectsPath(uid, weekId, student, dayIndex));
  return onSnapshot(colRef, snap => {
    const data = {};
    snap.forEach(d => { data[d.id] = d.data(); });
    cb(data);
  });
}

// Writes one day cell. merge:true so partial updates don't wipe other fields.
// data shape: { lesson: string, note: string, done: boolean, flag: boolean }
// Creating a cell document IS adding that subject to that day.
export function updateCell(uid, weekId, student, subject, dayIndex, data) {
  const path = cellPath(uid, weekId, student, dayIndex, subject);
  console.log('[updateCell] uid:', uid, 'weekId:', weekId, 'student:', student,
    'dayIndex:', dayIndex, 'subject:', subject, 'data:', JSON.stringify(data), 'path:', path);
  const ref = doc(db, path);
  const p = setDoc(ref, data, { merge: true });
  p.catch(err => console.error('[updateCell] Firestore FAILED:', err.code, err.message));
  return p;
}

// Reads one day cell. Returns data object or null if the document doesn't exist.
export async function readCell(uid, weekId, student, dayIndex, subject) {
  const snap = await getDoc(doc(db, cellPath(uid, weekId, student, dayIndex, subject)));
  return snap.exists() ? snap.data() : null;
}

// Deletes a cell document — removes a subject from a specific day only.
export function deleteCell(uid, weekId, student, dayIndex, subject) {
  return deleteDoc(doc(db, cellPath(uid, weekId, student, dayIndex, subject)));
}

// Deletes all cell documents for every day of a week for one student.
// Queries all 5 days in parallel, then deletes all found docs in parallel.
export async function deleteWeek(uid, weekId, student) {
  const snapshots = await Promise.all(
    [0, 1, 2, 3, 4].map(i =>
      getDocs(collection(db, daySubjectsPath(uid, weekId, student, i)))
    )
  );
  return Promise.all(
    snapshots.flatMap(snap => snap.docs.map(d => deleteDoc(d.ref)))
  );
}

// Writes a sick day marker for a specific date.
// dateString: "YYYY-MM-DD", subjectsShifted: string[]
export function writeSickDay(uid, dateString, student, subjectsShifted) {
  return setDoc(doc(db, sickDayPath(uid, dateString)), { student, date: dateString, subjectsShifted });
}

// Reads all subjects present on a specific day as a one-time snapshot (not reactive).
// Returns: { [subject]: { lesson, note, done, flag } }
export async function readDaySubjectsOnce(uid, weekId, student, dayIndex) {
  const snap = await getDocs(collection(db, daySubjectsPath(uid, weekId, student, dayIndex)));
  const data = {};
  snap.forEach(d => { data[d.id] = d.data(); });
  return data;
}

// Reads one sick day marker. Returns data or null if not found.
export async function readSickDay(uid, dateString) {
  const snap = await getDoc(doc(db, sickDayPath(uid, dateString)));
  return snap.exists() ? snap.data() : null;
}

// Deletes a sick day marker — removes the sick indicator for that date.
export function deleteSickDay(uid, dateString) {
  return deleteDoc(doc(db, sickDayPath(uid, dateString)));
}

// Returns true if an all-day event exists in the given subjects map.
// subjects: { [subject]: cellData } — the full dayData object for a day.
export function hasAllDayEvent(subjects) {
  return Object.prototype.hasOwnProperty.call(subjects, '__allday__');
}

// Returns the all-day event cell data or null if none exists.
// subjects: { [subject]: cellData }
export function getAllDayEvent(subjects) {
  return subjects['__allday__'] ?? null;
}

// Subscribes to sick day markers for the given week dates.
// dateStrings: array of "YYYY-MM-DD" strings (Mon-Fri of the current week).
// cb receives: { [dateString]: { student, date, subjectsShifted[] } }
export function subscribeSickDays(uid, dateStrings, cb) {
  const colRef = collection(db, `users/${uid}/sickDays`);
  return onSnapshot(colRef, snap => {
    const sickDays = {};
    snap.forEach(d => {
      if (dateStrings.includes(d.id)) sickDays[d.id] = d.data();
    });
    cb(sickDays);
  });
}
