// All Firestore reads and writes for the reward tracker.
// No business logic — pure I/O only.

import {
  doc, collection, onSnapshot, setDoc, getDoc, addDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@homeschool/shared';

const STUDENTS = ['Orion', 'Malachi'];
const SEEDS = { Orion: 50, Malachi: 60 };

// Path helpers
function studentDocPath(uid, student) {
  return `users/${uid}/rewardTracker/${student}`;
}
function logColPath(uid, student) {
  return `users/${uid}/rewardTracker/${student}/log`;
}

// Seeds initial points for each student if the doc does not already exist.
// Uses a localStorage flag to avoid hitting Firestore on every load.
export async function seedIfNeeded(uid) {
  const key = `rewardTracker_seeded_${uid}`;
  if (localStorage.getItem(key) === 'done') return;

  for (const student of STUDENTS) {
    const ref = doc(db, studentDocPath(uid, student));
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { points: SEEDS[student] });
    }
  }
  localStorage.setItem(key, 'done');
}

// Subscribes to the points doc for one student.
// cb receives: number (current points)
export function subscribePoints(uid, student, cb) {
  const ref = doc(db, studentDocPath(uid, student));
  return onSnapshot(ref, snap => {
    cb(snap.exists() ? (snap.data().points ?? 0) : 0);
  });
}

// Awards points: increments balance and appends a log entry.
export async function awardPoints(uid, student, delta, note) {
  const ref = doc(db, studentDocPath(uid, student));
  const snap = await getDoc(ref);
  const current = snap.exists() ? (snap.data().points ?? 0) : 0;
  await setDoc(ref, { points: current + delta }, { merge: true });
  await addDoc(collection(db, logColPath(uid, student)), {
    type: 'award', points: delta, note: note.trim(), createdAt: serverTimestamp(),
  });
}

// Deducts points: decrements balance (floor 0) and appends a log entry.
export async function deductPoints(uid, student, delta, note) {
  const ref = doc(db, studentDocPath(uid, student));
  const snap = await getDoc(ref);
  const current = snap.exists() ? (snap.data().points ?? 0) : 0;
  const next = Math.max(0, current - delta);
  await setDoc(ref, { points: next }, { merge: true });
  await addDoc(collection(db, logColPath(uid, student)), {
    type: 'deduct', points: delta, note: note.trim(), createdAt: serverTimestamp(),
  });
}

// Spends points: decrements balance (floor 0) and appends a log entry.
export async function spendPoints(uid, student, delta, note) {
  const ref = doc(db, studentDocPath(uid, student));
  const snap = await getDoc(ref);
  const current = snap.exists() ? (snap.data().points ?? 0) : 0;
  const next = Math.max(0, current - delta);
  await setDoc(ref, { points: next }, { merge: true });
  await addDoc(collection(db, logColPath(uid, student)), {
    type: 'spend', points: delta, note: note.trim(), createdAt: serverTimestamp(),
  });
}

// Subscribes to log entries for one student, newest first.
// cb receives: array of { id, type, points, note, createdAt }
export function subscribeLog(uid, student, cb) {
  const q = query(
    collection(db, logColPath(uid, student)),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
