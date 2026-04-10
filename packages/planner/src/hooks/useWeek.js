import { useState } from 'react';
import { getMondayOf, toWeekId, getWeekDates } from '../constants/days.js';

function currentWeekId() {
  return toWeekId(getMondayOf(new Date()));
}

// Manages week navigation state.
// weekId is always the Monday of the displayed week ("YYYY-MM-DD").
export function useWeek() {
  const [weekId, setWeekId] = useState(currentWeekId);

  function shiftWeek(days) {
    const [y, m, d] = weekId.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    setWeekId(toWeekId(date));
  }

  return {
    weekId,
    weekDates: getWeekDates(weekId),
    prevWeek: () => shiftWeek(-7),
    nextWeek: () => shiftWeek(7),
  };
}
