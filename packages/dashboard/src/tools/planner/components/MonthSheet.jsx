import { useState } from 'react';
import { MONTH_NAMES, getCalendarGrid } from '../constants/months.js';
import { getMondayOf, toWeekId } from '../constants/days.js';
import './MonthSheet.css';

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Props:
//   weekId    — current selected week ("YYYY-MM-DD" Monday)
//   onSelectDay(date) — called when a weekday cell is tapped
//   onClose   — called when backdrop or close button tapped
export default function MonthSheet({ weekId, onSelectDay, onClose }) {
  const today = new Date();

  const [display, setDisplay] = useState(() => {
    const [y, m] = weekId.split('-').map(Number);
    return { year: y, month: m - 1 }; // 0-indexed month
  });

  const cells = getCalendarGrid(display.year, display.month);

  function prevMonth() {
    setDisplay(d => d.month === 0
      ? { year: d.year - 1, month: 11 }
      : { year: d.year, month: d.month - 1 });
  }

  function nextMonth() {
    setDisplay(d => d.month === 11
      ? { year: d.year + 1, month: 0 }
      : { year: d.year, month: d.month + 1 });
  }

  function isToday(date) {
    return date
      && date.getFullYear() === today.getFullYear()
      && date.getMonth() === today.getMonth()
      && date.getDate() === today.getDate();
  }

  function isInSelectedWeek(date) {
    return date != null && toWeekId(getMondayOf(date)) === weekId;
  }

  function isWeekend(date) {
    if (!date) return false;
    const dow = date.getDay();
    return dow === 0 || dow === 6;
  }

  return (
    <div className="month-sheet-overlay" onClick={onClose}>
      <div className="month-sheet" onClick={e => e.stopPropagation()}>
        <div className="month-sheet-handle" />

        <div className="month-sheet-header">
          <button className="month-sheet-nav" onClick={prevMonth} aria-label="Previous month">
            ‹
          </button>
          <span className="month-sheet-title">
            {MONTH_NAMES[display.month]} {display.year}
          </span>
          <button className="month-sheet-nav" onClick={nextMonth} aria-label="Next month">
            ›
          </button>
          <button className="month-sheet-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="month-sheet-grid">
          {DAY_HEADERS.map(h => (
            <div key={h} className="month-sheet-dow">{h}</div>
          ))}
          {cells.map((date, i) => {
            const weekend   = isWeekend(date);
            const inWeek    = !weekend && isInSelectedWeek(date);
            const todayCell = isToday(date);
            const cls = [
              'month-sheet-cell',
              !date     ? 'month-sheet-cell--empty'   : '',
              weekend   ? 'month-sheet-cell--weekend'  : '',
              inWeek    ? 'month-sheet-cell--week'     : '',
              todayCell ? 'month-sheet-cell--today'    : '',
            ].filter(Boolean).join(' ');
            return (
              <button
                key={i}
                className={cls}
                disabled={!date || weekend}
                onClick={() => onSelectDay(date)}
              >
                {date ? date.getDate() : ''}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
