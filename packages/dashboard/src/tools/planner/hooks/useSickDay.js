import { useState, useEffect } from 'react';
import {
  subscribeSickDays,
  readDaySubjectsOnce,
  readCell,
  updateCell as fbWriteCell,
  deleteCell,
} from '../firebase/planner.js';
import { getWeekDates, toWeekId } from '../constants/days.js';

const ALL_DAY_KEY = 'allday';
const FRIDAY_INDEX = 4;

// Owns the sick-day surface for the planner: a live Firestore subscription
// scoped to the current week + student, plus the confirm/undo handlers that
// were previously inline in PlannerLayout.
//
// hasSickDayThisWeek drives the Undo Sick Day button so it renders whenever
// a sick day exists for this student this week — independent of which day
// the user is currently viewing. A sick day triggered on mobile is therefore
// visible on desktop and vice versa, since both clients read the same
// /users/{uid}/sickDays/{date} markers in real time.
//
// Friday pre-confirm flow: if the current student has any non-allday lesson
// on Friday at confirm time, the cascade does NOT run — the pending
// selection is parked and FridayComingSoonSheet opens. Confirming on that
// sheet deletes Friday's lessons first and then runs the cascade. Cancel
// discards everything without writing to Firestore. Proper Friday handling
// (move-to-next-Monday, etc.) ships with the month view.
export function useSickDay({
  uid, weekId, student, day,
  performSickDay, performUndoSickDay,
  setDay, setShowSickDay, setShowUndoSickDay,
}) {
  const [sickDays, setSickDays] = useState({});
  const [showFridayComingSoon, setShowFridayComingSoon] = useState(false);
  const [pendingSickDay, setPendingSickDay] = useState(null); // { selectedSubjects, sickDayIndex } | null

  useEffect(() => {
    if (!uid) return;
    const dateStrings = getWeekDates(weekId).map(d => toWeekId(d));
    return subscribeSickDays(uid, dateStrings, setSickDays);
  }, [uid, weekId]);

  const sickDayIndices = new Set(
    getWeekDates(weekId).reduce((acc, date, i) => {
      if (sickDays[toWeekId(date)]?.student === student) acc.push(i);
      return acc;
    }, [])
  );
  const hasSickDayThisWeek = sickDayIndices.size > 0;
  const isSickDay = sickDayIndices.has(day);

  // Defensive reset on week/student switch — Full Restore can swap the
  // underlying Firestore state out from under an open sheet.
  useEffect(() => {
    setShowSickDay(false);
    setShowUndoSickDay(false);
    setShowFridayComingSoon(false);
    setPendingSickDay(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekId, student]);

  async function fridayLessonSubjects() {
    const friday = await readDaySubjectsOnce(uid, weekId, student, FRIDAY_INDEX);
    return Object.keys(friday).filter(k => k !== ALL_DAY_KEY);
  }

  async function completeSickDay(selectedSubjects, sickDayIndex) {
    await performSickDay(selectedSubjects, sickDayIndex);

    // Drop a "Sick Day" All Day Event on the sick column so the day is
    // labeled in the planner + home summary. Only written if the user
    // hasn't already placed an all-day event there.
    const existingAllDay = await readCell(uid, weekId, student, sickDayIndex, ALL_DAY_KEY);
    if (!existingAllDay) {
      await fbWriteCell(uid, weekId, student, ALL_DAY_KEY, sickDayIndex, {
        lesson: 'Sick Day', note: '', done: false, flag: false,
      });
    }

    // Jump to the sick column so the per-day banner + shifted lessons are
    // visible immediately. The Undo button no longer depends on this — it
    // reads hasSickDayThisWeek, not sickDayIndices.has(day).
    setDay(sickDayIndex);
  }

  async function handleSickDayConfirm(selectedSubjects, sickDayIndex) {
    const fridaySubjects = await fridayLessonSubjects();
    if (fridaySubjects.length > 0) {
      setPendingSickDay({ selectedSubjects, sickDayIndex });
      setShowSickDay(false);
      setShowFridayComingSoon(true);
      return;
    }
    setShowSickDay(false);
    await completeSickDay(selectedSubjects, sickDayIndex);
  }

  async function handleFridayComingSoonConfirm() {
    if (!pendingSickDay) return;
    const subjects = await fridayLessonSubjects();
    await Promise.all(subjects.map(s => deleteCell(uid, weekId, student, FRIDAY_INDEX, s)));
    const pending = pendingSickDay;
    setShowFridayComingSoon(false);
    setPendingSickDay(null);
    await completeSickDay(pending.selectedSubjects, pending.sickDayIndex);
  }

  function handleFridayComingSoonDismiss() {
    setShowFridayComingSoon(false);
    setPendingSickDay(null);
  }

  async function handleUndoSickDay() {
    await performUndoSickDay();
    setShowUndoSickDay(false);
  }

  return {
    sickDayIndices, hasSickDayThisWeek, isSickDay,
    handleSickDayConfirm, handleUndoSickDay,
    showFridayComingSoon,
    handleFridayComingSoonConfirm, handleFridayComingSoonDismiss,
  };
}
