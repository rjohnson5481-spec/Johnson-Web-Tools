import { useState, useEffect } from 'react';
import {
  subscribeDaySubjects,
  updateCell as dbUpdateCell,
  deleteCell as dbDeleteCell,
  deleteWeek as dbDeleteWeek,
  readCell as dbReadCell,
  writeSickDay as dbWriteSickDay,
  subscribeSickDays,
} from '../firebase/planner.js';
import { getWeekDates, toWeekId } from '../constants/days.js';

// Manages subjects and cell data for one specific day.
// Subjects are implicit: a subject exists on a day only when its cell doc exists.
// dayData shape: { [subject]: { lesson, note, done, flag } }
export function useSubjects(uid, weekId, student, day) {
  const [dayData, setDayData] = useState({});
  const [loading, setLoading] = useState(true);
  const [sickDays, setSickDays] = useState({});

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

  // Subscribe to sick day markers for the current week (all students).
  // Rebuilds when uid or weekId changes; student filtering is client-side.
  useEffect(() => {
    if (!uid) return;
    const dateStrings = getWeekDates(weekId).map(d => toWeekId(d));
    return subscribeSickDays(uid, dateStrings, setSickDays);
  }, [uid, weekId]);

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

  // Deletes all cells for an explicit weekId+student — used by PDF import wipe.
  function wipeWeek(targetWeekId, targetStudent) {
    return dbDeleteWeek(uid, targetWeekId, targetStudent);
  }

  // Cascades selected subjects forward within the current week only.
  // Each subject's chain builds through consecutive scheduled days (Mon–Fri).
  // If the chain reaches Friday, the Friday content is displaced (not written
  // to the following week) — it is simply dropped. Then writes a sick day marker.
  async function performSickDay(selectedSubjects) {
    await Promise.all(selectedSubjects.map(async subject => {
      const startData = dayData[subject];
      if (!startData) return;

      // Build unbroken chain from sick day through consecutive days in this week.
      const chain = [{ dayIndex: day, data: startData }];
      for (let d = day + 1; d <= 4; d++) {
        const data = await dbReadCell(uid, weekId, student, d, subject);
        if (!data) break;
        chain.push({ dayIndex: d, data });
      }

      // Write in reverse (safe — no read-after-write collisions).
      // Links whose dayIndex+1 > 4 (i.e., were on Friday) are not written —
      // their content is intentionally dropped at the end of the week.
      for (let i = chain.length - 1; i >= 0; i--) {
        const targetDay = chain[i].dayIndex + 1;
        if (targetDay <= 4) {
          await dbUpdateCell(uid, weekId, student, subject, targetDay, chain[i].data);
        }
      }

      // Delete the original sick-day cell.
      await dbDeleteCell(uid, weekId, student, day, subject);
    }));

    // Write sick day marker using today's date string.
    const dateString = toWeekId(getWeekDates(weekId)[day]);
    await dbWriteSickDay(uid, dateString, student, selectedSubjects);
  }

  // Set of day indices (0-4) that are sick days for the current student this week.
  const weekDates = getWeekDates(weekId);
  const sickDayIndices = new Set(
    weekDates.reduce((acc, date, i) => {
      const ds = toWeekId(date);
      if (sickDays[ds]?.student === student) acc.push(i);
      return acc;
    }, [])
  );

  const subjects = Object.keys(dayData);
  return {
    subjects, dayData, loading,
    updateCell, addSubject, removeSubject,
    importCell, deleteWeek, wipeWeek,
    performSickDay, sickDayIndices,
  };
}
