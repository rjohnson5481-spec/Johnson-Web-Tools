import { useEffect } from 'react';

// Sick-day surface for the planner: confirm/undo handlers + a defensive
// reset effect that closes the sheets on week/student change. Behavior is
// preserved from the inline implementation in PlannerLayout — isSickDay is
// still derived per-day via sickDayIndices.has(day).
export function useSickDay({
  sickDayIndices, day, weekId, student,
  performSickDay, performUndoSickDay,
  setDay, setShowSickDay, setShowUndoSickDay,
}) {
  // Defensive reset on week/student switch — Full Restore can swap the
  // underlying Firestore state out from under an open sheet.
  useEffect(() => {
    setShowSickDay(false);
    setShowUndoSickDay(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekId, student]);

  async function handleSickDayConfirm(selectedSubjects, sickDayIndex) {
    await performSickDay(selectedSubjects, sickDayIndex);
    setShowSickDay(false);
    // On desktop the SickDaySheet day pills can pick a sickDayIndex that
    // differs from the parent's `day`; sync so the per-day banner and the
    // currently-derived isSickDay reflect the sick column immediately.
    setDay(sickDayIndex);
  }

  async function handleUndoSickDay() {
    await performUndoSickDay();
    setShowUndoSickDay(false);
  }

  const isSickDay = sickDayIndices?.has(day);

  return { isSickDay, handleSickDayConfirm, handleUndoSickDay };
}
