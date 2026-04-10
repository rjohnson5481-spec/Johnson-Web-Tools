// All Firestore reads and writes for the planner.
// No business logic — pure I/O only.
// All paths from constants/firestore.js — nothing hardcoded here.

import { doc, collection, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@homeschool/shared';
import { daySubjectsPath, cellPath } from '../constants/firestore.js';

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
  const ref = doc(db, cellPath(uid, weekId, student, dayIndex, subject));
  return setDoc(ref, data, { merge: true });
}

// Deletes a cell document — removes a subject from a specific day only.
export function deleteCell(uid, weekId, student, dayIndex, subject) {
  return deleteDoc(doc(db, cellPath(uid, weekId, student, dayIndex, subject)));
}
