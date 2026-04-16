// All Firestore reads and writes for Academic Records.
// No business logic — pure I/O only.
// All paths from constants/academics.js — nothing hardcoded here.
//
// Cascading deletes are NOT performed automatically. Caller is responsible:
//   deleteSchoolYear → must clean up its quarters separately
//   deleteCourse     → must clean up its enrollments separately
//   deleteEnrollment → must clean up its grades separately

import {
  collection, doc, getDocs, getDoc, addDoc, setDoc, deleteDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore';
import { db, storage } from '@homeschool/shared';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  schoolYearDoc,
  quartersCol, quarterDoc,
  breaksCol, breakDoc,
  coursesCol, courseDoc,
  enrollmentsCol, enrollmentDoc,
  gradesCol, gradeDoc,
  reportNotesCol, reportNoteDoc,
  savedReportsCol, savedReportDoc,
} from '../constants/academics.js';

// ─── School Years ─────────────────────────────────────────────────────────

// Reads all school years for this user.
// Returns: [{ id, label, startDate, endDate }, ...] sorted by startDate ascending.
export async function getSchoolYears(uid) {
  const snap = await getDocs(collection(db, `users/${uid}/schoolYears`));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return rows.sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
}

// Writes a school year. setDoc + merge so partial updates don't wipe other fields.
// data shape: { label, startDate, endDate }
export function saveSchoolYear(uid, yearId, data) {
  const ref = doc(db, schoolYearDoc(uid, yearId));
  return setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// Deletes the school year document.
// NOTE: does NOT cascade — quarters subcollection must be cleaned up separately
// by the caller (iterate getQuarters → deleteQuarter).
export function deleteSchoolYear(uid, yearId) {
  return deleteDoc(doc(db, schoolYearDoc(uid, yearId)));
}

// ─── Quarters ─────────────────────────────────────────────────────────────

// Reads all quarters for a school year.
// Returns: [{ id, label, startDate, endDate }, ...] sorted by startDate ascending.
export async function getQuarters(uid, yearId) {
  const snap = await getDocs(collection(db, quartersCol(uid, yearId)));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return rows.sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
}

// Writes a quarter. data shape: { label, startDate, endDate }
export function saveQuarter(uid, yearId, quarterId, data) {
  const ref = doc(db, quarterDoc(uid, yearId, quarterId));
  return setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// Deletes one quarter.
export function deleteQuarter(uid, yearId, quarterId) {
  return deleteDoc(doc(db, quarterDoc(uid, yearId, quarterId)));
}

// ─── Breaks ──────────────────────────────────────────────────────────────

// Reads all breaks for a school year.
// Returns: [{ id, label, startDate, endDate }, ...] sorted by startDate ascending.
export async function getBreaks(uid, yearId) {
  const snap = await getDocs(collection(db, breaksCol(uid, yearId)));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return rows.sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
}

// Writes a break. data shape: { label, startDate, endDate }
export function saveBreak(uid, yearId, breakId, data) {
  const ref = doc(db, breakDoc(uid, yearId, breakId));
  return setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// Deletes one break.
export function deleteBreak(uid, yearId, breakId) {
  return deleteDoc(doc(db, breakDoc(uid, yearId, breakId)));
}

// ─── Courses ──────────────────────────────────────────────────────────────

// Reads all courses for this user.
// Returns: [{ id, name, curriculum, gradingType }, ...] sorted by name ascending.
export async function getCourses(uid) {
  const snap = await getDocs(collection(db, coursesCol(uid)));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return rows.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
}

// Updates an existing course by id. data shape: { name, curriculum, gradingType }
export function saveCourse(uid, courseId, data) {
  const ref = doc(db, courseDoc(uid, courseId));
  return setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// Adds a new course. Returns the new document id.
// data shape: { name, curriculum, gradingType }
export async function addCourse(uid, data) {
  const ref = await addDoc(collection(db, coursesCol(uid)), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Deletes a course.
// NOTE: does NOT cascade — enrollments referencing this courseId must be cleaned
// up separately by the caller.
export function deleteCourse(uid, courseId) {
  return deleteDoc(doc(db, courseDoc(uid, courseId)));
}

// ─── Enrollments ──────────────────────────────────────────────────────────

// Reads all enrollments for this user.
// Returns: [{ id, courseId, student, yearId, notes, syncPlanner }, ...]
// sorted by student ascending then courseId ascending.
export async function getEnrollments(uid) {
  const snap = await getDocs(collection(db, enrollmentsCol(uid)));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return rows.sort((a, b) => {
    const s = (a.student ?? '').localeCompare(b.student ?? '');
    if (s !== 0) return s;
    return (a.courseId ?? '').localeCompare(b.courseId ?? '');
  });
}

// Updates an existing enrollment.
// data shape: { courseId, student, yearId, notes, syncPlanner, gradeLevel }
export function saveEnrollment(uid, enrollmentId, data) {
  const ref = doc(db, enrollmentDoc(uid, enrollmentId));
  return setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// Adds a new enrollment. Returns the new document id.
// data shape: { courseId, student, yearId, notes, syncPlanner, gradeLevel }
export async function addEnrollment(uid, data) {
  const ref = await addDoc(collection(db, enrollmentsCol(uid)), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Deletes an enrollment.
// NOTE: does NOT cascade — grades referencing this enrollmentId must be cleaned
// up separately by the caller.
export function deleteEnrollment(uid, enrollmentId) {
  return deleteDoc(doc(db, enrollmentDoc(uid, enrollmentId)));
}

// ─── Grades ───────────────────────────────────────────────────────────────

// Reads all grades for this user.
// Returns: [{ id, enrollmentId, quarterId, grade, createdAt }, ...]
// sorted by createdAt ascending.
export async function getGrades(uid) {
  const snap = await getDocs(collection(db, gradesCol(uid)));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return rows.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? 0;
    return at - bt;
  });
}

// Reads grades for a specific enrollment.
// Returns: [{ id, enrollmentId, quarterId, grade, createdAt }, ...]
export async function getGradesByEnrollment(uid, enrollmentId) {
  const q = query(collection(db, gradesCol(uid)), where('enrollmentId', '==', enrollmentId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Updates an existing grade.
// data shape: { enrollmentId, quarterId, grade, percent }
// percent is a number (0–100) for letter scale grades, null for ESNU grades.
export function saveGrade(uid, gradeId, data) {
  const ref = doc(db, gradeDoc(uid, gradeId));
  return setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// Adds a new grade. Returns the new document id.
// data shape: { enrollmentId, quarterId, grade, percent }
// percent is a number (0–100) for letter scale grades, null for ESNU grades.
export async function addGrade(uid, data) {
  const ref = await addDoc(collection(db, gradesCol(uid)), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Deletes a grade.
export function deleteGrade(uid, gradeId) {
  return deleteDoc(doc(db, gradeDoc(uid, gradeId)));
}

// ─── Report Notes ────────────────────────────────────────────────────────

// Reads all report notes for this user.
// Returns: [{ id, student, quarterId, notes, updatedAt }, ...]
export async function getReportNotes(uid) {
  const snap = await getDocs(collection(db, reportNotesCol(uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Finds a report note for a specific student + quarter. Returns object or null.
export async function getReportNote(uid, student, quarterId) {
  const q = query(collection(db, reportNotesCol(uid)), where('student', '==', student), where('quarterId', '==', quarterId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

// Updates an existing report note.
// data shape: { student, quarterId, notes }
export function saveReportNote(uid, noteId, data) {
  const ref = doc(db, reportNoteDoc(uid, noteId));
  return setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// Adds a new report note. Returns the new document id.
// data shape: { student, quarterId, notes }
export async function addReportNote(uid, data) {
  const ref = await addDoc(collection(db, reportNotesCol(uid)), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── Saved Reports ───────────────────────────────────────────────────────

// Reads all saved report card snapshots for this user, newest first.
export async function getSavedReports(uid) {
  const snap = await getDocs(collection(db, savedReportsCol(uid)));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return rows.sort((a, b) => (b.generatedAt?.toMillis?.() ?? 0) - (a.generatedAt?.toMillis?.() ?? 0));
}

// Saves a new report card snapshot. Returns new document id.
export async function saveSavedReport(uid, data) {
  const ref = await addDoc(collection(db, savedReportsCol(uid)), {
    ...data,
    generatedAt: serverTimestamp(),
  });
  return ref.id;
}

// Deletes a saved report card (Firestore doc only — Storage handled separately).
export function deleteSavedReport(uid, reportId) {
  return deleteDoc(doc(db, savedReportDoc(uid, reportId)));
}

// ─── Report PDF Storage ──────────────────────────────────────────────────

// Uploads PDF bytes to Firebase Storage. Returns the download URL.
export async function uploadReportPDF(uid, reportId, pdfBytes) {
  const fileRef = storageRef(storage, `users/${uid}/reports/${reportId}.pdf`);
  await uploadBytes(fileRef, pdfBytes, { contentType: 'application/pdf' });
  return getDownloadURL(fileRef);
}

// Deletes a report PDF from Firebase Storage.
export async function deleteReportPDF(uid, reportId) {
  const fileRef = storageRef(storage, `users/${uid}/reports/${reportId}.pdf`);
  try { await deleteObject(fileRef); }
  catch (err) { if (err?.code !== 'storage/object-not-found') throw err; }
}
