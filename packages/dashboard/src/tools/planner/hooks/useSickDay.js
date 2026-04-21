import { useState, useEffect } from 'react';
import {
  subscribeSickDays,
  readDaySubjectsOnce,
  readCell,
  updateCell as fbWriteCell,
  deleteCell,
} from '../firebase/planner.js';
import { getWeekDates, toWeekId, mondayWeekId } from '../constants/days.js';

const ALL_DAY_KEY = 'allday';

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
// Friday overflow: before the cascade runs, this hook checks whether the
// current student has any non-allday lessons on Friday (dayIndex 4) and, if
// so, parks the pending sick-day confirmation in `fridayOverflow` state and
// exposes `showFridayOverflow` so PlannerLayout can render
// FridayOverflowSheet. The user picks Move to Monday, Delete & Start Fresh,
// or Cancel — the first two clear Friday and then run the pending cascade;
// Cancel discards the pending action without touching Firestore.
export function useSickDay({
  uid, weekId, student, day,
  performSickDay, performUndoSickDay,
  setDay, setShowSickDay, setShowUndoSickDay,
}) {
  const [sickDays, setSickDays] = useState({});
  const [fridayOverflow, setFridayOverflow] = useState(null); // { selectedSubjects, sickDayIndex } | null

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
    setFridayOverflow(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekId, student]);

  async function hasFridayLessons() {
    const friday = await readDaySubjectsOnce(uid, weekId, student, 4);
    return Object.keys(friday).some(k => k !== ALL_DAY_KEY);
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
    setShowSickDay(false);
    if (await hasFridayLessons()) {
      setFridayOverflow({ selectedSubjects, sickDayIndex });
      return;
    }
    await completeSickDay(selectedSubjects, sickDayIndex);
  }

  function nextMondayWeekId() {
    const [y, m, d] = weekId.split('-').map(Number);
    const plus7 = new Date(y, m - 1, d + 7);
    return mondayWeekId(toWeekId(plus7));
  }

  async function handleFridayMoveToMonday() {
    if (!fridayOverflow) return;
    const nextWeekId = nextMondayWeekId();
    const friday = await readDaySubjectsOnce(uid, weekId, student, 4);
    const entries = Object.entries(friday).filter(([k]) => k !== ALL_DAY_KEY);
    await Promise.all(entries.map(async ([subject, data]) => {
      await fbWriteCell(uid, nextWeekId, student, subject, 0, data);
      await deleteCell(uid, weekId, student, 4, subject);
    }));
    const pending = fridayOverflow;
    setFridayOverflow(null);
    await completeSickDay(pending.selectedSubjects, pending.sickDayIndex);
  }

  async function handleFridayDeleteFresh() {
    if (!fridayOverflow) return;
    const friday = await readDaySubjectsOnce(uid, weekId, student, 4);
    const subjects = Object.keys(friday).filter(k => k !== ALL_DAY_KEY);
    await Promise.all(subjects.map(subject => deleteCell(uid, weekId, student, 4, subject)));
    const pending = fridayOverflow;
    setFridayOverflow(null);
    await completeSickDay(pending.selectedSubjects, pending.sickDayIndex);
  }

  function handleFridayOverflowCancel() {
    setFridayOverflow(null);
  }

  async function handleUndoSickDay() {
    await performUndoSickDay();
    setShowUndoSickDay(false);
  }

  return {
    sickDayIndices, hasSickDayThisWeek, isSickDay,
    handleSickDayConfirm, handleUndoSickDay,
    showFridayOverflow: fridayOverflow !== null,
    handleFridayMoveToMonday, handleFridayDeleteFresh, handleFridayOverflowCancel,
  };
}
