import { useState, useEffect } from 'react';
import {
  subscribeDaySubjects,
  updateCell as dbUpdateCell,
  deleteCell as dbDeleteCell,
  deleteWeek as dbDeleteWeek,
} from '../firebase/planner.js';

// Manages subjects and cell data for one specific day.
// Subjects are implicit: a subject exists on a day only when its cell doc exists.
// dayData shape: { [subject]: { lesson, note, done, flag } }
export function useSubjects(uid, weekId, student, day) {
  const [dayData, setDayData] = useState({});
  const [loading, setLoading] = useState(true);

  // Subscribe to all subject cells for the current day.
  // Rebuilds whenever uid, weekId, student, or day changes.
  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const unsub = subscribeDaySubjects(uid, weekId, student, day, data => {
      setDayData(data);
      setLoading(false);
    });
    return () => { unsub(); setDayData({}); setLoading(true); };
  }, [uid, weekId, student, day]);

  // Creating a cell IS adding that subject to the current day.
  function addSubject(subject) {
    return dbUpdateCell(uid, weekId, student, subject, day,
      { lesson: '', note: '', done: false, flag: false });
  }

  // Deleting a cell removes the subject from the current day only.
  function removeSubject(subject) {
    return dbDeleteCell(uid, weekId, student, day, subject);
  }

  // dayIndex param kept so PDF import can write to any day, not just current.
  // Trims text fields to prevent phantom cells from whitespace values.
  function updateCell(subject, dayIndex, data) {
    const cleaned = {
      ...data,
      lesson: (data.lesson ?? '').trim(),
      note:   (data.note   ?? '').trim(),
    };
    return dbUpdateCell(uid, weekId, student, subject, dayIndex, cleaned);
  }

  // Deletes all cells for the current week/student — clears the whole week.
  function deleteWeek() {
    return dbDeleteWeek(uid, weekId, student);
  }

  // Writes to an explicit weekId+student — used by PDF import so the data
  // lands in the correct week/student regardless of the current view.
  function importCell(importWeekId, importStudent, subject, dayIndex, data) {
    const cleaned = {
      ...data,
      lesson: (data.lesson ?? '').trim(),
      note:   (data.note   ?? '').trim(),
    };
    return dbUpdateCell(uid, importWeekId, importStudent, subject, dayIndex, cleaned);
  }

  const subjects = Object.keys(dayData);
  return { subjects, dayData, loading, updateCell, addSubject, removeSubject, importCell, deleteWeek };
}
