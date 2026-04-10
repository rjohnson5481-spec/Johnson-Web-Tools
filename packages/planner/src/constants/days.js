export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Returns the Monday of the week containing `date`.
export function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun, 1 = Mon … 6 = Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Formats a Date as the weekId string: "2026-08-17".
// Uses local date components to avoid UTC timezone shifts.
export function toWeekId(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Returns an array of 5 Date objects (Mon–Fri) for a given weekId.
export function getWeekDates(weekId) {
  const [y, m, d] = weekId.split('-').map(Number);
  const monday = new Date(y, m - 1, d); // local date, no UTC shift
  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

// "Apr 7–11, 2026"
export function formatWeekLabel(weekDates) {
  if (!weekDates?.length) return '';
  const fmt = (d, opts) => d.toLocaleDateString('en-US', opts);
  const start = fmt(weekDates[0], { month: 'short', day: 'numeric' });
  const end   = fmt(weekDates[4], { day: 'numeric' });
  return `${start}–${end}, ${weekDates[4].getFullYear()}`;
}

// Returns today's 0-based weekday index (Mon=0 … Fri=4).
// Returns 0 on weekends so the view defaults to Monday.
export function getTodayDayIndex() {
  const day = new Date().getDay(); // 0=Sun … 6=Sat
  if (day === 0 || day === 6) return 0;
  return day - 1;
}
